import { createHash, randomUUID } from 'node:crypto';
import { lstat, readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { pox5 } from '@bitgo/utxo-descriptors';
import * as utxolib from '@bitgo/utxo-lib';
import { getNewSignatureCount, signWithKey, toUtxoPsbt, toWrappedPsbt } from '@bitgo/utxo-core/descriptor';
import { Descriptor } from '@bitgo/wasm-utxo';
import { coins, UtxoCoin } from '@bitgo/statics';
import type {
  IWallet,
  PrebuildTransactionOptions,
  PrebuildTransactionResult,
  SubmitTransactionOptions,
} from '@bitgo/sdk-core';

import {
  createBitGoApiClient,
  createBitGoWallet,
  getBitGoApiToken,
  getPox5WalletSpecific,
  isFixedScriptMainWallet,
  listBitGoWallets,
  outpointFromUnspent,
  parseBitGoCoin,
  parseBitGoEnvironment,
  parsePositiveSats,
  redactBitGoError,
  responseUnspents,
  summarizeUnspent,
  summarizeBitGoWallet,
  type BitGoCoinName,
  type BitGoEnvironment,
  walletCoinSpecifics,
} from './bitgo-api';

export interface BitGoApiCliArgs {
  area?: string;
  action?: string;
  apiEnv?: string;
  coin?: string;
  walletId?: string;
  label?: string;
  enterprise?: string;
  amountSats?: string;
  unlockHeight?: number;
  principalPreimageFile?: string;
  earlyExitKeyFile?: string;
  outpoint?: string;
  psbtOut?: string;
  buildOnly?: boolean;
  yes?: boolean;
  json?: boolean;
}

export type Pox5StakingBuildParams = PrebuildTransactionOptions & {
  type: 'staking';
  recipients: [];
  stakingParams: {
    actionType: 'delegate';
    requestId: string;
    pox5: {
      amount: string;
      unlockHeight: number;
      stakerCommitment: string;
      earlyExitKey: string;
    };
  };
  noSplitChange: true;
  txFormat: 'psbt';
};

export interface ParsedOutpoint {
  txid: string;
  vout: number;
  id: string;
}

export type ConfirmationResult<T> =
  | { status: 'build-only' }
  | { status: 'cancelled' }
  | { status: 'submitted'; result: T };

export interface Pox5DescriptorInfo {
  unlockHeight: number;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
}

interface ApiContext {
  environment: BitGoEnvironment;
  coinName: BitGoCoinName;
  bitgo: ReturnType<typeof createBitGoApiClient>;
  coin: ReturnType<ReturnType<typeof createBitGoApiClient>['coin']>;
  network: utxolib.Network;
}

interface OutputSummary {
  address: string;
  amountSats: string;
}

export interface TransactionSummary {
  txid: string;
  locktime: number;
  feeSats: string;
  outputs: OutputSummary[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUtxolibNetworkName(name: string): name is keyof typeof utxolib.networks {
  return Object.prototype.hasOwnProperty.call(utxolib.networks, name);
}

export function networkForCoin(coinName: BitGoCoinName): utxolib.Network {
  const coin = coins.get(coinName);
  if (!(coin instanceof UtxoCoin)) throw new Error(`${coinName} is not a statics UTXO coin`);
  const networkName = coin.network.utxolibName;
  if (!isUtxolibNetworkName(networkName)) {
    throw new Error(`${coinName} has no registered utxo-lib network (${networkName})`);
  }
  return utxolib.networks[networkName];
}

function requiredString(value: unknown, name: string, maxLength = 256): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new Error(`${name} must be a non-empty string of at most ${maxLength} characters`);
  }
  return value;
}

function scalar(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') return undefined;
  return String(value);
}

function positiveInteger(value: unknown, name: string): number {
  const parsed = typeof value === 'string' && /^[1-9][0-9]*$/.test(value) ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function parseOutpoint(value: unknown): ParsedOutpoint {
  const text = requiredString(value, 'Outpoint', 80);
  const match = /^([0-9a-f]{64}):([0-9]+)$/i.exec(text);
  if (!match) throw new Error('Outpoint must have the form <64-character txid>:<vout>');
  const vout = Number(match[2]);
  if (!Number.isSafeInteger(vout) || vout < 0) throw new Error('Outpoint vout must be a non-negative integer');
  const txid = match[1].toLowerCase();
  return { txid, vout, id: `${txid}:${vout}` };
}

export function makePox5StakingBuildParams(args: {
  amountSats: unknown;
  unlockHeight: unknown;
  principalPreimage: Uint8Array;
  earlyExitKey: Uint8Array;
  requestId?: string;
  unspents?: string[];
}): Pox5StakingBuildParams {
  if (args.principalPreimage.length !== 32) throw new Error('PoX-5 principal preimage must be exactly 32 bytes');
  if (args.earlyExitKey.length !== 33 || (args.earlyExitKey[0] !== 0x02 && args.earlyExitKey[0] !== 0x03)) {
    throw new Error('PoX-5 early-exit key must be a compressed public key');
  }
  return {
    type: 'staking',
    recipients: [],
    stakingParams: {
      actionType: 'delegate',
      requestId: args.requestId ?? randomUUID(),
      pox5: {
        amount: parsePositiveSats(args.amountSats, 'Stake amount'),
        unlockHeight: positiveInteger(args.unlockHeight, 'Unlock height'),
        stakerCommitment: createHash('sha256').update(args.principalPreimage).digest('hex'),
        earlyExitKey: Buffer.from(args.earlyExitKey).toString('hex'),
      },
    },
    noSplitChange: true,
    txFormat: 'psbt',
    ...(args.unspents ? { unspents: args.unspents } : {}),
  };
}

export function makePox5ExitBuildParams(args: {
  address: string;
  outpoint: string;
  branch: 'early' | 'late';
  principalPreimage?: Uint8Array;
}): PrebuildTransactionOptions {
  const unstakingParams =
    args.branch === 'early'
      ? {
          pox5: {
            branch: 'early-exit' as const,
            principalPreimage: Buffer.from(args.principalPreimage ?? []).toString('hex'),
          },
        }
      : undefined;
  if (args.branch === 'early' && args.principalPreimage?.length !== 32) {
    throw new Error('PoX-5 early exit requires a 32-byte principal preimage');
  }
  return {
    recipients: [{ address: args.address, amount: 'max' }],
    unspents: [args.outpoint],
    txFormat: 'psbt',
    noSplitChange: true,
    ...(unstakingParams ? { unstakingParams } : {}),
  };
}

export function assertEarlyExitMaterials(
  principalPreimage: Uint8Array,
  earlyExitKey: Uint8Array,
  descriptor: Pox5DescriptorInfo
): void {
  if (principalPreimage.length !== 32) throw new Error('PoX-5 principal preimage must be exactly 32 bytes');
  if (!createHash('sha256').update(principalPreimage).digest().equals(descriptor.stakerCommitment)) {
    throw new Error('PoX-5 principal preimage does not match the lockup commitment');
  }
  if (!Buffer.from(earlyExitKey).equals(descriptor.earlyExitKey)) {
    throw new Error('Early-exit key does not match the lockup descriptor');
  }
}

async function readProtectedFile(filePath: string, purpose: string): Promise<string> {
  const file = await lstat(filePath);
  if (!file.isFile() || file.isSymbolicLink()) throw new Error(`${purpose} must be a regular file`);
  if (process.platform !== 'win32' && (file.mode & 0o077) !== 0) {
    throw new Error(`${purpose} file permissions must be 0600 or stricter`);
  }
  return (await readFile(filePath, 'utf8')).trim();
}

function parsePreimageHex(value: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(value))
    throw new Error('Principal preimage file must contain 32-byte hexadecimal data');
  return Buffer.from(value, 'hex');
}

export function signEarlyExitBranch(
  psbt: utxolib.bitgo.UtxoPsbt,
  key: utxolib.ECPairInterface,
  network: utxolib.Network
): utxolib.bitgo.UtxoPsbt {
  const wrapped = toWrappedPsbt(psbt);
  if (getNewSignatureCount(signWithKey(wrapped, key)) === 0) {
    throw new Error('Early-exit test key did not sign any input');
  }
  return toUtxoPsbt(wrapped, network);
}

async function promptSecret(prompt: string): Promise<string> {
  const envPassphrase = process.env.BITGO_WALLET_PASSPHRASE;
  if (envPassphrase) return envPassphrase;
  if (!stdin.isTTY) {
    throw new Error('Wallet passphrase requires a TTY prompt or BITGO_WALLET_PASSPHRASE in non-interactive use');
  }

  const previousRawMode = stdin.isRaw;
  stdout.write(`${prompt}: `);
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();

  return await new Promise<string>((resolve, reject) => {
    let value = '';
    const restore = (): void => {
      stdin.off('data', onData);
      stdin.setRawMode(previousRawMode ?? false);
      stdin.pause();
      stdout.write('\n');
    };
    const onData = (chunk: string | Buffer): void => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          restore();
          reject(new Error('Secret prompt cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          restore();
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    stdin.on('data', onData);
  });
}

async function confirmMutation(message: string, yes: boolean | undefined): Promise<boolean> {
  if (yes) return true;
  if (!stdin.isTTY) throw new Error('Interactive confirmation required; use --yes only for test/staging automation');
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return (await readline.question(`${message} [y/N] `)).trim().toLowerCase() === 'y';
  } finally {
    readline.close();
  }
}

export async function confirmAndSubmit<T>(
  buildOnly: boolean | undefined,
  confirm: () => Promise<boolean>,
  submit: () => Promise<T>
): Promise<ConfirmationResult<T>> {
  if (buildOnly) return { status: 'build-only' };
  if (!(await confirm())) return { status: 'cancelled' };
  return { status: 'submitted', result: await submit() };
}

function assertFixedScriptWallet(wallet: IWallet): void {
  if (!isFixedScriptMainWallet(summarizeBitGoWallet(wallet))) {
    throw new Error('Select a hot, fixed-script on-chain wallet, not a paired staking wallet');
  }
}

function getPairedWalletId(wallet: IWallet): string {
  const value = getPox5WalletSpecific(wallet)?.pairedWalletId;
  if (typeof value !== 'string') throw new Error('No PoX-5 paired staking wallet is linked to the selected wallet');
  return value;
}

export function descriptorDetails(wallet: IWallet): Pox5DescriptorInfo[] {
  const descriptorValues = new Set<string>();
  for (const coinSpecific of walletCoinSpecifics(wallet)) {
    if (!Array.isArray(coinSpecific.descriptors)) continue;
    for (const item of coinSpecific.descriptors) {
      if (isRecord(item) && typeof item.value === 'string') descriptorValues.add(item.value);
    }
  }
  return [...descriptorValues].flatMap((value) => {
    const info = pox5.parsePox5LockupDescriptor(Descriptor.fromString(value, 'derivable'));
    return info ? [info] : [];
  });
}

function isBlockHeightProvider(value: unknown): value is { getLatestBlockHeight(): Promise<number> } {
  return isRecord(value) && typeof value.getLatestBlockHeight === 'function';
}

export async function latestBlockHeight(coin: unknown): Promise<number> {
  if (!isBlockHeightProvider(coin)) {
    throw new Error('Selected BitGo coin does not expose the current Bitcoin block height');
  }
  const height = await coin.getLatestBlockHeight();
  if (!Number.isSafeInteger(height) || height < 0)
    throw new Error('BitGo returned an invalid current Bitcoin block height');
  return height;
}

export function decodePsbt(prebuild: PrebuildTransactionResult, network: utxolib.Network): utxolib.bitgo.UtxoPsbt {
  if (typeof prebuild.txHex === 'string') {
    return utxolib.bitgo.createPsbtFromBuffer(Buffer.from(prebuild.txHex, 'hex'), network);
  }
  if (typeof prebuild.txBase64 === 'string') {
    return utxolib.bitgo.createPsbtFromBuffer(Buffer.from(prebuild.txBase64, 'base64'), network);
  }
  throw new Error('BitGo did not return a PSBT for the transaction build');
}

export function replacePsbt(
  prebuild: PrebuildTransactionResult,
  psbt: utxolib.bitgo.UtxoPsbt
): PrebuildTransactionResult {
  return { ...prebuild, txHex: psbt.toBuffer().toString('hex'), txBase64: undefined };
}

export function transactionSummary(
  prebuild: PrebuildTransactionResult,
  psbt: utxolib.bitgo.UtxoPsbt,
  network: utxolib.Network
): TransactionSummary {
  const outputs = psbt.getUnsignedTx().outs.map((output) => {
    let address = 'unknown script';
    if (output.script[0] === 0x6a) {
      address = 'OP_RETURN';
    } else {
      try {
        address = utxolib.address.fromOutputScript(output.script, network);
      } catch {
        address = `script:${output.script.toString('hex')}`;
      }
    }
    return { address, amountSats: String(output.value) };
  });
  const feeSats = scalar(prebuild.feeInfo?.feeString ?? prebuild.feeInfo?.fee);
  if (feeSats === undefined) throw new Error('BitGo prebuild has no inspectable fee');
  return {
    txid: psbt.getUnsignedTx().getId(),
    locktime: psbt.locktime,
    feeSats,
    outputs,
  };
}

function printResult(label: string, value: unknown, json: boolean | undefined): void {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  console.log(label);
  console.log(JSON.stringify(value, null, 2));
}

function printPreview(label: string, summary: TransactionSummary, pairedWalletId?: string): void {
  console.log(`${label}: ${summary.txid}`);
  if (pairedWalletId) console.log(`Paired staking wallet: ${pairedWalletId}`);
  console.log(`Fee: ${summary.feeSats} sats`);
  console.log(`Locktime: ${summary.locktime}`);
  summary.outputs.forEach((output) => console.log(`  ${output.amountSats} sats -> ${output.address}`));
}

async function savePsbt(psbt: utxolib.bitgo.UtxoPsbt, path: string | undefined): Promise<string> {
  if (!path) throw new Error('--psbt-out is required with --build-only');
  const outputPath = path;
  await writeFile(outputPath, psbt.toBuffer(), { flag: 'wx', mode: 0o600 });
  return outputPath;
}

export async function signAndSubmit(
  wallet: IWallet,
  prebuild: PrebuildTransactionResult,
  walletPassphrase: string
): Promise<Record<string, unknown>> {
  const signed = await wallet.signTransaction({ txPrebuild: prebuild, walletPassphrase });
  const submissionOptions = getSubmissionOptions(signed);
  const submission = await wallet.submitTransaction(submissionOptions);
  if (!isRecord(submission)) return { submitted: true };
  return {
    submitted: true,
    ...(typeof submission.txid === 'string' ? { txid: submission.txid } : {}),
    ...(typeof submission.status === 'string' ? { status: submission.status } : {}),
  };
}

function getSubmissionOptions(signed: unknown): SubmitTransactionOptions {
  if (!isRecord(signed)) throw new Error('BitGo did not return a signed transaction');
  const halfSigned = signed.halfSigned;
  if (isRecord(halfSigned)) {
    const halfSignedOptions: NonNullable<SubmitTransactionOptions['halfSigned']> = {};
    if (typeof halfSigned.txHex === 'string') halfSignedOptions.txHex = halfSigned.txHex;
    if (typeof halfSigned.txBase64 === 'string') halfSignedOptions.txBase64 = halfSigned.txBase64;
    if (typeof halfSigned.payload === 'string') halfSignedOptions.payload = halfSigned.payload;
    if (typeof halfSigned.signedChildPsbt === 'string') halfSignedOptions.signedChildPsbt = halfSigned.signedChildPsbt;
    if (Object.keys(halfSignedOptions).length > 0) return { halfSigned: halfSignedOptions };
  }
  if (typeof signed.txHex === 'string') return { txHex: signed.txHex };
  throw new Error('BitGo did not return a half-signed UTXO transaction');
}

async function runAuth(context: ApiContext, json: boolean | undefined): Promise<void> {
  await context.bitgo.get(context.bitgo.url('/user/me')).result();
  printResult('Authenticated with BitGo API', { environment: context.environment, coin: context.coinName }, json);
}

async function runWalletList(context: ApiContext, json: boolean | undefined): Promise<void> {
  const wallets = await listBitGoWallets(context.bitgo, context.coinName);
  printResult(`Found ${wallets.length} ${context.coinName} wallets`, { wallets }, json);
}

async function runWalletCreate(context: ApiContext, args: BitGoApiCliArgs, secrets: string[]): Promise<void> {
  const label = requiredString(args.label, 'Wallet label', 80).trim();
  if (label.length === 0) throw new Error('Wallet label must not be blank');
  if (
    !(await confirmMutation(
      `Create a hot on-chain wallet on ${context.environment} for ${context.coinName}?`,
      args.yes
    ))
  ) {
    console.log('Wallet creation cancelled');
    return;
  }
  const passphrase = await promptSecret('Wallet passphrase');
  secrets.push(passphrase);
  const wallet = await createBitGoWallet(context.bitgo, context.coinName, {
    label,
    walletPassphrase: passphrase,
    ...(args.enterprise ? { enterprise: args.enterprise } : {}),
  });
  printResult('Created fixed-script wallet', wallet, args.json);
}

async function runStakeBuild(context: ApiContext, args: BitGoApiCliArgs, secrets: string[]): Promise<void> {
  const walletId = requiredString(args.walletId, 'Wallet ID', 128);
  const amountSats = parsePositiveSats(args.amountSats, 'Stake amount');
  const unlockHeight = positiveInteger(args.unlockHeight, 'Unlock height');
  const currentBlockHeight = await latestBlockHeight(context.coin);
  if (unlockHeight <= currentBlockHeight) {
    throw new Error(`New lockup height must be in the future; current height is ${currentBlockHeight}`);
  }
  const principalPreimage = parsePreimageHex(
    await readProtectedFile(
      requiredString(args.principalPreimageFile, 'Principal preimage file', 1024),
      'Principal preimage'
    )
  );
  const keyWif = await readProtectedFile(
    requiredString(args.earlyExitKeyFile, 'Early-exit key file', 1024),
    'Early-exit key'
  );
  secrets.push(principalPreimage.toString('hex'), keyWif);
  const mainWallet = await context.coin.wallets().get({ id: walletId });
  assertFixedScriptWallet(mainWallet);
  const keyPair = utxolib.ECPair.fromWIF(keyWif, context.network);
  if (!keyPair.privateKey || keyPair.publicKey.length !== 33) {
    throw new Error('Early-exit key file must contain a compressed WIF private key');
  }
  const stakingParams = makePox5StakingBuildParams({
    amountSats,
    unlockHeight,
    principalPreimage,
    earlyExitKey: keyPair.publicKey,
  });
  if (
    !(await confirmMutation(
      'Build a PoX-5 Bitcoin transaction? The paired wallet is created during the build.',
      args.yes
    ))
  ) {
    console.log('Stake build cancelled');
    return;
  }
  const prebuild = await mainWallet.prebuildTransaction(stakingParams);
  const psbt = decodePsbt(prebuild, context.network);
  const pairWalletId = getPairedWalletId(await context.coin.wallets().get({ id: walletId }));
  const summary = transactionSummary(prebuild, psbt, context.network);
  printPreview('PoX-5 deposit prebuild', summary, pairWalletId);
  const outcome = await confirmAndSubmit(
    args.buildOnly,
    () => confirmMutation('Sign and submit this BTC deposit?', args.yes),
    async () => {
      const passphrase = await promptSecret('Wallet passphrase');
      secrets.push(passphrase);
      return await signAndSubmit(mainWallet, prebuild, passphrase);
    }
  );
  if (outcome.status === 'build-only') {
    const psbtPath = await savePsbt(psbt, args.psbtOut);
    console.log(`PSBT saved to ${psbtPath}; it has not been signed or submitted`);
    return;
  }
  if (outcome.status === 'cancelled') {
    console.log(`Deposit not submitted; paired wallet ${pairWalletId} remains created`);
    return;
  }
  printResult('Deposit submitted', { ...outcome.result, pairedWalletId: pairWalletId }, args.json);
}

async function runStakeStatus(context: ApiContext, args: BitGoApiCliArgs): Promise<void> {
  const walletId = requiredString(args.walletId, 'Wallet ID', 128);
  const mainWallet = await context.coin.wallets().get({ id: walletId });
  assertFixedScriptWallet(mainWallet);
  const mainSummary = summarizeBitGoWallet(mainWallet);
  if (!mainSummary.pairedWalletId) {
    printResult('No PoX-5 paired wallet yet', { wallet: mainSummary, stakedUnspents: [] }, args.json);
    return;
  }
  const pairedWallet = await context.coin.wallets().get({ id: mainSummary.pairedWalletId });
  const [rawUnspents, height] = await Promise.all([
    pairedWallet.unspents({ limit: 100 }),
    latestBlockHeight(pairedWallet.baseCoin),
  ]);
  const unspents = responseUnspents(rawUnspents).map(summarizeUnspent);
  const descriptors = descriptorDetails(pairedWallet);
  printResult(
    `PoX-5 BTC state for wallet ${walletId}`,
    {
      wallet: mainSummary,
      pairedWallet: summarizeBitGoWallet(pairedWallet),
      currentBlockHeight: height,
      lockups: descriptors.map((descriptor) => ({
        unlockHeight: descriptor.unlockHeight,
        stakerCommitment: descriptor.stakerCommitment.toString('hex'),
        earlyExitKey: descriptor.earlyExitKey.toString('hex'),
      })),
      stakedUnspents: unspents,
    },
    args.json
  );
}

async function runExitBuild(
  context: ApiContext,
  args: BitGoApiCliArgs,
  branch: 'early' | 'late',
  secrets: string[]
): Promise<void> {
  const walletId = requiredString(args.walletId, 'Wallet ID', 128);
  const outpoint = parseOutpoint(args.outpoint);
  const mainWallet = await context.coin.wallets().get({ id: walletId });
  assertFixedScriptWallet(mainWallet);
  const mainSummary = summarizeBitGoWallet(mainWallet);
  if (!mainSummary.pairedWalletId) throw new Error('Selected wallet has no paired staking wallet');
  const pairedWallet = await context.coin.wallets().get({ id: mainSummary.pairedWalletId });
  if (getPox5WalletSpecific(pairedWallet)?.pairedWalletId !== walletId) {
    throw new Error('Paired wallet does not link back to the selected fixed-script wallet');
  }
  const descriptors = descriptorDetails(pairedWallet);
  if (descriptors.length === 0) throw new Error('Paired staking wallet has no PoX-5 lockup descriptors');
  const rawUnspents = await pairedWallet.unspents({ limit: 100 });
  const unspents = responseUnspents(rawUnspents);
  if (!unspents.some((unspent) => outpointFromUnspent(unspent) === outpoint.id)) {
    throw new Error(`Outpoint ${outpoint.id} is not an unspent in the paired staking wallet`);
  }

  let earlyExitKey: utxolib.ECPairInterface | undefined;
  let principalPreimage: Buffer | undefined;
  if (branch === 'early') {
    const parsedPrincipalPreimage = parsePreimageHex(
      await readProtectedFile(
        requiredString(args.principalPreimageFile, 'Principal preimage file', 1024),
        'Principal preimage'
      )
    );
    principalPreimage = parsedPrincipalPreimage;
    const keyWif = await readProtectedFile(
      requiredString(args.earlyExitKeyFile, 'Early-exit key file', 1024),
      'Early-exit key'
    );
    secrets.push(principalPreimage.toString('hex'), keyWif);
    const keyPair = utxolib.ECPair.fromWIF(keyWif, context.network);
    earlyExitKey = keyPair;
    if (!keyPair.privateKey) throw new Error('Early-exit key file does not contain a private key');
    if (
      !descriptors.some((descriptor) => {
        try {
          assertEarlyExitMaterials(parsedPrincipalPreimage, keyPair.publicKey, descriptor);
          return true;
        } catch {
          return false;
        }
      })
    ) {
      throw new Error('Principal preimage and early-exit key do not match any descriptor on the paired wallet');
    }
  }

  if (!(await confirmMutation(`Build a PoX-5 ${branch}-exit transaction?`, args.yes))) {
    console.log('Exit transaction build cancelled');
    return;
  }
  const { address } = await mainWallet.createAddress();
  const prebuild = await pairedWallet.prebuildTransaction(
    makePox5ExitBuildParams({
      address,
      outpoint: outpoint.id,
      branch,
      ...(principalPreimage ? { principalPreimage } : {}),
    })
  );
  const psbt = decodePsbt(prebuild, context.network);
  if (psbt.txInputs.length !== 1) throw new Error('PoX-5 recovery must spend exactly one lockup outpoint');
  if (branch === 'early' && psbt.locktime !== 0) {
    throw new Error('Early-exit PSBT must use locktime zero, not the post-CLTV branch');
  }
  if (branch === 'late') {
    const currentHeight = await latestBlockHeight(pairedWallet.baseCoin);
    if (psbt.locktime <= 0 || psbt.locktime >= 500_000_000 || psbt.locktime > currentHeight) {
      throw new Error(`Late-exit PSBT is not mature: locktime ${psbt.locktime}, current height ${currentHeight}`);
    }
  }
  const psbtWithEarlySignature = earlyExitKey ? signEarlyExitBranch(psbt, earlyExitKey, context.network) : psbt;
  const review = transactionSummary(prebuild, psbtWithEarlySignature, context.network);
  printPreview(`PoX-5 ${branch}-exit prebuild`, review, pairedWallet.id());
  const outcome = await confirmAndSubmit(
    args.buildOnly,
    () => confirmMutation(`Sign and submit this PoX-5 ${branch}-exit transaction?`, args.yes),
    async () => {
      const passphrase = await promptSecret('Wallet passphrase');
      secrets.push(passphrase);
      const signedPrebuild = replacePsbt(prebuild, psbtWithEarlySignature);
      return await signAndSubmit(pairedWallet, signedPrebuild, passphrase);
    }
  );
  if (outcome.status === 'build-only') {
    const psbtPath = await savePsbt(psbtWithEarlySignature, args.psbtOut);
    console.log(`PSBT saved to ${psbtPath}; wallet signatures have not been submitted`);
    return;
  }
  if (outcome.status === 'cancelled') {
    console.log('Exit transaction not submitted');
    return;
  }
  printResult(
    `${branch} exit submitted`,
    { ...outcome.result, walletId, pairedWalletId: pairedWallet.id() },
    args.json
  );
}

export async function runBitGoApiCommand(args: BitGoApiCliArgs): Promise<void> {
  if (!args.area) throw new Error('API command area is required');
  const environment = parseBitGoEnvironment(args.apiEnv ?? 'staging');
  const coinName = parseBitGoCoin(args.coin ?? 'tbtcstxprivate1');
  const token = getBitGoApiToken(environment);
  const secrets = [token];
  try {
    const bitgo = createBitGoApiClient(environment, token);
    const coin = bitgo.coin(coinName);
    const context: ApiContext = {
      environment,
      coinName,
      bitgo,
      coin,
      network: networkForCoin(coinName),
    };
    if (args.area === 'auth' && args.action === undefined) return await runAuth(context, args.json);
    if (args.area === 'wallet' && args.action === 'list') return await runWalletList(context, args.json);
    if (args.area === 'wallet' && args.action === 'create') return await runWalletCreate(context, args, secrets);
    if (args.area === 'stake' && (args.action === undefined || args.action === 'build')) {
      return await runStakeBuild(context, args, secrets);
    }
    if (args.area === 'stake' && args.action === 'status') return await runStakeStatus(context, args);
    if (args.area === 'exit' && (args.action === 'early' || args.action === 'late')) {
      return await runExitBuild(context, args, args.action, secrets);
    }
    throw new Error('Unsupported API command; use auth, wallet list/create, stake build/status, or exit early/late');
  } catch (error) {
    throw new Error(redactBitGoError(error, secrets));
  }
}
