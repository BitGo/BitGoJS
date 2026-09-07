import { createHash, randomUUID } from 'node:crypto';

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
  network: utxolib.Network
): utxolib.bitgo.UtxoPsbt {
  const wrapped = toWrappedPsbt(psbt);
  if (getNewSignatureCount(signWithKey(wrapped, key)) === 0) {
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
