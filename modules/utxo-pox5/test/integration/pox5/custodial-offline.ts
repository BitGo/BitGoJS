import * as utxolib from '@bitgo/utxo-lib';
import type { BitGoAPI } from '@bitgo/sdk-api';

import { networkForCoin } from './bitgo-api-helpers';
import { liveCustodyAdmin } from './live-matrix-provision';
import { MatrixPrerequisite, type Cell, type Checkpoint, type Evidence } from './live-matrix';
import { ovcSignerConfigFromEnv, signWithOvc, type OvcSignerOutput } from './ovc-signer';
import { isRecord } from './rpc';

/**
 * Custodial offline signing loop (WAL-2162): fetch the awaiting-signature
 * export, sign it with the OVC sign-export CLI, cross-check the result against
 * the inspected PSBT, and (opt-in) upload it to resolve the pending approval.
 *
 * Actor split (verified on the test env): the policy approver authorizes the
 * approval, but the upload must come from a *distinct* actor — Wallet Platform
 * records one resolution per user, so the approver's own upload is rejected
 * with "cannot approve an action multiple times". The harness uses the
 * custodyadmin session for the upload, mirroring the BitGo Trust operational
 * split.
 *
 * Flags:
 *   POX5_LIVE_OVC_SIGN   default off; when off, custodial cells stay BLOCKED
 *                        awaiting the offline signature (unchanged behavior)
 *   POX5_LIVE_OVC_UPLOAD default off; requires SIGN. When off, the approval is
 *                        signed and checkpointed but stays awaiting signature.
 *
 * The late-exit cell only reaches this flow once the tip is at or above the
 * descriptor CLTV height (enforced upstream), which keeps the exit broadcast
 * final.
 */

export type AwaitingSignatureExport = {
  transactions: Record<string, unknown>[];
  errors?: unknown[];
};

/** Fetches the raw awaiting-signature export for one approval via the non-admin route. */
export async function fetchAwaitingSignatureExport(
  bitgo: BitGoAPI,
  coin: string,
  approvalId: string
): Promise<AwaitingSignatureExport> {
  const url = bitgo.url(
    `/pendingapprovals/awaitingSignature?id=${encodeURIComponent(approvalId)}&coins=${encodeURIComponent(coin)}`,
    2
  );
  const response: unknown = await bitgo.get(url).result();
  if (!isRecord(response) || !Array.isArray(response.transactions)) {
    throw new Error('Awaiting-signature response has no transactions list');
  }
  const transactions = response.transactions.filter((transaction) => isRecord(transaction));
  if (transactions.length !== 1) {
    throw new Error(`Awaiting-signature response carries ${transactions.length} transactions, expected exactly one`);
  }
  const coinSpecific = isRecord(transactions[0].coinSpecific) ? transactions[0].coinSpecific : undefined;
  if (!coinSpecific || typeof coinSpecific.txHex !== 'string') {
    throw new Error('Awaiting-signature transaction has no coinSpecific.txHex PSBT');
  }
  const errors = Array.isArray(response.errors) ? response.errors : undefined;
  return { transactions: transactions as Record<string, unknown>[], ...(errors ? { errors } : {}) };
}

function signedTxHexOf(transaction: Record<string, unknown>): string {
  if (typeof transaction.txHex === 'string') {
    return transaction.txHex;
  }
  if (isRecord(transaction.halfSigned) && typeof transaction.halfSigned.txHex === 'string') {
    return transaction.halfSigned.txHex;
  }
  throw new Error('OVC signed transaction has neither txHex nor halfSigned.txHex');
}

/** Uploads the OVC half-signed transaction, resolving the pending approval. */
export async function uploadSignedApproval(
  bitgo: BitGoAPI,
  coin: string,
  approvalId: string,
  signedTransaction: Record<string, unknown>,
  diagnostics: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    state: 'approved',
    txHex: signedTxHexOf(signedTransaction),
    isSigned: true,
    diagnostics,
    ...(isRecord(signedTransaction.halfSigned) ? { halfSigned: signedTransaction.halfSigned } : {}),
  };
  const response: unknown = await bitgo
    .put(bitgo.url(`/${coin}/pendingapprovals/${approvalId}`, 2))
    .send(body)
    .result();
  if (!isRecord(response)) {
    throw new Error('Pending approval upload returned no object');
  }
  return response;
}

async function fetchPendingApprovalState(bitgo: BitGoAPI, coin: string, approvalId: string): Promise<string> {
  const response: unknown = await bitgo.get(bitgo.url(`/${coin}/pendingapprovals/${approvalId}`, 2)).result();
  if (!isRecord(response) || typeof response.state !== 'string') {
    throw new Error('Pending approval response has no state');
  }
  return response.state;
}

export function ovcSigningEnabled(env: NodeJS.ProcessEnv): boolean {
  return env.POX5_LIVE_OVC_SIGN === 'true' || env.POX5_LIVE_OVC_SIGN === '1';
}

export function ovcUploadEnabled(env: NodeJS.ProcessEnv): boolean {
  return ovcSigningEnabled(env) && (env.POX5_LIVE_OVC_UPLOAD === 'true' || env.POX5_LIVE_OVC_UPLOAD === '1');
}

function feeSatsOf(fee: unknown): number | undefined {
  if (typeof fee === 'number') {
    return fee;
  }
  if (typeof fee === 'string') {
    return Number(fee);
  }
  if (isRecord(fee) && (typeof fee.fee === 'number' || typeof fee.fee === 'string')) {
    return Number(fee.fee);
  }
  return undefined;
}

export type OfflineCustodialExpected = {
  /** The PSBT hex the cell inspected (the pending approval's PSBT). */
  psbtHex: string;
  /** Unsigned transaction id of the inspected PSBT. */
  txid: string;
  /** The single recipient address the PSBT must pay. */
  address: string;
  amountSats: string;
  feeSats: string;
  locktime?: number;
};

export type ResolveOfflineCustodialArgs = {
  cell: Cell;
  env: NodeJS.ProcessEnv;
  /** The policy approver; its client is used for the (read-only) export fetch. */
  approver: { bitgo: BitGoAPI; actorId: string };
  approvalId: string;
  expected: OfflineCustodialExpected;
  evidence: Evidence;
  checkpoint: Checkpoint;
  /** Injectable for tests. */
  signFunction?: typeof signWithOvc;
  /** Injectable for tests. */
  custodyAdminClient?: BitGoAPI;
};

/**
 * Runs the offline custodial loop after the policy authorization left the
 * approval in `awaitingSignature`. Returns the extended evidence only after a
 * successful upload; with signing or upload disabled it BLOCKs (with the
 * signature evidence checkpointed first when signing ran).
 */
export async function resolveOfflineCustodialSignature(
  args: ResolveOfflineCustodialArgs
): Promise<Evidence & { signedWith: 'OVC' }> {
  if (!ovcSigningEnabled(args.env)) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Custodial approval awaits the offline BitGo Trust signature (OVC); set POX5_LIVE_OVC_SIGN=true to sign it via the local OVC sign-export CLI'
    );
  }
  const config = ovcSignerConfigFromEnv(args.env);

  const exportResponse = await fetchAwaitingSignatureExport(args.approver.bitgo, args.cell.coin, args.approvalId);
  const coinSpecific = isRecord(exportResponse.transactions[0].coinSpecific)
    ? (exportResponse.transactions[0].coinSpecific as Record<string, unknown>)
    : {};
  if (coinSpecific.txHex !== args.expected.psbtHex) {
    throw new Error('Awaiting-signature export differs from the inspected pending-approval PSBT');
  }

  const signed: OvcSignerOutput = await (args.signFunction ?? signWithOvc)(
    exportResponse,
    'sign',
    config,
    args.cell.environment
  );

  if (signed.pendingApprovalId !== undefined && signed.pendingApprovalId !== args.approvalId) {
    throw new Error('OVC signed a different pending approval than the one being resolved');
  }
  const paysExpectedRecipient = signed.explanation.outputs.some(
    (output) => output.address === args.expected.address && output.amount === args.expected.amountSats
  );
  if (!paysExpectedRecipient) {
    throw new Error('OVC explanation does not pay the expected recipient and amount');
  }
  const feeSats = feeSatsOf(signed.explanation.fee);
  if (feeSats !== undefined && feeSats !== Number(args.expected.feeSats)) {
    throw new Error(`OVC explanation fee ${feeSats} differs from the inspected fee ${args.expected.feeSats}`);
  }
  if (
    args.expected.locktime !== undefined &&
    typeof signed.explanation.locktime === 'number' &&
    signed.explanation.locktime !== args.expected.locktime
  ) {
    throw new Error(`OVC explanation locktime ${signed.explanation.locktime} differs from the inspected PSBT`);
  }
  const signedTransaction = signed.transactions![0];
  const signedPsbt = utxolib.bitgo.createPsbtFromBuffer(
    Buffer.from(signedTxHexOf(signedTransaction), 'hex'),
    networkForCoin(args.cell.coin)
  );
  if (signedPsbt.getUnsignedTx().getId() !== args.expected.txid) {
    throw new Error('OVC signing changed the unsigned transaction');
  }
  const hasUserSignature =
    signed.signatures?.some((signature) => signature.user === true) === true ||
    signedPsbt.data.inputs.some((input) => (input.partialSig?.length ?? 0) > 0);
  if (!hasUserSignature) {
    throw new Error('OVC signing produced no user signature');
  }

  const evidence: Evidence & { signedWith: 'OVC' } = {
    ...args.evidence,
    pendingApprovalId: args.approvalId,
    signedWith: 'OVC',
  };
  await args.checkpoint(evidence);

  if (!ovcUploadEnabled(args.env)) {
    throw new MatrixPrerequisite(
      'BLOCKED',
      'Custodial approval is signed offline via OVC; set POX5_LIVE_OVC_UPLOAD=true to upload it via the custodyadmin session and broadcast'
    );
  }

  const custodyAdmin =
    args.custodyAdminClient !== undefined
      ? { bitgo: args.custodyAdminClient }
      : await liveCustodyAdmin(args.cell.environment, args.env, { userId: args.approver.actorId });

  const diagnostics: Record<string, unknown> = {
    source: 'pox5-live-matrix',
    signedWith: 'ovc-sign-export',
    environment: args.cell.environment,
    coin: args.cell.coin,
  };
  const uploaded = await uploadSignedApproval(
    custodyAdmin.bitgo,
    args.cell.coin,
    args.approvalId,
    signedTransaction,
    diagnostics
  );
  // A 200 upload resolves the approval. The platform removes resolved approvals
  // shortly after, so the follow-up GET may legitimately 404 (verified on the
  // test env); only a follow-up state that is present and not approved fails.
  const uploadedState = typeof uploaded.state === 'string' ? uploaded.state : undefined;
  if (uploadedState !== 'approved' && typeof uploaded.approvedDate !== 'string') {
    let finalState: string | undefined;
    try {
      finalState = await fetchPendingApprovalState(custodyAdmin.bitgo, args.cell.coin, args.approvalId);
    } catch {
      finalState = undefined;
    }
    if (finalState !== undefined && finalState !== 'approved') {
      throw new Error(`Custodial upload left the approval in state ${finalState}`);
    }
  }
  await args.checkpoint(evidence);
  return evidence;
}
