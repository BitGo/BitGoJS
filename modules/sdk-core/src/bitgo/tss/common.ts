import assert from 'assert';
import openpgp from 'openpgp';

import { BitGoBase } from '../bitgoBase';
import { TxRequestChallengeResponse } from './types';
import {
  RequestType,
  TxRequest,
  verifyPrimaryUserWrapper,
  SignatureShareRecord,
  CommitmentShareRecord,
  EncryptedSignerShareRecord,
  ExchangeCommitmentResponse,
  RequestTracer,
} from '../utils';
import { IRequestTracer } from '../../api';

/**
 * Gets the latest Tx Request by id
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest id
 * @param {IRequestTracer} reqId - the request tracer request id
 * @returns {Promise<TxRequest>}
 */
export async function getTxRequest(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  reqId?: IRequestTracer
): Promise<TxRequest> {
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);
  const txRequestRes = await bitgo
    .get(bitgo.url('/wallet/' + walletId + '/txrequests', 2))
    .query({ txRequestIds: txRequestId, latest: 'true' })
    .retry(3)
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
 * @param requestType - The type of request being submitted (either tx or message for signing)
 * @param signerShare
 * @param mpcAlgorithm
 * @param apiMode
 * @param {IRequestTracer} reqId - the request tracer request id
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendSignatureShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  signatureShare: SignatureShareRecord,
  requestType: RequestType,
  signerShare?: string,
  mpcAlgorithm: 'eddsa' | 'ecdsa' = 'eddsa',
  apiMode: 'full' | 'lite' = 'lite',
  userPublicGpgKey?: string,
  reqId?: IRequestTracer
): Promise<SignatureShareRecord> {
  let addendum = '';
  switch (requestType) {
    case RequestType.tx:
      if (mpcAlgorithm === 'ecdsa' || apiMode === 'full') {
        addendum = '/transactions/0';
      }
      break;
    case RequestType.message:
      if (mpcAlgorithm === 'ecdsa' || apiMode === 'full') {
        addendum = '/messages/0';
      }
      break;
  }
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/signatureshares';
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);
  return bitgo
    .post(bitgo.url(urlPath, 2))
    .send({
      signatureShare,
      signerShare,
      userPublicGpgKey,
    })
    .result();
}

/**
 * Sends a Signature Share using the sign txRequest route
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param signatureShares
 * @param requestType - The type of request being submitted (either tx or message for signing)
 * @param signerShare
 * @param mpcAlgorithm
 * @param multisigTypeVersion
 * @param signerGpgPublicKey
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendSignatureShareV2(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  signatureShares: SignatureShareRecord[],
  requestType: RequestType,
  mpcAlgorithm: 'eddsa' | 'ecdsa',
  signerGpgPublicKey: string,
  signerShare?: string,
  multisigTypeVersion?: 'MPCv2' | undefined
): Promise<TxRequest> {
  const addendum = requestType === RequestType.tx ? '/transactions/0' : '/messages/0';
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/sign';
  let type = '';
  if (multisigTypeVersion === 'MPCv2' && mpcAlgorithm === 'ecdsa') {
    type = 'ecdsaMpcV2';
  } else if (multisigTypeVersion === undefined && mpcAlgorithm === 'eddsa') {
    type = 'eddsaMpcV1';
  }
  const requestBody = {
    type,
    signatureShares,
    signerShare,
    signerGpgPublicKey,
  };
  return bitgo.post(bitgo.url(urlPath, 2)).send(requestBody).result();
}

/**
 * Sends a Transaction Request for broadcast once signing is complete
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param requestType - The type of request being submitted (either tx or message for signing)
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendTxRequest(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  requestType: RequestType
): Promise<TxRequest> {
  const addendum = requestType === RequestType.tx ? '/transactions/0' : '/messages/0';
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/send';
  return bitgo.post(bitgo.url(urlPath, 2)).send().result();
}

/**
 * Sends the client commitment and encrypted signer share to the server, getting back the server commitment
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {string} walletId - the wallet id
 * @param {string} txRequestId - the txRequest Id
 * @param {CommitmentShareRecord} commitmentShare - the client commitment share
 * @param {EncryptedSignerShareRecord} encryptedSignerShare - the client encrypted signer share
 * @param {string} [apiMode] - the txRequest api mode (full or lite) - defaults to lite
 * @param {IRequestTracer} reqId - the request tracer request Id
 * @returns {Promise<ExchangeCommitmentResponse>} - the server commitment share
 */
export async function exchangeEddsaCommitments(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  commitmentShare: CommitmentShareRecord,
  encryptedSignerShare: EncryptedSignerShareRecord,
  apiMode: 'full' | 'lite' = 'lite',
  reqId?: IRequestTracer
): Promise<ExchangeCommitmentResponse> {
  let addendum = '';
  if (apiMode === 'full') {
    addendum = '/transactions/0';
  }
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/commit';
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);
  return await bitgo.post(bitgo.url(urlPath, 2)).send({ commitmentShare, encryptedSignerShare }).result();
}

/**
 * Verifies that a TSS wallet signature was produced with the expected key and that the signed data contains the
 * expected common keychain as well as the expected user and backup key ids
 */
export async function commonVerifyWalletSignature(params: {
  walletSignature: openpgp.Key;
  bitgoPub: openpgp.Key;
  commonKeychain: string;
  userKeyId: string;
  backupKeyId: string;
}): Promise<{ value: ArrayBuffer }[]> {
  const { walletSignature, bitgoPub, commonKeychain, userKeyId, backupKeyId } = params;

  // By ensuring that the fingerprints of the walletSignature and the bitgoPub are different and that any of the results
  // from calling verifyPrimaryUser is valid we know that the signature was actually produced by the private key
  // belonging to the bitgoPub.
  if (walletSignature.keyPacket.getFingerprint() === bitgoPub.keyPacket.getFingerprint()) {
    throw new Error('Invalid HSM GPG signature');
  }

  const verificationResult = await verifyPrimaryUserWrapper(walletSignature, bitgoPub, false);
  const isValid = verificationResult.some((result) => result.valid);
  if (!isValid) {
    throw new Error('Invalid HSM GPG signature');
  }
  const primaryUser = await walletSignature.getPrimaryUser();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore the rawNotations property is missing from the type but it actually exists
  const rawNotations: { value: Uint8Array }[] = primaryUser.user.otherCertifications[0].rawNotations;

  assert(rawNotations.length === 5, 'invalid wallet signatures');

  assert(
    commonKeychain === Buffer.from(rawNotations[0].value).toString(),
    'wallet signature does not match common keychain'
  );
  assert(userKeyId === Buffer.from(rawNotations[1].value).toString(), `wallet signature does not match user key id`);
  assert(
    backupKeyId === Buffer.from(rawNotations[2].value).toString(),
    'wallet signature does not match backup key id'
  );

  return rawNotations;
}

/**
 * Gets challenge for a tx request from BitGo
 * supports Message and regular Transaction
 * @param bitgo
 * @param walletId
 * @param txRequestId
 * @param index
 * @param requestType
 * @param paillierModulus
 * @param reqId
 */
export async function getTxRequestChallenge(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  index: string,
  requestType: RequestType,
  paillierModulus: string,
  reqId?: IRequestTracer
): Promise<TxRequestChallengeResponse> {
  let addendum = '';
  switch (requestType) {
    case RequestType.tx:
      addendum = '/transactions/' + index;
      break;
    case RequestType.message:
      addendum = '/messages/' + index;
      break;
  }
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/challenge';
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);
  return await bitgo.post(bitgo.url(urlPath, 2)).send({ paillierModulus }).result();
}
