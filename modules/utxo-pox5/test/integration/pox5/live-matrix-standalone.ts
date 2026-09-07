import { strict as assert } from 'node:assert';

import { descriptor as descriptorApi, type AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet, PrebuildTransactionResult } from '@bitgo/sdk-core';
import { coins, UtxoCoin } from '@bitgo/statics';
import { pox5 } from '@bitgo/utxo-descriptors';
import { pox5 as pox5Staking } from '@bitgo/utxo-staking';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, Psbt as WasmPsbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { decodePsbt, latestBlockHeight, replacePsbt } from './bitgo-api-helpers';
import { getPox5WalletSpecific, outpointFromUnspent, responseUnspents, walletCoinSpecifics } from './bitgo-api';
import { MatrixPrerequisite, type Checkpoint, type Coin, type Evidence, type WalletType } from './live-matrix';
import { waitFor } from './rpc';

const descriptorName = 'Pox5Lockup';
type BitcoinNetwork = 'bitcoin-regtest' | 'bitcoin-signet';

export interface StandaloneConfirmation {
  network: BitcoinNetwork;
  confirmations: number;
  blockHeight: number;
}

export interface StandaloneArgs {
  bitgo: BitGoAPI;
  mainWallet: IWallet;
  coinName: Coin;
  network: utxolib.Network;
  walletType: WalletType;
  walletPassphrase: string;
  enterpriseId: string;
  mainWalletId: string;
  mainWalletLabel: string;
  descriptorWalletId: string;
  descriptorWalletLabel: string;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
  maxAmountSats: string;
  maxFeeSats: string;
  feeRate: number;
  indexTimeoutMs?: number;
  confirmTransaction: (txid: string, coinName: Coin) => Promise<StandaloneConfirmation>;
  checkpoint: Checkpoint;
}

export interface StandaloneStakeArgs extends StandaloneArgs {
  inputOutpoint: string;
  amountSats: string;
  // Caller must obtain the protocol minimum for the actual bond/network, not the current tip + 1.
  unlockHeight: number;
}

export interface StandaloneRecoveryArgs extends StandaloneArgs {
  // An independently provisioned, already confirmed output, not necessarily from this run.
  outpoint: string;
  unlockHeight: number;
}

export interface StandaloneDescriptorWalletArgs {
  bitgo: BitGoAPI;
  mainWallet: IWallet;
  coinName: Coin;
  network: utxolib.Network;
  walletType: WalletType;
  walletPassphrase: string;
  enterpriseId: string;
  mainWalletId: string;
  mainWalletLabel: string;
  descriptorWalletId?: string;
  descriptorWalletLabel: string;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
  protocolMinimumUnlockHeight: number;
  unlockHeight: number;
  checkpoint: Checkpoint;
  checkpointDescriptorIntent: (intent: {
    label: string;
    coinName: Coin;
    mainWalletId: string;
    unlockHeight: number;
  }) => Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sats(value: unknown, field: string): bigint {
  if (typeof value === 'bigint' && value >= 0n) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  throw new Error(`Invalid ${field}`);
}

function positiveCap(value: string, field: string): bigint {
  const amount = sats(value, field);
  assert.ok(amount > 0n && amount <= 2_100_000_000_000_000n, `Invalid ${field}`);
  return amount;
}

function checkedOutpoint(value: string): string {
  assert.match(value, /^[a-f0-9]{64}:(0|[1-9][0-9]*)$/i, 'Invalid dedicated outpoint');
  assert.ok(Number.isSafeInteger(Number(value.split(':')[1])), 'Invalid outpoint index');
  return value.toLowerCase();
}

function checkedWallet(wallet: IWallet, id: string, label: string, coin: Coin, enterprise: string): void {
  assert.ok(
    id && label && enterprise && wallet.id() === id && wallet.label() === label,
    'Dedicated wallet identity mismatch'
  );
  assert.equal(wallet.coin(), coin, 'Dedicated wallet coin mismatch');
  assert.equal(wallet.type(), 'hot', 'Standalone descriptor operation requires a hot wallet');
  assert.equal(wallet.multisigType(), 'onchain', 'Standalone descriptor operation requires on-chain multisig');
  assert.equal(wallet.toJSON().enterprise, enterprise, 'Dedicated wallet enterprise mismatch');
  const staking = getPox5WalletSpecific(wallet);
  assert.ok(!staking?.pairedWalletId && staking?.isStakingWallet !== true, 'Standalone wallet must not be paired');
}

function networkOf(args: Pick<StandaloneArgs, 'coinName' | 'network'>): BitcoinNetwork {
  const staticsCoin = coins.get(args.coinName);
  assert.ok(staticsCoin instanceof UtxoCoin, 'Selected coin is not a Bitcoin UTXO coin');
  const name = staticsCoin.network.utxolibName;
  assert.ok(Object.prototype.hasOwnProperty.call(utxolib.networks, name), 'Selected coin has no UTXO network');
  assert.deepEqual(args.network, utxolib.networks[name as keyof typeof utxolib.networks], 'Bitcoin network mismatch');
  return args.coinName === 'tbtcstxsignet' ? 'bitcoin-signet' : 'bitcoin-regtest';
}

function descriptorFor(
  wallet: IWallet,
  args: Pick<StandaloneArgs, 'stakerCommitment' | 'earlyExitKey'>,
  unlockHeight: number
): Descriptor {
  const values = [
    ...new Set(
      walletCoinSpecifics(wallet).flatMap((specific) =>
        Array.isArray(specific.descriptors)
          ? specific.descriptors
              .filter((value): value is Record<string, unknown> => isRecord(value) && value.name === descriptorName)
              .map((value) => value.value)
          : []
      )
    ),
  ];
  assert.equal(values.length, 1, 'Dedicated wallet requires exactly one named PoX-5 descriptor');
  const value = values[0];
  assert.ok(typeof value === 'string', 'PoX-5 descriptor value is missing');
  const descriptor = Descriptor.fromString(value, 'derivable');
  const info = pox5.parsePox5LockupDescriptor(descriptor);
  assert.ok(info, 'Dedicated descriptor is not a canonical PoX-5 lockup');
  assert.equal(info.unlockHeight, unlockHeight, 'PoX-5 descriptor unlock height mismatch');
  assert.ok(info.stakerCommitment.equals(args.stakerCommitment), 'PoX-5 commitment mismatch');
  assert.ok(info.earlyExitKey.equals(args.earlyExitKey), 'PoX-5 early-exit key mismatch');
  return descriptor;
}

export async function resolveStandaloneDescriptorWallet(
  args: StandaloneDescriptorWalletArgs
): Promise<{ descriptorWalletId: string; unlockHeight: number; provisioning: 'CREATED' | 'REUSED' }> {
  if (args.walletType === 'custodial') {
    throw new MatrixPrerequisite('UNSUPPORTED', 'Standalone descriptor signing is not supported for custodial wallets');
  }
  try {
    assert.ok(args.walletPassphrase, 'Descriptor creation requires a wallet passphrase');
    assert.ok(Buffer.isBuffer(args.stakerCommitment) && args.stakerCommitment.length === 32, 'Invalid lock commitment');
    assert.ok(
      Buffer.isBuffer(args.earlyExitKey) &&
        args.earlyExitKey.length === 33 &&
        (args.earlyExitKey[0] === 2 || args.earlyExitKey[0] === 3),
      'Invalid compressed early-exit key'
    );
    assert.ok(
      args.descriptorWalletLabel && args.descriptorWalletLabel !== args.mainWalletLabel,
      'Descriptor wallet requires a distinct dedicated label'
    );
    checkedWallet(args.mainWallet, args.mainWalletId, args.mainWalletLabel, args.coinName, args.enterpriseId);
    networkOf(args);
    const coin = args.bitgo.coin(args.coinName) as AbstractUtxoCoin;
    assert.ok(
      Number.isSafeInteger(args.protocolMinimumUnlockHeight) &&
        args.protocolMinimumUnlockHeight > 0 &&
        args.protocolMinimumUnlockHeight < 500_000_000 &&
        Number.isSafeInteger(args.unlockHeight) &&
        args.unlockHeight >= args.protocolMinimumUnlockHeight &&
        args.unlockHeight < 500_000_000,
      'Descriptor unlock height is below the protocol minimum'
    );
    assert.ok(
      args.protocolMinimumUnlockHeight > (await latestBlockHeight(coin)),
      'Protocol unlock height must be in the future'
    );
    const matches: IWallet[] = [];
    for (let skip = 0; skip < 10_000; skip += 100) {
      const page = await coin.wallets().list({ limit: 100, skip });
      matches.push(...page.wallets.filter((wallet) => wallet.label() === args.descriptorWalletLabel));
      if (page.wallets.length < 100) break;
      if (skip === 9_900) throw new Error('Too many wallets to resolve the dedicated descriptor label');
    }
    assert.ok(matches.length <= 1, 'Descriptor wallet label is ambiguous');
    if (args.descriptorWalletId && matches.length === 0) {
      throw new MatrixPrerequisite('NOT_READY', 'Pinned dedicated descriptor wallet was not found under its label');
    }
    if (matches.length === 1) {
      const wallet = await coin.wallets().get({ id: matches[0].id() });
      checkedWallet(
        wallet,
        args.descriptorWalletId ?? wallet.id(),
        args.descriptorWalletLabel,
        args.coinName,
        args.enterpriseId
      );
      assert.ok(wallet.id() !== args.mainWalletId, 'Descriptor wallet must differ from main wallet');
      const existing = walletCoinSpecifics(wallet).flatMap((specific) =>
        Array.isArray(specific.descriptors)
          ? specific.descriptors.filter(
              (value): value is Record<string, unknown> => isRecord(value) && value.name === descriptorName
            )
          : []
      );
      assert.ok(existing.length > 0, 'Dedicated wallet is missing its PoX-5 descriptor');
      const values = [...new Set(existing.map((value) => value.value))];
      assert.ok(
        values.length === 1 && typeof values[0] === 'string',
        'Dedicated wallet has ambiguous PoX-5 descriptors'
      );
      const info = pox5.parsePox5LockupDescriptor(Descriptor.fromString(values[0], 'derivable'));
      assert.ok(info, 'Stored PoX-5 descriptor is not canonical');
      if (info.unlockHeight < args.protocolMinimumUnlockHeight) {
        throw new MatrixPrerequisite('NOT_READY', 'Existing descriptor unlock is below the current protocol minimum');
      }
      descriptorFor(wallet, args, info.unlockHeight);
      return { descriptorWalletId: wallet.id(), unlockHeight: info.unlockHeight, provisioning: 'REUSED' };
    }
    await args.checkpointDescriptorIntent({
      label: args.descriptorWalletLabel,
      coinName: args.coinName,
      mainWalletId: args.mainWalletId,
      unlockHeight: args.unlockHeight,
    });
    const wallet = await descriptorApi.createWallet.createDescriptorWalletWithWalletPassphrase(args.bitgo, coin, {
      label: args.descriptorWalletLabel,
      enterprise: args.enterpriseId,
      walletPassphrase: args.walletPassphrase,
      descriptorsFromKeys(userKey, cosigners) {
        const lockup = pox5.createPox5LockupDescriptor({
          unlockHeight: args.unlockHeight,
          stakerCommitment: args.stakerCommitment,
          earlyExitKey: args.earlyExitKey,
          stakerKeys: [userKey, cosigners[0], cosigners[1]],
        });
        return [
          ...descriptorApi.createWallet.DefaultWsh2Of3(userKey, cosigners),
          descriptorApi.createNamedDescriptorWithSignature(descriptorName, lockup.toString(), userKey),
        ];
      },
    });
    await args.checkpoint({
      descriptorWalletId: wallet.id(),
      unlockHeight: args.unlockHeight,
      provisioning: 'CREATED',
    });
    const loaded = await coin.wallets().get({ id: wallet.id() });
    checkedWallet(loaded, wallet.id(), args.descriptorWalletLabel, args.coinName, args.enterpriseId);
    descriptorFor(loaded, args, args.unlockHeight);
    return { descriptorWalletId: loaded.id(), unlockHeight: args.unlockHeight, provisioning: 'CREATED' };
  } catch (error) {
    if (error instanceof MatrixPrerequisite) throw error;
    throw new Error('Standalone descriptor wallet provisioning or validation failed');
  }
}

async function wallets(
  args: StandaloneArgs
): Promise<{ descriptorWallet: IWallet; network: BitcoinNetwork; coin: AbstractUtxoCoin }> {
  if (args.walletType === 'custodial') {
    throw new MatrixPrerequisite('UNSUPPORTED', 'Standalone descriptor signing is not supported for custodial wallets');
  }
  assert.ok(args.walletPassphrase, 'Standalone signing requires a wallet passphrase');
  assert.ok(args.descriptorWalletId !== args.mainWalletId, 'Standalone descriptor and main wallets must differ');
  assert.ok(Number.isSafeInteger(args.feeRate) && args.feeRate > 0, 'Invalid fee rate');
  positiveCap(args.maxAmountSats, 'amount cap');
  positiveCap(args.maxFeeSats, 'fee cap');
  const network = networkOf(args);
  checkedWallet(args.mainWallet, args.mainWalletId, args.mainWalletLabel, args.coinName, args.enterpriseId);
  assert.equal(args.mainWallet.baseCoin.getChain(), args.coinName, 'Main wallet base coin mismatch');
  assert.ok(
    walletCoinSpecifics(args.mainWallet).every(
      (specific) => !Array.isArray(specific.descriptors) || specific.descriptors.length === 0
    ),
    'Main wallet must not be a descriptor wallet'
  );
  const coin = args.bitgo.coin(args.coinName) as AbstractUtxoCoin;
  const descriptorWallet = await coin.wallets().get({ id: args.descriptorWalletId });
  checkedWallet(
    descriptorWallet,
    args.descriptorWalletId,
    args.descriptorWalletLabel,
    args.coinName,
    args.enterpriseId
  );
  assert.equal(descriptorWallet.baseCoin.getChain(), args.coinName, 'Descriptor wallet base coin mismatch');
  return { descriptorWallet, network, coin };
}

async function confirmation(
  args: StandaloneArgs,
  txid: string,
  expectedNetwork: BitcoinNetwork
): Promise<StandaloneConfirmation> {
  const result = await args.confirmTransaction(txid, args.coinName);
  assert.equal(result.network, expectedNetwork, 'Confirmation came from a different Bitcoin network');
  assert.ok(Number.isSafeInteger(result.confirmations) && result.confirmations >= 1, 'Transaction is not confirmed');
  assert.ok(Number.isSafeInteger(result.blockHeight) && result.blockHeight >= 0, 'Invalid confirmation height');
  return result;
}

async function indexedInput(
  wallet: IWallet,
  outpoint: string,
  network: BitcoinNetwork,
  args: StandaloneArgs
): Promise<{ amount: bigint; address: string; confirmations: number }> {
  const matches = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1 })).filter(
    (item) => outpointFromUnspent(item) === outpoint
  );
  if (matches.length === 0)
    throw new MatrixPrerequisite('NOT_READY', 'Dedicated confirmed outpoint is not indexed on the selected wallet');
  assert.equal(matches.length, 1, 'Duplicate indexed outpoint');
  const input = matches[0];
  assert.ok(typeof input.address === 'string' && input.address.length > 0, 'Indexed outpoint has no address');
  const amount = sats(input.valueString ?? input.value ?? input.amount, 'indexed input amount');
  assert.ok(amount > 0n && amount <= positiveCap(args.maxAmountSats, 'amount cap'), 'Indexed input exceeds amount cap');
  const txid = outpoint.split(':')[0];
  const confirmed = await confirmation(args, txid, network);
  return { amount, address: input.address, confirmations: confirmed.confirmations };
}

async function ownedAddress(wallet: IWallet, address: string): Promise<void> {
  assert.ok(address, 'Destination address is missing');
  const found: unknown = await wallet.getAddress({ address });
  assert.ok(isRecord(found) && found.address === address, 'Destination is not indexed on the dedicated main wallet');
}

async function waitForIndexedOutput(
  wallet: IWallet,
  txid: string,
  address: string,
  amount: bigint,
  timeoutMs: number
): Promise<string> {
  let outpoint: string | undefined;
  await waitFor(
    'confirmed standalone output to be indexed by BitGo',
    async () => {
      const matches = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1 })).filter(
        (item) => outpointFromUnspent(item)?.startsWith(`${txid.toLowerCase()}:`) && item.address === address
      );
      if (!matches.length) return false;
      assert.equal(matches.length, 1, 'Multiple outputs matched the dedicated destination');
      assert.equal(
        sats(matches[0].valueString ?? matches[0].value ?? matches[0].amount, 'indexed output amount'),
        amount
      );
      outpoint = outpointFromUnspent(matches[0]);
      return true;
    },
    timeoutMs,
    15_000
  );
  assert.ok(outpoint, 'BitGo did not index the confirmed standalone output');
  return outpoint;
}

function inspectPsbt(
  psbt: utxolib.bitgo.UtxoPsbt,
  args: {
    coin: AbstractUtxoCoin;
    outpoint: string;
    inputAmount: bigint;
    inputAddress: string;
    destinations: { address: string; amount?: bigint }[];
    maxFee: bigint;
    unlockHeight?: number;
    descriptor?: Descriptor;
  }
): bigint {
  assert.equal(psbt.txInputs.length, 1, 'Transaction must spend exactly the dedicated input');
  const input = psbt.txInputs[0];
  assert.equal(
    `${Buffer.from(input.hash).reverse().toString('hex')}:${input.index}`,
    args.outpoint,
    'Transaction spends another outpoint'
  );
  const witness = psbt.data.inputs[0].witnessUtxo;
  assert.ok(witness, 'Transaction input is missing the witness UTXO');
  assert.equal(sats(witness.value, 'witness input amount'), args.inputAmount, 'Transaction input amount mismatch');
  assert.ok(
    Buffer.from(witness.script).equals(args.coin.addressCodec.fromExtendedAddressFormatToScript(args.inputAddress)),
    'Transaction input script mismatch'
  );
  const outputs = psbt.getUnsignedTx().outs;
  assert.equal(outputs.length, args.destinations.length, 'Transaction includes an unexpected output');
  for (const destination of args.destinations) {
    const script = args.coin.addressCodec.fromExtendedAddressFormatToScript(destination.address);
    const matches = outputs.filter((output) => output.script.equals(script));
    assert.equal(matches.length, 1, 'Transaction output does not match its dedicated destination');
    if (destination.amount !== undefined)
      assert.equal(matches[0].value, destination.amount, 'Transaction destination amount mismatch');
    assert.ok(matches[0].value > 0n, 'Transaction includes an empty output');
  }
  const fee = args.inputAmount - outputs.reduce((sum, output) => sum + output.value, 0n);
  assert.ok(fee > 0n && fee <= args.maxFee, 'Transaction fee exceeds the configured cap');
  if (args.unlockHeight !== undefined) {
    assert.ok(psbt.locktime >= args.unlockHeight && psbt.locktime < 500_000_000, 'Sweep CLTV locktime mismatch');
    assert.notEqual(input.sequence, 0xffffffff, 'Sweep requires a non-final input sequence');
    assert.ok(args.descriptor, 'Sweep descriptor is missing');
    const wasmPsbt = WasmPsbt.deserialize(psbt.toBuffer());
    const descriptors = descriptorWallet.toDescriptorMap([{ name: descriptorName, value: args.descriptor }]);
    const match = pox5.matchPox5Input(wasmPsbt, 0, descriptors);
    assert.ok(match, 'Sweep input does not match the canonical PoX-5 descriptor');
    pox5Staking.assertPox5LocktimeSpend(wasmPsbt, [match]);
  }
  return fee;
}

function stripPathlessDerivations(psbt: utxolib.bitgo.UtxoPsbt): utxolib.bitgo.UtxoPsbt {
  for (const input of psbt.data.inputs) {
    if (input.bip32Derivation) input.bip32Derivation = input.bip32Derivation.filter((item) => item.path.length > 0);
  }
  return psbt;
}

async function broadcast(
  wallet: IWallet,
  prebuild: PrebuildTransactionResult,
  psbt: utxolib.bitgo.UtxoPsbt,
  args: StandaloneArgs,
  outpoint: string,
  amount: bigint,
  fee: bigint,
  unlockHeight: number,
  recheck: (signedPsbt: utxolib.bitgo.UtxoPsbt) => bigint
): Promise<string> {
  // Persist intent before the only submission attempt. An interrupted row must not be retried automatically.
  await args.checkpoint({
    walletId: args.mainWalletId,
    descriptorWalletId: args.descriptorWalletId,
    outpoint,
    txid: psbt.getUnsignedTx().getId(),
    amountSats: Number(amount),
    feeSats: Number(fee),
    unlockHeight,
  });
  const signed: unknown = await wallet.signTransaction({
    txPrebuild: replacePsbt(prebuild, psbt),
    walletPassphrase: args.walletPassphrase,
  });
  assert.ok(isRecord(signed), 'Signer returned no inspectable transaction');
  const halfSigned = isRecord(signed.halfSigned) ? signed.halfSigned : undefined;
  const signedHex = halfSigned?.txHex ?? signed.txHex;
  assert.ok(typeof signedHex === 'string' && /^[0-9a-f]+$/i.test(signedHex), 'Signer returned no PSBT');
  const signedPsbt = decodePsbt({ walletId: wallet.id(), txHex: signedHex }, args.network);
  assert.equal(signedPsbt.getUnsignedTx().getId(), psbt.getUnsignedTx().getId(), 'Signer changed the transaction');
  assert.equal(recheck(signedPsbt), fee, 'Signer changed the transaction fee');
  const submission: unknown = await wallet.submitTransaction(
    halfSigned ? { halfSigned: { txHex: signedHex } } : { txHex: signedHex }
  );
  assert.ok(isRecord(submission), 'Submission returned no transaction result');
  const txid = submission.txid;
  assert.ok(typeof txid === 'string' && /^[0-9a-f]{64}$/i.test(txid), 'Submission returned no transaction ID');
  assert.equal(
    txid.toLowerCase(),
    psbt.getUnsignedTx().getId(),
    'Submitted transaction ID differs from inspected PSBT'
  );
  await args.checkpoint({ txid });
  return txid;
}

export async function standaloneStake(args: StandaloneStakeArgs): Promise<Evidence> {
  if (args.walletType === 'custodial')
    throw new MatrixPrerequisite('UNSUPPORTED', 'Standalone descriptor signing is not supported for custodial wallets');
  try {
    const { descriptorWallet, network, coin } = await wallets(args);
    const indexTimeoutMs = args.indexTimeoutMs ?? 120_000;
    assert.ok(
      Number.isSafeInteger(indexTimeoutMs) && indexTimeoutMs >= 1_000 && indexTimeoutMs <= 600_000,
      'Invalid indexing timeout'
    );
    assert.ok(
      Number.isSafeInteger(args.unlockHeight) && args.unlockHeight > 0 && args.unlockHeight < 500_000_000,
      'Invalid protocol unlock height'
    );
    const tip = await latestBlockHeight(coin);
    assert.ok(args.unlockHeight > tip, 'Protocol unlock height must be in the future');
    const descriptor = descriptorFor(descriptorWallet, args, args.unlockHeight);
    const outpoint = checkedOutpoint(args.inputOutpoint);
    const input = await indexedInput(args.mainWallet, outpoint, network, args);
    await ownedAddress(args.mainWallet, input.address);
    const amount = positiveCap(args.amountSats, 'lock amount');
    assert.ok(
      amount <= positiveCap(args.maxAmountSats, 'amount cap') && input.amount > amount,
      'Lock amount exceeds cap or available input'
    );
    const registered: unknown = await args.bitgo
      .post(coin.url(`/wallet/${descriptorWallet.id()}/address`))
      .send({ descriptorName })
      .result();
    assert.ok(
      isRecord(registered) &&
        typeof registered.address === 'string' &&
        Number.isSafeInteger(registered.index) &&
        Number(registered.index) >= 0,
      'PoX-5 receive address was not registered'
    );
    assert.ok(
      isRecord(registered.coinSpecific) && registered.coinSpecific.descriptorName === descriptorName,
      'Registered address is not a PoX-5 descriptor address'
    );
    const lockAddress = registered.address;
    const expectedScript = Buffer.from(descriptor.atDerivationIndex(Number(registered.index)).scriptPubkey());
    assert.ok(
      expectedScript.equals(coin.addressCodec.fromExtendedAddressFormatToScript(lockAddress)),
      'Registered lock destination has a different script'
    );
    const change = await args.mainWallet.createAddress();
    assert.ok(typeof change.address === 'string', 'Main wallet did not provide a change address');
    await ownedAddress(args.mainWallet, change.address);
    const prebuild = await args.mainWallet.prebuildTransaction({
      recipients: [{ address: lockAddress, amount: amount.toString() }],
      unspents: [outpoint],
      changeAddress: change.address,
      feeRate: args.feeRate,
      noSplitChange: true,
      txFormat: 'psbt',
    });
    assert.equal(prebuild.walletId, args.mainWalletId, 'Lock prebuild has the wrong wallet ID');
    const psbt = decodePsbt(prebuild, args.network);
    const inspection = {
      coin,
      outpoint,
      inputAmount: input.amount,
      inputAddress: input.address,
      destinations: [{ address: lockAddress, amount }, { address: change.address }],
      maxFee: positiveCap(args.maxFeeSats, 'fee cap'),
    };
    const fee = inspectPsbt(psbt, inspection);
    const txid = await broadcast(
      args.mainWallet,
      prebuild,
      psbt,
      args,
      outpoint,
      amount,
      fee,
      args.unlockHeight,
      (signed) => inspectPsbt(signed, inspection)
    );
    const confirmed = await confirmation(args, txid, network);
    const lockOutpoint = await waitForIndexedOutput(descriptorWallet, txid, lockAddress, amount, indexTimeoutMs);
    return {
      walletId: args.mainWalletId,
      descriptorWalletId: args.descriptorWalletId,
      txid,
      outpoint: lockOutpoint,
      amountSats: Number(amount),
      feeSats: Number(fee),
      unlockHeight: args.unlockHeight,
      observedHeight: confirmed.blockHeight,
      confirmations: confirmed.confirmations,
    };
  } catch (error) {
    if (error instanceof MatrixPrerequisite) throw error;
    throw new Error('Standalone lock validation or submission failed');
  }
}

export async function standaloneRecovery(args: StandaloneRecoveryArgs): Promise<Evidence> {
  if (args.walletType === 'custodial')
    throw new MatrixPrerequisite('UNSUPPORTED', 'Standalone descriptor signing is not supported for custodial wallets');
  try {
    const { descriptorWallet, network, coin } = await wallets(args);
    const indexTimeoutMs = args.indexTimeoutMs ?? 120_000;
    assert.ok(
      Number.isSafeInteger(indexTimeoutMs) && indexTimeoutMs >= 1_000 && indexTimeoutMs <= 600_000,
      'Invalid indexing timeout'
    );
    const descriptor = descriptorFor(descriptorWallet, args, args.unlockHeight);
    const tip = await latestBlockHeight(coin);
    if (tip < args.unlockHeight)
      throw new MatrixPrerequisite('NOT_READY', 'Dedicated descriptor lockup has not reached its CLTV height');
    const outpoint = checkedOutpoint(args.outpoint);
    const input = await indexedInput(descriptorWallet, outpoint, network, args);
    const address: unknown = await descriptorWallet.getAddress({ address: input.address });
    assert.ok(
      isRecord(address) &&
        address.address === input.address &&
        Number.isSafeInteger(address.index) &&
        Number(address.index) >= 0,
      'Indexed lockup address has no verified derivation index'
    );
    assert.ok(
      isRecord(address.coinSpecific) && address.coinSpecific.descriptorName === descriptorName,
      'Indexed output is not a PoX-5 descriptor output'
    );
    const script = Buffer.from(descriptor.atDerivationIndex(Number(address.index)).scriptPubkey());
    assert.ok(
      script.equals(coin.addressCodec.fromExtendedAddressFormatToScript(input.address)),
      'Indexed lockup script differs from the verified descriptor'
    );
    const recovery = await args.mainWallet.createAddress();
    assert.ok(typeof recovery.address === 'string', 'Main wallet did not provide a recovery address');
    await ownedAddress(args.mainWallet, recovery.address);
    const response: unknown = await args.bitgo
      .post(coin.url(`/wallet/${descriptorWallet.id()}/tx/build`))
      .send({
        recipients: [{ address: recovery.address, amount: 'max' }],
        unspents: [outpoint],
        locktime: args.unlockHeight,
        feeRate: args.feeRate,
        txFormat: 'psbt',
      })
      .result();
    assert.ok(
      isRecord(response) && typeof response.txBase64 === 'string' && response.txBase64.length > 0,
      'PoX-5 sweep build returned no PSBT'
    );
    const prebuild: PrebuildTransactionResult = { walletId: descriptorWallet.id(), txBase64: response.txBase64 };
    const psbt = stripPathlessDerivations(decodePsbt(prebuild, args.network));
    const inspection = {
      coin,
      outpoint,
      inputAmount: input.amount,
      inputAddress: input.address,
      destinations: [{ address: recovery.address }],
      maxFee: positiveCap(args.maxFeeSats, 'fee cap'),
      unlockHeight: args.unlockHeight,
      descriptor,
    };
    const fee = inspectPsbt(psbt, inspection);
    const txid = await broadcast(
      descriptorWallet,
      prebuild,
      psbt,
      args,
      outpoint,
      input.amount,
      fee,
      args.unlockHeight,
      (signed) => inspectPsbt(signed, inspection)
    );
    const confirmed = await confirmation(args, txid, network);
    await waitForIndexedOutput(args.mainWallet, txid, recovery.address, input.amount - fee, indexTimeoutMs);
    return {
      walletId: args.mainWalletId,
      descriptorWalletId: args.descriptorWalletId,
      txid,
      outpoint,
      amountSats: Number(input.amount - fee),
      feeSats: Number(fee),
      unlockHeight: args.unlockHeight,
      observedHeight: confirmed.blockHeight,
      confirmations: confirmed.confirmations,
    };
  } catch (error) {
    if (error instanceof MatrixPrerequisite) throw error;
    throw new Error('Standalone recovery validation or submission failed');
  }
}
