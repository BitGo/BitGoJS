import assert from 'assert';
import openpgp from 'openpgp';

import { MPCv2SigningState } from '@bitgo/public-types';
import type { AttestationPayload } from '../wallet/BuildParams';
import { BitGoBase } from '../bitgoBase';
import { TxRequestChallengeResponse } from './types';
import { MPCAlgorithm } from '../baseCoin';
import {
  RequestType,
  TxRequest,
  verifyPrimaryUserWrapper,
  SignatureShareRecord,
  SignatureShareType,
  CommitmentShareRecord,
  EncryptedSignerShareRecord,
  ExchangeCommitmentResponse,
  RequestTracer,
} from '../utils';
import { IRequestTracer } from '../../api';

const debug = require('debug')('bitgo:tss:common');

export function getBitgoSignatureShare(
  signatureShares: SignatureShareRecord[],
  signerShareType: SignatureShareType,
  shareType: MPCv2SigningState
): SignatureShareRecord {
  const bitgoShare = signatureShares.find((share) => {
    if (share.from !== SignatureShareType.BITGO || share.to !== signerShareType) {
      return false;
    }

    try {
      return JSON.parse(share.share).type === shareType;
    } catch {
      return false;
    }
  });
  assert(bitgoShare, `Missing BitGo ${shareType} signature share`);
  return bitgoShare;
}

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
 * @param attestation Optional withdrawal attestation; include only on the first signing request.
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
  reqId?: IRequestTracer,
  attestation?: AttestationPayload
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
  // Attestation is only attached to first-round withdrawal shares.
  return bitgo
    .post(bitgo.url(urlPath, 2))
    .send({
      signatureShare,
      signerShare,
      userPublicGpgKey,
      ...(attestation !== undefined && { attestation }),
    })
    .result();
}

/**
 * Sends a Signature Share using the sign txRequest route
 *
 * For RedPallas (ZEC/TZEC MPCv2), pass `signingType: 'redPallasRerand'` for the two
 * rerand rounds (body type `redPallasRerand`); omit it for the DSG rounds (body type
 * `redPallasMpcV2`). Rerand must run before every RedPallas DSG, between the same two
 * parties that then sign, and the DSG keyshare is the rerandomized one — never the
 * DKG keyshare.
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
 * @param reqId
 * @param signingType - Optional protocol selector for coins with more than one signing
 *   protocol ('redPallasRerand' for the RedPallas rerand rounds); only valid for
 *   MPCv2 + redpallas
 * @param attestation Optional withdrawal attestation; include only on the first signing request.
 * @returns {Promise<TxRequest>} - the latest TxRequest, with BitGo's shares echoed back
 */
export async function sendSignatureShareV2(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  signatureShares: SignatureShareRecord[],
  requestType: RequestType,
  mpcAlgorithm: MPCAlgorithm,
  signerGpgPublicKey: string,
  signerShare?: string,
  multisigTypeVersion?: 'MPCv2' | undefined,
  reqId?: IRequestTracer,
  signingType?: 'redPallasRerand',
  attestation?: AttestationPayload
): Promise<TxRequest> {
  if (signingType !== undefined && (multisigTypeVersion !== 'MPCv2' || mpcAlgorithm !== 'redpallas')) {
    throw new Error(`Invalid signingType ${signingType}: only supported for MPCv2 redpallas`);
  }
  const addendum = requestType === RequestType.tx ? '/transactions/0' : '/messages/0';
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/sign';
  let type = '';
  if (multisigTypeVersion === 'MPCv2' && mpcAlgorithm === 'ecdsa') {
    type = 'ecdsaMpcV2';
  } else if (multisigTypeVersion === 'MPCv2' && mpcAlgorithm === 'eddsa') {
    type = 'eddsaMpcV2';
  } else if (multisigTypeVersion === 'MPCv2' && mpcAlgorithm === 'redpallas') {
    type = signingType === 'redPallasRerand' ? 'redPallasRerand' : 'redPallasMpcV2';
  } else if (multisigTypeVersion === undefined && mpcAlgorithm === 'eddsa') {
    type = 'eddsaMpcV1';
  }
  const requestBody = {
    type,
    signatureShares,
    signerShare,
    signerGpgPublicKey,
    ...(attestation !== undefined && { attestation }),
  };
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await bitgo.post(bitgo.url(urlPath, 2)).send(requestBody).result();
    } catch (err) {
      if (err?.status === 429) {
        const sleepTime = 1000 * (attempts + 1);
        debug(`MPC Signing rate limit error - retrying in ${sleepTime / 1000} seconds`);
        // sleep for a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        attempts++;
      } else {
        throw err;
      }
    }
  }
  return await bitgo.post(bitgo.url(urlPath, 2)).send(requestBody).result();
}

/**
 * Sends a Transaction Request for broadcast once signing is complete
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param requestType - The type of request being submitted (either tx or message for signing)
 * @param {IRequestTracer} reqId - request tracer request id
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendTxRequest(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  requestType: RequestType,
  reqId?: IRequestTracer
): Promise<TxRequest> {
  const addendum = requestType === RequestType.tx ? '/transactions/0' : '/messages/0';
  const urlPath = '/wallet/' + walletId + '/txrequests/' + txRequestId + addendum + '/send';
  const reqTracer = reqId || new RequestTracer();
  bitgo.setRequestTracer(reqTracer);
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
