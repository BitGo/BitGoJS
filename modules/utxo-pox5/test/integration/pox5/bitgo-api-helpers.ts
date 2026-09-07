import { createHash, randomUUID } from 'node:crypto';

import { pox5 } from '@bitgo/utxo-descriptors';
import * as utxolib from '@bitgo/utxo-lib';
import { pox5 as pox5Staking } from '@bitgo/utxo-staking';
import { getNewSignatureCount, signWithKey, toUtxoPsbt, toWrappedPsbt } from '@bitgo/utxo-core/descriptor';
import { Descriptor } from '@bitgo/wasm-utxo';
import { coins, UtxoCoin } from '@bitgo/statics';
import type {
  IWallet,
  PrebuildTransactionOptions,
  PrebuildTransactionResult,
  SubmitTransactionOptions,
} from '@bitgo/sdk-core';

import { parsePositiveSats, type BitGoCoinName, walletCoinSpecifics } from './bitgo-api';

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

export interface Pox5DescriptorInfo {
  unlockHeight: number;
  stakerCommitment: Buffer;
  earlyExitKey: Buffer;
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

export function signEarlyExitBranch(
  psbt: utxolib.bitgo.UtxoPsbt,
  key: utxolib.ECPairInterface,
  network: utxolib.Network,
  expectedOutpoint: string,
  descriptor: Descriptor,
  principalPreimage: Uint8Array
): utxolib.bitgo.UtxoPsbt {
  const keyFingerprint = createHash('sha256').update(key.publicKey).digest('hex').slice(0, 16);
  const inputs = psbt.txInputs.map((input, index) => {
    const actualOutpoint = `${Buffer.from(input.hash).reverse().toString('hex')}:${input.index}`;
    const psbtInput = psbt.data.inputs[index];
    const witnessScript = psbtInput.witnessScript;
    const witnessUtxoScript = psbtInput.witnessUtxo?.script;
    const witnessScriptHash = witnessScript ? createHash('sha256').update(witnessScript).digest() : undefined;
    const derivations = psbtInput.bip32Derivation ?? [];
    const partialSignatures = psbtInput.partialSig ?? [];
    return {
      index,
      actualOutpoint,
      outpointMatches: actualOutpoint === expectedOutpoint,
      sequence: input.sequence,
      witnessUtxoPresent: psbtInput.witnessUtxo !== undefined,
      witnessUtxoScriptBytes: witnessUtxoScript?.length ?? 0,
      witnessUtxoScriptHash: witnessUtxoScript
        ? createHash('sha256').update(witnessUtxoScript).digest('hex').slice(0, 16)
        : undefined,
      witnessScriptBytes: witnessScript?.length ?? 0,
      witnessScriptHash: witnessScript ? witnessScriptHash?.toString('hex').slice(0, 16) : undefined,
      earlyKeyInWitnessScript: witnessScript?.includes(key.publicKey) ?? false,
      witnessScriptMatchesUtxo:
        witnessScriptHash !== undefined &&
        witnessUtxoScript !== undefined &&
        witnessUtxoScript.length === 34 &&
        witnessUtxoScript[0] === 0x00 &&
        witnessUtxoScript[1] === 0x20 &&
        witnessScriptHash.equals(witnessUtxoScript.subarray(2)),
      derivationCount: derivations.length,
      earlyKeyInDerivations: derivations.some((item) => Buffer.from(item.pubkey).equals(key.publicKey)),
      partialSignatureCount: partialSignatures.length,
      earlyKeyAlreadyPartialSigned: partialSignatures.some((item) => Buffer.from(item.pubkey).equals(key.publicKey)),
    };
  });
  const diagnostic = {
    expectedOutpoint,
    inputCount: inputs.length,
    locktime: psbt.locktime,
    earlyKeyFingerprint: keyFingerprint,
    inputs,
  };
  if (inputs.length !== 1 || !inputs[0].outpointMatches) {
    console.error('PoX5 early-exit PSBT input validation failed', JSON.stringify(diagnostic));
    throw new Error('Early-exit PSBT did not spend the expected single outpoint');
  }
  const descriptorInfo = pox5.parsePox5LockupDescriptor(descriptor);
  if (
    !descriptorInfo?.stakerKeys ||
    !descriptorInfo.earlyExitKey.equals(key.publicKey) ||
    !inputs[0].earlyKeyInWitnessScript ||
    !inputs[0].witnessScriptMatchesUtxo ||
    !psbt.data.inputs[0].witnessUtxo ||
    !Buffer.from(descriptor.scriptPubkey()).equals(psbt.data.inputs[0].witnessUtxo.script)
  ) {
    throw new Error('Early-exit PSBT input does not match the controlled PoX-5 descriptor');
  }
  pox5.assertPox5PrincipalPreimage(descriptorInfo, principalPreimage);

  const wrapped = toWrappedPsbt(psbt);
  const match = pox5.matchPox5Input(wrapped, 0, new Map([['pox5', descriptor]]));
  if (!match || !Buffer.from(match.descriptor.scriptPubkey()).equals(descriptor.scriptPubkey())) {
    throw new Error('Early-exit PSBT has no canonical input match for the stored descriptor');
  }
  pox5Staking.assertPox5EarlyExitSpend(wrapped, match);
  const preimages = wrapped
    .getInputKeyValues(0)
    .filter((record) => record.type === 'known' && record.key === 'PSBT_IN_SHA256');
  if (
    preimages.length > 1 ||
    preimages.some(
      (record) =>
        !Buffer.from(record.keyData).equals(descriptorInfo.stakerCommitment) ||
        !Buffer.from(record.value).equals(principalPreimage)
    )
  ) {
    throw new Error('Early-exit PSBT has conflicting principal-preimage metadata');
  }
  if (preimages.length === 0) {
    pox5Staking.preparePox5EarlyExit(wrapped, 0, match, principalPreimage);
  }
  const unsignedTxid = wrapped.unsignedTxId();
  wrapped.updateInputWithDescriptor(0, descriptor);
  if (wrapped.unsignedTxId() !== unsignedTxid) {
    throw new Error('Early-exit descriptor enrichment changed the unsigned transaction');
  }
  diagnostic.inputs[0].derivationCount = wrapped.getInputs()[0].bip32Derivation.length;
  diagnostic.inputs[0].earlyKeyInDerivations = wrapped
    .getInputs()[0]
    .bip32Derivation.some((item) => Buffer.from(item.pubkey).equals(key.publicKey));
  let signatureResult;
  try {
    signatureResult = signWithKey(wrapped, key);
  } catch (error) {
    console.error(
      'PoX5 early-exit signer threw',
      JSON.stringify({ ...diagnostic, errorType: error instanceof Error ? error.name : 'UnknownError' })
    );
    throw new Error('Early-exit test key signing threw; see redacted signer diagnostics');
  }
  const newSignatureCount = getNewSignatureCount(signatureResult);
  const ownSignature = wrapped.getPartialSignatures(0).find((item) => Buffer.from(item.pubkey).equals(key.publicKey));
  const ownSignatureValid = ownSignature ? wrapped.validateSignatureAtInput(0, ownSignature.pubkey) : false;
  const signaturesByInput = Object.fromEntries(
    Object.entries(signatureResult).map(([index, result]) => [
      index,
      'Ecdsa' in result
        ? { type: 'Ecdsa', count: result.Ecdsa.length }
        : { type: 'Schnorr', count: result.Schnorr.length },
    ])
  );
  console.info(
    'PoX5 early-exit signer result',
    JSON.stringify({ ...diagnostic, newSignatureCount, signaturesByInput, ownSignatureValid })
  );
  if (newSignatureCount !== 1 || !ownSignatureValid || wrapped.unsignedTxId() !== unsignedTxid) {
    throw new Error('Early-exit test key did not sign any input');
  }
  return toUtxoPsbt(wrapped, network);
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
