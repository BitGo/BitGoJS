import { createHash } from 'node:crypto';

import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet, PrebuildTransactionResult, SubmitTransactionOptions } from '@bitgo/sdk-core';
import { coins, UtxoCoin } from '@bitgo/statics';
import { pox5 } from '@bitgo/utxo-descriptors';
import { pox5 as pox5Staking } from '@bitgo/utxo-staking';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, Psbt as WasmPsbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { decodePsbt, makePox5ExitBuildParams, makePox5StakingBuildParams } from './bitgo-api-helpers';
import {
  getPox5WalletSpecific,
  outpointFromUnspent,
  parsePositiveSats,
  responseUnspents,
  walletCoinSpecifics,
} from './bitgo-api';
import { resolveOfflineCustodialSignature } from './custodial-offline';
import { type Cell, type Checkpoint, type Evidence, MatrixPrerequisite } from './live-matrix';

export interface PairedConfirmedInput {
  outpoint: string;
  amountSats: string;
  confirmations: number;
}

export interface PairedConfirmation {
  txid: string;
  blockHeight: number;
  confirmations: number;
  network: 'bitcoin-regtest' | 'bitcoin-signet';
}

export interface PairedIndexedOutput extends PairedConfirmedInput {
  address: string;
}

export interface PairedBaseArgs {
  cell: Cell;
  env: NodeJS.ProcessEnv;
  bitgo: BitGoAPI;
  mainWallet: IWallet;
  mainWalletId: string;
  enterpriseId: string;
  actorId: string;
  requestId: string;
  maxFeeSats: string;
  readiness: () => Promise<boolean>;
  getTip: () => Promise<number>;
  confirm: (txid: string) => Promise<PairedConfirmation>;
  indexed: (walletId: string, txid: string, address: string) => Promise<PairedIndexedOutput>;
  checkpoint: Checkpoint;
}

export interface PairedStakeArgs extends PairedBaseArgs {
  input: PairedConfirmedInput;
  amountSats: string;
  maxStakeSats: string;
  protocolMinimumUnlockHeight: number;
  unlockHeight: number;
  descriptorIndex: number;
  principalPreimage: Uint8Array;
  earlyExitKey: Uint8Array;
  walletPassphrase?: string;
  approver?: CustodialApprover;
  checkpointApproval?: (approval: { id: string; txid?: string }) => Promise<void>;
}

export type PairedStakeEvidence = Evidence & { approvalId?: string; approvalStatus?: 'approved' };

export interface PairedRecoveryArgs extends PairedBaseArgs {
  pairedWalletId: string;
  fixture: PairedConfirmedInput & { descriptorIndex: number; unlockHeight: number };
  recoveryAddress: string;
  maxRecoverySats: string;
  walletPassphrase?: string;
  /** Custodial only: the distinct actor that approves the pending approval. */
  approver?: CustodialApprover;
  checkpointApproval?: (approval: { id: string; txid?: string }) => Promise<void>;
}

const outpointPattern = /^[0-9a-f]{64}:(0|[1-9][0-9]*)$/i;
const txidPattern = /^[0-9a-f]{64}$/i;
const safeIdPattern = /^[a-zA-Z0-9_-]{1,128}$/;

function requireCondition(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(reason);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveHeight(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value < 500_000_000;
}

function sats(value: unknown, name: string): bigint {
  return BigInt(parsePositiveSats(value, name));
}

function networkForCell(cell: Cell): utxolib.Network {
  const coin = coins.get(cell.coin);
  requireCondition(coin instanceof UtxoCoin, 'Selected coin is not a UTXO coin');
  const name = coin.network.utxolibName;
  requireCondition(
    Object.prototype.hasOwnProperty.call(utxolib.networks, name),
    'Selected coin has no Bitcoin network'
  );
  return utxolib.networks[name as keyof typeof utxolib.networks];
}

function validateOutpoint(input: PairedConfirmedInput): void {
  requireCondition(outpointPattern.test(input.outpoint), 'Selected outpoint is invalid');
  sats(input.amountSats, 'Selected input amount');
  requireCondition(
    Number.isSafeInteger(input.confirmations) && input.confirmations >= 1,
    'Selected input is not confirmed'
  );
}

function selectedInput(psbt: utxolib.bitgo.UtxoPsbt, outpoint: string): void {
  requireCondition(psbt.txInputs.length === 1, 'PSBT must spend exactly one dedicated input');
  const input = psbt.txInputs[0];
  requireCondition(
    `${Buffer.from(input.hash).reverse().toString('hex')}:${input.index}` === outpoint.toLowerCase(),
    'PSBT spends a different input'
  );
}

function inspectFee(
  psbt: utxolib.bitgo.UtxoPsbt,
  inputAmount: bigint,
  maxFee: bigint,
  prebuild: PrebuildTransactionResult
): bigint {
  const outputs = psbt.getUnsignedTx().outs;
  const total = outputs.reduce((sum, output) => sum + output.value, 0n);
  const fee = inputAmount - total;
  requireCondition(fee > 0n && fee <= maxFee && total > 0n, 'PSBT fee exceeds cap or is invalid');
  const advertised = prebuild.feeInfo?.feeString ?? prebuild.feeInfo?.fee;
  if (advertised !== undefined) {
    requireCondition(
      /^[0-9]+$/.test(String(advertised)) && BigInt(String(advertised)) === fee,
      'PSBT fee differs from the prebuild fee'
    );
  }
  return fee;
}

function descriptors(wallet: IWallet): Descriptor[] {
  const values = new Set<string>();
  for (const coinSpecific of walletCoinSpecifics(wallet)) {
    if (!Array.isArray(coinSpecific.descriptors)) continue;
    for (const item of coinSpecific.descriptors) {
      if (record(item) && typeof item.value === 'string') values.add(item.value);
    }
  }
  return [...values]
    .map((value) => Descriptor.fromString(value, 'derivable'))
    .filter((descriptor) => pox5.parsePox5LockupDescriptor(descriptor));
}

function exactDescriptor(
  wallet: IWallet,
  unlockHeight: number,
  commitment?: Buffer,
  earlyExitKey?: Buffer
): Descriptor {
  const matches = descriptors(wallet).filter((descriptor) => {
    const info = pox5.parsePox5LockupDescriptor(descriptor);
    return (
      info?.unlockHeight === unlockHeight &&
      (commitment === undefined || info.stakerCommitment.equals(commitment)) &&
      (earlyExitKey === undefined || info.earlyExitKey.equals(earlyExitKey))
    );
  });
  requireCondition(matches.length === 1, 'Paired wallet has no unique matching PoX-5 descriptor');
  return matches[0];
}

function scriptAt(descriptor: Descriptor, index: number): Buffer {
  requireCondition(Number.isSafeInteger(index) && index >= 0, 'Descriptor index must be explicit');
  return Buffer.from(descriptor.atDerivationIndex(index).scriptPubkey());
}

async function authenticatedActor(bitgo: BitGoAPI, actorId: string): Promise<void> {
  requireCondition(safeIdPattern.test(actorId), 'Authorized actor ID is invalid');
  const response: unknown = await bitgo.get(bitgo.url('/user/me')).result();
  const user = record(response) && record(response.user) ? response.user : response;
  requireCondition(record(user) && user.id === actorId, 'Authenticated actor does not match the authorized actor');
}

async function checkedMainWallet(args: PairedBaseArgs): Promise<void> {
  requireCondition(
    args.cell.environment === 'test' || args.cell.environment === 'staging',
    'Unsupported BitGo environment'
  );
  requireCondition(args.bitgo.getEnv() === args.cell.environment, 'BitGo client environment differs from the cell');
  requireCondition(args.mainWallet.id() === args.mainWalletId, 'Main wallet ID differs from the selected wallet');
  requireCondition(args.mainWallet.coin() === args.cell.coin, 'Main wallet belongs to another coin');
  requireCondition(args.mainWallet.type() === args.cell.walletType, 'Main wallet type differs from the selected cell');
  requireCondition(args.mainWallet.multisigType() === 'onchain', 'Main wallet is not a fixed-script wallet');
  requireCondition(
    getPox5WalletSpecific(args.mainWallet)?.isStakingWallet !== true,
    'Selected wallet is a staking wallet'
  );
  requireCondition(safeIdPattern.test(args.enterpriseId), 'Expected enterprise ID is invalid');
  requireCondition(
    args.mainWallet.toJSON().enterprise === args.enterpriseId,
    'Main wallet enterprise differs from the selected enterprise'
  );
  requireCondition(safeIdPattern.test(args.requestId), 'One-shot request ID is invalid');
  await authenticatedActor(args.bitgo, args.actorId);
  if (!(await args.readiness()))
    throw new MatrixPrerequisite('NOT_READY', 'Dedicated wallet is not ready for paired activity');
}

async function checkedPair(args: PairedBaseArgs, pairedWalletId: string): Promise<IWallet> {
  requireCondition(
    safeIdPattern.test(pairedWalletId) && pairedWalletId !== args.mainWalletId,
    'Paired wallet ID is invalid'
  );
  const coin = args.bitgo.coin(args.cell.coin);
  const refreshed = await coin.wallets().get({ id: args.mainWalletId });
  requireCondition(refreshed.id() === args.mainWalletId, 'Main wallet changed during paired operation');
  requireCondition(
    getPox5WalletSpecific(refreshed)?.pairedWalletId === pairedWalletId,
    'Main wallet does not point to the paired wallet'
  );
  const paired = await coin.wallets().get({ id: pairedWalletId });
  requireCondition(
    paired.id() === pairedWalletId && paired.coin() === args.cell.coin,
    'Paired wallet coin or ID differs'
  );
  requireCondition(paired.toJSON().enterprise === args.enterpriseId, 'Paired wallet belongs to another enterprise');
  requireCondition(
    getPox5WalletSpecific(paired)?.isStakingWallet === true,
    'Paired wallet is not marked as a staking wallet'
  );
  requireCondition(
    getPox5WalletSpecific(paired)?.pairedWalletId === args.mainWalletId,
    'Paired wallet does not point back to main wallet'
  );
  return paired;
}

async function checkedWalletInput(
  wallet: IWallet,
  input: PairedConfirmedInput,
  cell: Cell,
  confirm: PairedBaseArgs['confirm'],
  existingConfirmation?: PairedConfirmation
): Promise<string> {
  validateOutpoint(input);
  const unspents = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1 }));
  const matches = unspents.filter((candidate) => outpointFromUnspent(candidate) === input.outpoint.toLowerCase());
  if (matches.length === 0) {
    throw new MatrixPrerequisite('NOT_READY', 'Configured confirmed input is not indexed on the dedicated wallet');
  }
  requireCondition(matches.length === 1, 'Confirmed dedicated input is not uniquely indexed on the selected wallet');
  const unspent = matches[0];
  const amount = unspent.valueString ?? unspent.value ?? unspent.amount;
  requireCondition(
    amount !== undefined && sats(amount, 'Indexed input amount') === sats(input.amountSats, 'Input amount'),
    'Indexed input amount differs'
  );
  const txid = input.outpoint.split(':')[0].toLowerCase();
  const confirmation = existingConfirmation ?? (await confirm(txid));
  checkedConfirmation(confirmation, txid, cell);
  const inputConfirmations =
    typeof unspent.confirmations === 'number' ? unspent.confirmations : confirmation.confirmations;
  requireCondition(
    inputConfirmations >= input.confirmations && confirmation.confirmations >= input.confirmations,
    'Indexed input lacks the required confirmations'
  );
  if (typeof unspent.blockHeight === 'number') {
    requireCondition(
      unspent.blockHeight === confirmation.blockHeight,
      'Indexed input block differs from chain confirmation'
    );
  }
  requireCondition(typeof unspent.address === 'string', 'Indexed input has no verifiable address');
  return unspent.address;
}

function checkedWitness(psbt: utxolib.bitgo.UtxoPsbt, amount: bigint, address: string, network: utxolib.Network): void {
  const witness = psbt.data.inputs[0].witnessUtxo;
  requireCondition(
    witness?.value === amount && witness.script.equals(utxolib.address.toOutputScript(address, network)),
    'PSBT witness UTXO differs from the indexed input'
  );
}

function checkedConfirmation(result: PairedConfirmation, txid: string, cell: Cell): void {
  const expectedNetwork = cell.coin === 'tbtcstxsignet' ? 'bitcoin-signet' : 'bitcoin-regtest';
  requireCondition(result.network === expectedNetwork, 'Confirmation belongs to another Bitcoin network');
  requireCondition(
    result.txid.toLowerCase() === txid && positiveHeight(result.blockHeight),
    'Bitcoin confirmation differs from the submitted transaction'
  );
  requireCondition(
    Number.isSafeInteger(result.confirmations) && result.confirmations >= 1,
    'Submitted transaction is not confirmed'
  );
}

function checkedIndex(result: PairedIndexedOutput, txid: string, address: string, amount: bigint): void {
  validateOutpoint(result);
  requireCondition(result.outpoint.toLowerCase().startsWith(`${txid}:`), 'BitGo indexed a different transaction');
  requireCondition(
    result.address === address && sats(result.amountSats, 'Indexed amount') === amount,
    'Indexed output differs from the inspected PSBT'
  );
}

function pendingApprovalResponse(value: unknown, coin: string): { id: string; state: string; psbtHex: string } {
  const approval = record(value) && record(value.pendingApproval) ? value.pendingApproval : value;
  requireCondition(
    record(approval) && typeof approval.id === 'string' && safeIdPattern.test(approval.id),
    'Custodial initiation returned no pending approval ID'
  );
  requireCondition(approval.state === 'awaitingSignature', 'Custodial initiation did not await a signature');
  const request = record(approval.info) ? approval.info.transactionRequest : undefined;
  requireCondition(record(request) && request.isUnsigned === true, 'Custodial pending approval is not unsigned');
  const coinSpecific = record(request.coinSpecific) ? request.coinSpecific[coin] : undefined;
  requireCondition(
    record(coinSpecific) && typeof coinSpecific.txHex === 'string',
    'Custodial pending approval has no inspectable PSBT'
  );
  return { id: approval.id, state: approval.state, psbtHex: coinSpecific.txHex };
}

function approvalTxid(value: unknown): string | undefined {
  if (!record(value)) return undefined;
  return typeof value.txid === 'string' ? value.txid.toLowerCase() : undefined;
}

async function signAndSubmitChecked(
  wallet: IWallet,
  prebuild: PrebuildTransactionResult,
  walletPassphrase: string,
  network: utxolib.Network,
  expectedTxid: string
): Promise<void> {
  const signed: unknown = await wallet.signTransaction({ txPrebuild: prebuild, walletPassphrase });
  requireCondition(record(signed), 'BitGo did not return an inspectable signed PSBT');
  const halfSigned = record(signed.halfSigned) ? signed.halfSigned : undefined;
  const payload = halfSigned ?? signed;
  const txHex = typeof payload.txHex === 'string' ? payload.txHex : undefined;
  const txBase64 = typeof payload.txBase64 === 'string' ? payload.txBase64 : undefined;
  requireCondition(txHex || txBase64, 'BitGo did not return an inspectable signed PSBT');
  const signedPsbt = decodePsbt({ ...prebuild, txHex, txBase64 }, network);
  requireCondition(
    signedPsbt.getUnsignedTx().getId() === expectedTxid,
    'Signing changed the inspected unsigned transaction'
  );
  const native = WasmPsbt.deserialize(signedPsbt.toBuffer());
  requireCondition(
    native.getInputs().every((_input, index) => native.hasPartialSignatures(index)),
    'Signed PSBT has no signature for its selected input'
  );
  let options: SubmitTransactionOptions;
  if (halfSigned) {
    options = { halfSigned: { ...(txHex ? { txHex } : {}), ...(txBase64 ? { txBase64 } : {}) } };
  } else {
    requireCondition(txHex, 'BitGo returned no submit-ready signed transaction');
    options = { txHex };
  }
  const submitted: unknown = await wallet.submitTransaction(options);
  requireCondition(record(submitted) && submitted.txid === expectedTxid, 'Submission differs from inspected PSBT');
}

export interface CustodialApprover {
  bitgo: BitGoAPI;
  actorId: string;
  otp?: string;
}

interface CustodialAuthorizationArgs {
  cell: Cell;
  actorId: string;
  approver?: CustodialApprover;
  checkpoint: Checkpoint;
  checkpointApproval?: (approval: { id: string; txid?: string }) => Promise<void>;
}

/**
 * Re-reads the pending approval as the distinct approver, verifies it is the inspected PSBT, checkpoints
 * the approval ID and approves it. The caller decides what the resulting state means: custodial wallets
 * stay `awaitingSignature` until BitGo Trust signs offline, so this never claims a broadcast.
 */
async function authorizeCustodialApproval(
  args: CustodialAuthorizationArgs,
  walletId: string,
  approvalId: string,
  expectedPsbtHex: string,
  txid: string,
  evidence: Evidence
) {
  const { approver } = args;
  requireCondition(
    approver !== undefined && args.checkpointApproval !== undefined,
    'Custodial approval is unavailable'
  );
  const approval = await approver.bitgo.coin(args.cell.coin).pendingApprovals().get({ id: approvalId });
  requireCondition(
    approval.id() === approvalId && approval.walletId() === walletId,
    'Approval does not belong to selected wallet'
  );
  requireCondition(
    approval.creator() === args.actorId && approval.creator() !== approver.actorId,
    'Approval creator is not the distinct initiating actor'
  );
  requireCondition(approval.state() === 'awaitingSignature', 'Approval is no longer awaiting signature');
  const refreshed = pendingApprovalResponse(approval.toJSON(), args.cell.coin);
  requireCondition(
    refreshed.id === approvalId && refreshed.psbtHex === expectedPsbtHex,
    'Approval PSBT changed before authorization'
  );
  await args.checkpointApproval({ id: approvalId, txid });
  await args.checkpoint(evidence);
  let approved: unknown;
  try {
    approved = await approval.approve(approver.otp ? { otp: approver.otp } : {});
  } catch (error) {
    const status = record(error) ? (typeof error.status === 'number' ? error.status : error.statusCode) : undefined;
    if (
      status === 401 ||
      status === 403 ||
      (status === 400 && error instanceof Error && /otp|approv|policy/i.test(error.message))
    ) {
      throw new MatrixPrerequisite(
        'BLOCKED',
        `Distinct custodial actor could not authorize the pending approval, HTTP ${status}`
      );
    }
    throw error;
  }
  const final = await approver.bitgo.coin(args.cell.coin).pendingApprovals().get({ id: approvalId });
  requireCondition(final.id() === approvalId, 'Custodial approval ID changed after authorization');
  const approvedId = approvalTxid(approved);
  requireCondition(
    approvedId === undefined || approvedId === txid,
    'Custodial approval returned a different transaction ID'
  );
  return { approved, final };
}

export async function pairedStake(args: PairedStakeArgs): Promise<PairedStakeEvidence> {
  await checkedMainWallet(args);
  const network = networkForCell(args.cell);
  const inputAmount = sats(args.input.amountSats, 'Selected input amount');
  const amount = sats(args.amountSats, 'Stake amount');
  const maxStake = sats(args.maxStakeSats, 'Stake cap');
  const maxFee = sats(args.maxFeeSats, 'Fee cap');
  requireCondition(amount <= maxStake && amount + 1n <= inputAmount, 'Stake exceeds the configured cap or input');
  requireCondition(
    positiveHeight(args.protocolMinimumUnlockHeight) && positiveHeight(args.unlockHeight),
    'Protocol unlock height is invalid'
  );
  requireCondition(
    args.unlockHeight === args.protocolMinimumUnlockHeight,
    'Unlock height differs from the protocol minimum'
  );
  const tip = await args.getTip();
  requireCondition(
    Number.isSafeInteger(tip) && tip > 0 && tip < args.unlockHeight,
    'Protocol unlock height must be future to the observed tip'
  );
  requireCondition(args.unlockHeight - tip > 1, 'Protocol unlock height is implausibly close to the Bitcoin tip');
  requireCondition(args.principalPreimage.length === 32, 'Stake commitment requires a 32-byte principal preimage');
  requireCondition(args.earlyExitKey.length === 33, 'Early-exit key must be a compressed public key');
  const inputAddress = await checkedWalletInput(args.mainWallet, args.input, args.cell, args.confirm);

  const params = makePox5StakingBuildParams({
    amountSats: amount.toString(),
    unlockHeight: args.unlockHeight,
    principalPreimage: args.principalPreimage,
    earlyExitKey: args.earlyExitKey,
    requestId: args.requestId,
    unspents: [args.input.outpoint],
  });
  let prebuild: PrebuildTransactionResult;
  let approvalId: string | undefined;
  if (args.cell.walletType === 'hot') {
    if (!args.walletPassphrase)
      throw new MatrixPrerequisite('BLOCKED', 'Hot paired stake requires a wallet passphrase');
    prebuild = await args.mainWallet.prebuildTransaction(params);
  } else {
    if (!args.approver || !args.checkpointApproval) {
      throw new MatrixPrerequisite(
        'BLOCKED',
        'Custodial paired stake requires a separate approver and durable approval checkpoint'
      );
    }
    requireCondition(
      args.approver.bitgo !== args.bitgo && args.approver.bitgo.getEnv() === args.cell.environment,
      'Custodial approval must use a separate client in the same environment'
    );
    requireCondition(args.approver.actorId !== args.actorId, 'Custodial initiator cannot approve its own request');
    await authenticatedActor(args.approver.bitgo, args.approver.actorId);
    await args.checkpoint({
      walletId: args.mainWalletId,
      outpoint: args.input.outpoint,
      amountSats: Number(amount),
      unlockHeight: args.unlockHeight,
      observedHeight: tip,
    });
    const initiated: unknown = await args.mainWallet.sendMany(params);
    const candidate = record(initiated) && record(initiated.pendingApproval) ? initiated.pendingApproval : initiated;
    if (record(candidate) && typeof candidate.id === 'string' && safeIdPattern.test(candidate.id)) {
      await args.checkpointApproval({ id: candidate.id });
    }
    const pending = pendingApprovalResponse(initiated, args.cell.coin);
    approvalId = pending.id;
    prebuild = { txHex: pending.psbtHex, walletId: args.mainWalletId };
  }

  const psbt = decodePsbt(prebuild, network);
  selectedInput(psbt, args.input.outpoint);
  checkedWitness(psbt, inputAmount, inputAddress, network);
  if (approvalId !== undefined) {
    const unsigned = WasmPsbt.deserialize(psbt.toBuffer());
    requireCondition(
      unsigned.getInputs().every((_input, index) => !unsigned.hasPartialSignatures(index)),
      'Custodial pending approval was already signed'
    );
  }
  requireCondition(psbt.locktime === 0, 'Stake PSBT unexpectedly has a transaction locktime');
  const fee = inspectFee(psbt, inputAmount, maxFee, prebuild);
  requireCondition(inputAmount - amount - fee >= 0n, 'Stake and fee exceed the confirmed input');
  const pairedId = getPox5WalletSpecific(
    await args.bitgo.coin(args.cell.coin).wallets().get({ id: args.mainWalletId })
  )?.pairedWalletId;
  requireCondition(typeof pairedId === 'string', 'Staking build did not link a paired wallet');
  const paired = await checkedPair(args, pairedId);
  const descriptor = exactDescriptor(
    paired,
    args.unlockHeight,
    createHash('sha256').update(args.principalPreimage).digest(),
    Buffer.from(args.earlyExitKey)
  );
  const expectedScript = scriptAt(descriptor, args.descriptorIndex);
  const outputs = psbt.getUnsignedTx().outs;
  const matching = outputs
    .map((output, index) => ({ output, index }))
    .filter(({ output }) => output.script.equals(expectedScript));
  requireCondition(
    matching.length === 1 && matching[0].output.value === amount,
    'Stake PSBT has no unique descriptor-bound lockup output'
  );
  for (const [index, output] of outputs.entries()) {
    if (index === matching[0].index) continue;
    const changeAddress = utxolib.address.fromOutputScript(output.script, network);
    const owned: unknown = await args.mainWallet.getAddress({ address: changeAddress });
    requireCondition(record(owned) && owned.address === changeAddress, 'Stake PSBT has an external non-lockup output');
  }
  const txid = psbt.getUnsignedTx().getId();
  requireCondition(txidPattern.test(txid), 'Stake PSBT has no transaction ID');
  const address = utxolib.address.fromOutputScript(expectedScript, network);
  let evidence: Evidence = {
    walletId: args.mainWalletId,
    descriptorWalletId: pairedId,
    outpoint: args.input.outpoint,
    amountSats: Number(amount),
    feeSats: Number(fee),
    unlockHeight: args.unlockHeight,
    observedHeight: tip,
    txid,
  };
  if (args.cell.walletType === 'hot') {
    await args.checkpoint(evidence);
    await signAndSubmitChecked(args.mainWallet, prebuild, args.walletPassphrase!, network, txid);
  } else {
    requireCondition(approvalId !== undefined && args.approver !== undefined, 'Custodial approval is unavailable');
    const { final } = await authorizeCustodialApproval(
      args,
      args.mainWalletId,
      approvalId,
      prebuild.txHex!,
      txid,
      evidence
    );
    requireCondition(
      final.state() === 'awaitingSignature',
      'Custodial approval left the awaiting-signature state without the offline signature'
    );
    // Expected for custody: the approval stays awaitingSignature until BitGo Trust signs
    // offline in OVC. The offline loop signs it (and, opt-in, uploads it) via the local
    // OVC sign-export CLI and the custodyadmin session.
    evidence = await resolveOfflineCustodialSignature({
      cell: args.cell,
      env: args.env,
      approver: args.approver,
      approvalId,
      expected: {
        psbtHex: prebuild.txHex!,
        txid,
        address,
        amountSats: String(amount),
        feeSats: String(fee),
        locktime: psbt.locktime,
      },
      evidence,
      checkpoint: args.checkpoint,
    });
  }
  const confirmation = await args.confirm(txid);
  checkedConfirmation(confirmation, txid, args.cell);
  const indexed = await args.indexed(pairedId, txid, address);
  checkedIndex(indexed, txid, address, amount);
  requireCondition(
    indexed.outpoint.toLowerCase() === `${txid}:${matching[0].index}`,
    'Paired wallet indexed a different lockup output'
  );
  return {
    ...evidence,
    outpoint: indexed.outpoint,
    confirmations: confirmation.confirmations,
    ...(approvalId ? { approvalId, approvalStatus: 'approved' as const } : {}),
  };
}

export async function pairedRecovery(args: PairedRecoveryArgs): Promise<Evidence> {
  const custodial = args.cell.walletType === 'custodial';
  if (custodial) {
    if (!args.approver || !args.checkpointApproval) {
      throw new MatrixPrerequisite(
        'BLOCKED',
        'Custodial paired recovery requires a separate approver and durable approval checkpoint'
      );
    }
    requireCondition(
      args.approver.bitgo !== args.bitgo && args.approver.bitgo.getEnv() === args.cell.environment,
      'Custodial approval must use a separate client in the same environment'
    );
    requireCondition(args.approver.actorId !== args.actorId, 'Custodial initiator cannot approve its own request');
    await authenticatedActor(args.approver.bitgo, args.approver.actorId);
  } else if (!args.walletPassphrase) {
    throw new MatrixPrerequisite('BLOCKED', 'Hot paired recovery requires a wallet passphrase');
  }
  await checkedMainWallet(args);
  const network = networkForCell(args.cell);
  validateOutpoint(args.fixture);
  requireCondition(
    sats(args.fixture.amountSats, 'Fixture amount') <= sats(args.maxRecoverySats, 'Recovery cap'),
    'Recovery input exceeds the configured cap'
  );
  requireCondition(positiveHeight(args.fixture.unlockHeight), 'Fixture descriptor unlock height is invalid');
  const tip = await args.getTip();
  requireCondition(Number.isSafeInteger(tip) && tip > 0, 'Bitcoin tip is invalid');
  if (tip < args.fixture.unlockHeight)
    throw new MatrixPrerequisite('NOT_READY', 'Pre-existing lockup has not reached its descriptor CLTV height');
  requireCondition(args.recoveryAddress.length > 0, 'Main-wallet recovery destination is missing');
  const owned: unknown = await args.mainWallet.getAddress({ address: args.recoveryAddress });
  requireCondition(
    record(owned) && owned.address === args.recoveryAddress,
    'Recovery destination is not controlled by the main wallet'
  );
  const paired = await checkedPair(args, args.pairedWalletId);
  const descriptor = exactDescriptor(paired, args.fixture.unlockHeight);
  const script = scriptAt(descriptor, args.fixture.descriptorIndex);
  const lockupAddress = utxolib.address.fromOutputScript(script, network);
  const lockupTxid = args.fixture.outpoint.split(':')[0].toLowerCase();
  const lockConfirmation = await args.confirm(lockupTxid);
  checkedConfirmation(lockConfirmation, lockupTxid, args.cell);
  requireCondition(lockConfirmation.blockHeight < tip, 'Recovery fixture must be a pre-existing confirmed lockup');
  const indexedAddress = await checkedWalletInput(paired, args.fixture, args.cell, args.confirm, lockConfirmation);
  requireCondition(indexedAddress === lockupAddress, 'Recovery fixture address differs from paired descriptor');
  const known = await args.indexed(paired.id(), lockupTxid, lockupAddress);
  checkedIndex(known, lockupTxid, lockupAddress, sats(args.fixture.amountSats, 'Fixture amount'));
  requireCondition(
    known.outpoint.toLowerCase() === args.fixture.outpoint.toLowerCase(),
    'Recovery fixture is not the indexed lockup output'
  );

  const exitParams = makePox5ExitBuildParams({
    address: args.recoveryAddress,
    outpoint: args.fixture.outpoint,
    branch: 'late',
  });
  let prebuild: PrebuildTransactionResult;
  let approvalId: string | undefined;
  if (!custodial) {
    prebuild = await paired.prebuildTransaction(exitParams);
  } else {
    // The paired wallet is itself a custodial descriptor wallet: initiating the exit creates a pending
    // approval whose PSBT BitGo Trust signs offline (OVC). Record the ID before inspecting anything.
    const initiated: unknown = await paired.sendMany(exitParams);
    const candidate = record(initiated) && record(initiated.pendingApproval) ? initiated.pendingApproval : initiated;
    if (record(candidate) && typeof candidate.id === 'string' && safeIdPattern.test(candidate.id)) {
      await args.checkpointApproval!({ id: candidate.id });
    }
    const pending = pendingApprovalResponse(initiated, args.cell.coin);
    approvalId = pending.id;
    prebuild = { txHex: pending.psbtHex, walletId: paired.id() };
  }
  const psbt = decodePsbt(prebuild, network);
  if (approvalId !== undefined) {
    const unsigned = WasmPsbt.deserialize(psbt.toBuffer());
    requireCondition(
      unsigned.getInputs().every((_input, index) => !unsigned.hasPartialSignatures(index)),
      'Custodial pending approval was already signed'
    );
  }
  selectedInput(psbt, args.fixture.outpoint);
  checkedWitness(psbt, sats(args.fixture.amountSats, 'Fixture amount'), lockupAddress, network);
  requireCondition(
    psbt.locktime >= args.fixture.unlockHeight && psbt.locktime <= tip,
    'Recovery PSBT locktime is not mature'
  );
  requireCondition(psbt.txInputs[0].sequence !== 0xffffffff, 'Recovery PSBT input has a final sequence');
  const input = psbt.data.inputs[0];
  requireCondition(
    input.witnessUtxo?.script.equals(script),
    'Recovery input witness script differs from paired descriptor'
  );
  requireCondition(
    input.witnessUtxo?.value === sats(args.fixture.amountSats, 'Fixture amount'),
    'Recovery input witness amount differs from fixture'
  );
  const native = WasmPsbt.deserialize(psbt.toBuffer());
  const match = pox5.matchPox5Input(
    native,
    0,
    descriptorWallet.toDescriptorMap([{ name: 'Pox5Lockup', value: descriptor }])
  );
  requireCondition(
    match && match.index === args.fixture.descriptorIndex,
    'Recovery input does not match the indexed PoX-5 descriptor'
  );
  pox5Staking.assertPox5LocktimeSpend(native, [match]);
  const outputs = psbt.getUnsignedTx().outs;
  const recoveryScript = utxolib.address.toOutputScript(args.recoveryAddress, network);
  requireCondition(
    outputs.length === 1 && outputs[0].script.equals(recoveryScript) && outputs[0].value > 0n,
    'Recovery PSBT must pay only the verified main-wallet address'
  );
  const fee = inspectFee(
    psbt,
    sats(args.fixture.amountSats, 'Fixture amount'),
    sats(args.maxFeeSats, 'Fee cap'),
    prebuild
  );
  const txid = psbt.getUnsignedTx().getId();
  requireCondition(txidPattern.test(txid), 'Recovery PSBT has no transaction ID');
  let evidence: Evidence = {
    walletId: args.mainWalletId,
    descriptorWalletId: paired.id(),
    outpoint: args.fixture.outpoint,
    amountSats: Number(outputs[0].value),
    feeSats: Number(fee),
    unlockHeight: args.fixture.unlockHeight,
    observedHeight: tip,
    txid,
  };
  if (custodial) {
    requireCondition(approvalId !== undefined, 'Custodial approval is unavailable');
    const { final } = await authorizeCustodialApproval(args, paired.id(), approvalId, prebuild.txHex!, txid, evidence);
    requireCondition(
      final.state() === 'awaitingSignature',
      'Custodial approval left the awaiting-signature state without the offline signature'
    );
    // Expected for custody: the approval stays awaiting signature until BitGo Trust signs
    // offline in OVC. The recovery cell only reaches this point once the tip is at or above
    // the descriptor CLTV height, so the exit upload stays final.
    evidence = await resolveOfflineCustodialSignature({
      cell: args.cell,
      env: args.env,
      approver: args.approver!,
      approvalId,
      expected: {
        psbtHex: prebuild.txHex!,
        txid,
        address: args.recoveryAddress,
        amountSats: String(outputs[0].value),
        feeSats: String(fee),
        locktime: psbt.locktime,
      },
      evidence,
      checkpoint: args.checkpoint,
    });
  } else {
    await args.checkpoint(evidence);
    await signAndSubmitChecked(paired, prebuild, args.walletPassphrase!, network, txid);
  }
  const confirmation = await args.confirm(txid);
  checkedConfirmation(confirmation, txid, args.cell);
  const recovered = await args.indexed(args.mainWalletId, txid, args.recoveryAddress);
  checkedIndex(recovered, txid, args.recoveryAddress, outputs[0].value);
  requireCondition(recovered.outpoint.toLowerCase() === `${txid}:0`, 'Recovered output index differs from PSBT');
  return { ...evidence, confirmations: confirmation.confirmations };
}
