import { BitGoBase } from '../bitgoBase';
import { TxRequest } from '../utils';
import { SignatureShareRecord } from '../utils/tss/baseTypes';

/**
 * Gets the latest Tx Request by id
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @returns {Promise<TxRequest>}
 */
export async function getTxRequest(bitgo: BitGoBase, walletId: string, txRequestId: string): Promise<TxRequest> {
  const txRequestRes = await bitgo
    .get(bitgo.url('/wallet/' + walletId + '/txrequests', 2))
    .query({ txRequestIds: txRequestId, latest: 'true' })
    .result();

  if (txRequestRes.txRequests.length <= 0) {
    throw new Error(`Unable to find TxRequest with id ${txRequestId}`);
  }

  return txRequestRes.txRequests[0];
}

/**
 * Sends a Signature Share
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param {SignatureShareRecord} signatureShare - a Signature Share
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendSignatureShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  signatureShare: SignatureShareRecord,
  signerShare?: string,
  mpcAlgorithm: 'eddsa' | 'ecdsa' = 'eddsa',
  apiMode: 'full' | 'lite' = 'lite'
): Promise<SignatureShareRecord> {
  let transactions = '';
  if (mpcAlgorithm === 'ecdsa' || apiMode === 'full') {
    transactions = '/transactions/0';
  }

  return bitgo
    .post(bitgo.url('/wallet/' + walletId + '/txrequests/' + txRequestId + transactions + '/signatureshares', 2))
    .send({
      signatureShare,
      signerShare,
    })
    .result();
}
