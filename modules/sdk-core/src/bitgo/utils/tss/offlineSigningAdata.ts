/**
 * @prettier
 */
import assert from 'assert';
import { createHash } from 'crypto';

import { RequestType, TxRequest, UnsignedTransactionTss } from './baseTypes';

/**
 * Encrypted signing-share envelopes older than this are rejected along with their registry entries.
 */
export const OFFLINE_SIGNING_SHARE_MAX_AGE_MS = 30 * 24 * 3600 * 1000; // 30 days

/**
 * Computes the adata binding string for offline (external-signer) signing: the
 * sha256 of the signable payload, plus the derivation path (empty for message
 * signing). Encrypted share envelopes created from the signer's own key
 * material carry this adata and later rounds validate it, so an envelope can
 * only be replayed against the exact signable it was created for.
 */
export function getOfflineSigningAdata(
  txRequest: TxRequest,
  requestType: RequestType,
  params: { bufferToSign?: unknown } = {}
): string {
  let signablePayload: Buffer;
  let derivationPath: string;
  if (requestType === RequestType.tx) {
    let unsignedTx: UnsignedTransactionTss | undefined;
    if (txRequest.apiVersion === 'full') {
      assert(txRequest.transactions && txRequest.transactions.length > 0, 'Missing transactions in txRequest');
      unsignedTx = txRequest.transactions[0].unsignedTx;
    } else {
      assert(txRequest.unsignedTxs && txRequest.unsignedTxs.length > 0, 'Missing unsignedTxs in txRequest');
      unsignedTx = txRequest.unsignedTxs[0];
    }
    assert(unsignedTx, 'Missing unsignedTx in txRequest');
    assert(unsignedTx.signableHex, 'Missing signableHex in txRequest');
    signablePayload = Buffer.from(unsignedTx.signableHex, 'hex');
    derivationPath = unsignedTx.derivationPath ?? '';
  } else if (requestType === RequestType.message) {
    // Declared as Buffer, but over HTTP it may arrive as the JSON round-trip form `{ type: 'Buffer', data: number[] }`
    const bufferToSign: unknown = params.bufferToSign;
    assert(bufferToSign, 'Missing bufferToSign for message signing');
    if (Buffer.isBuffer(bufferToSign)) {
      signablePayload = bufferToSign;
    } else if (
      typeof bufferToSign === 'object' &&
      bufferToSign !== null &&
      'data' in bufferToSign &&
      Array.isArray(bufferToSign.data)
    ) {
      // JSON round-trip of a Buffer arrives as `{ type: 'Buffer', data: number[] }`
      signablePayload = Buffer.from(bufferToSign.data);
    } else {
      throw new Error('Invalid bufferToSign type');
    }
    derivationPath = '';
  } else {
    throw new Error(`Invalid requestType: ${requestType}`);
  }
  return `${createHash('sha256').update(signablePayload).digest('hex')}:${derivationPath}`;
}

/** Envelope adata format: `<STATE>:<createdEpochMs>:<sha256(signable)>:<derivationPath>`. */
export function formatOfflineSigningAdata(state: string, core: string): string {
  return `${state}:${Date.now()}:${core}`;
}

/**
 * Validates an encrypted share envelope's adata against the expected signable binding.
 * adata is AEAD-authenticated (v1 CCM / v2 GCM), so it cannot be stripped or altered
 * without breaking decryption. The creation timestamp is checked separately from the
 * binding, so the two concerns stay independent.
 */
export function validateOfflineSigningAdata(cyphertext: string, state: string, expectedCore: string): string {
  let stored: string | undefined;
  try {
    const raw = JSON.parse(cyphertext).adata;
    // v1 (SJCL) envelopes escape() the adata (':' -> '%3A'); decode before parsing,
    // matching baseTSSUtils.validateAdata.
    stored = typeof raw === 'string' ? decodeURIComponent(raw) : undefined;
  } catch {
    throw new Error('Failed to parse cyphertext to JSON');
  }
  if (typeof stored !== 'string') {
    throw new Error('Missing adata on encrypted share envelope; restart the signing session');
  }
  if (!stored.startsWith(`${state}:`)) {
    throw new Error('Adata does not match cyphertext adata');
  }
  const remainder = stored.slice(state.length + 1);
  const separator = remainder.indexOf(':');
  assert(separator > 0, 'Adata does not match cyphertext adata');
  const created = Number(remainder.slice(0, separator));
  const core = remainder.slice(separator + 1);
  if (core !== expectedCore) {
    throw new Error('Adata does not match cyphertext adata');
  }
  const now = Date.now();
  assert(
    Number.isFinite(created) && created <= now,
    'Encrypted share envelope has a future timestamp; restart the signing session'
  );
  assert(
    now - created <= OFFLINE_SIGNING_SHARE_MAX_AGE_MS,
    'Encrypted share envelope has expired; restart the signing session'
  );
  return stored;
}
