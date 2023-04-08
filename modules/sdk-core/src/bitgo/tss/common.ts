import assert from 'assert';

import { BitGoBase } from '../bitgoBase';
import { RequestType, ApiChallenges, TxRequest } from '../utils';
import { SignatureShareRecord } from '../utils/tss/baseTypes';
import { verifyEcdhSignature } from '../bip32util';
import openpgp from 'openpgp';

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
 * @param requestType - The type of request being submitted (either tx or message for signing)
 * @param signerShare
 * @param mpcAlgorithm
 * @param apiMode
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
  userPublicGpgKey?: string
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
 * Get the challenge values for enterprise and BitGo in ECDSA signing
 * Only returns the challenges if they are verified by the user's enterprise admin's ecdh key
 * @param bitgo
 * @param walletId
 * @param enterpriseId
 */
export async function getChallengesForEcdsaSigning(
  bitgo: BitGoBase,
  walletId: string,
  enterpriseId: string
): Promise<ApiChallenges> {
  const urlPath = `/wallet/${walletId}/challenges`;
  const result = await bitgo.get(bitgo.url(urlPath, 2)).query({}).result();
  const enterpriseChallenge = result.enterpriseChallenge;
  const bitGoChallenge = result.bitGoChallenge;

  const challengeVerifierUserId = result.createdBy;
  const adminSigningKeyResponse = await bitgo.getSigningKeyForUser(challengeVerifierUserId, enterpriseId);
  const pubkeyOfAdminEcdhSigningKey: string = adminSigningKeyResponse.pubkey;

  // Verify enterprise's challenge is signed by the respective admin's ecdh keychain
  const enterpriseRawChallenge = {
    ntilde: enterpriseChallenge.ntilde,
    h1: enterpriseChallenge.h1,
    h2: enterpriseChallenge.h2,
  };
  const adminSignatureOnEntChallenge: string = enterpriseChallenge.verifiers.adminSignature;
  if (
    !verifyEcdhSignature(
      JSON.stringify(enterpriseRawChallenge),
      adminSignatureOnEntChallenge,
      pubkeyOfAdminEcdhSigningKey
    )
  ) {
    throw new Error(`Admin signature for enterprise challenge is not valid. Please contact your enterprise admin.`);
  }

  // Verify that the BitGo challenge's ZK proofs have been verified by the admin
  const bitGoRawChallenge = {
    ntilde: bitGoChallenge.ntilde,
    h1: bitGoChallenge.h1,
    h2: bitGoChallenge.h2,
  };
  const adminVerificationSignatureForBitGoChallenge = bitGoChallenge.verifiers.adminSignature;
  if (
    !verifyEcdhSignature(
      JSON.stringify(bitGoRawChallenge),
      adminVerificationSignatureForBitGoChallenge,
      pubkeyOfAdminEcdhSigningKey
    )
  ) {
    throw new Error(`Admin signature for BitGo's challenge is not valid. Please contact your enterprise admin.`);
  }

  return {
    enterpriseChallenge: enterpriseRawChallenge,
    bitGoChallenge: bitGoRawChallenge,
  };
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

  const verificationResult = await walletSignature.verifyPrimaryUser([bitgoPub]);
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
