import assert from 'assert';
import openpgp from 'openpgp';
import sodium from 'libsodium-wrappers-sumo';
import Eddsa, { GShare, JShare, KeyShare, PShare, RShare, SignShare, YShare } from './../../../account-lib/mpc/tss';
import { BitGoBase } from '../../bitgoBase';
import {
  DecryptableYShare,
  CombinedKey,
  SigningMaterial,
  EncryptedYShare,
  UserSigningMaterial,
  BackupSigningMaterial,
} from './types';
import { ShareKeyPosition } from '../types';
import {
  encryptAndSignText,
  readSignedMessage,
  SignatureShareRecord,
  SignatureShareType,
  RequestType,
  CommitmentShareRecord,
  CommitmentType,
} from '../../utils';
import { BaseTransaction } from '../../../account-lib';
import { Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import _ = require('lodash');
import { commonVerifyWalletSignature, getTxRequest, sendSignatureShare } from '../common';
import { IRequestTracer } from '../../../api';

export { getTxRequest, sendSignatureShare };

/**
 * Combines YShares to combine the final TSS key
 * This can only be used to create the User or Backup key since it requires the common keychain from BitGo first
 *
 * @param params.keyShare - TSS key share
 * @param params.encryptedYShares - encrypted YShares with information on how to decrypt
 * @param params.commonKeychain - expected common keychain of the combined key
 * @returns {CombinedKey} combined TSS key
 */
export async function createCombinedKey(params: {
  keyShare: KeyShare;
  encryptedYShares: DecryptableYShare[];
  commonKeychain: string;
}): Promise<CombinedKey> {
  await Eddsa.initialize();
  const MPC = new Eddsa();

  const { keyShare, encryptedYShares, commonKeychain } = params;
  const yShares: YShare[] = [];

  let bitgoYShare: YShare | undefined;
  let userYShare: YShare | undefined;
  let backupYShare: YShare | undefined;

  for (const encryptedYShare of encryptedYShares) {
    const privateShare = await readSignedMessage(
      encryptedYShare.yShare.encryptedPrivateShare,
      encryptedYShare.senderPublicArmor,
      encryptedYShare.recipientPrivateArmor
    );

    const yShare: YShare = {
      i: encryptedYShare.yShare.i,
      j: encryptedYShare.yShare.j,
      y: encryptedYShare.yShare.publicShare.slice(0, 64),
      v: encryptedYShare.yShare.publicShare.slice(64, 128),
      u: privateShare.slice(0, 64),
      chaincode: privateShare.slice(64),
    };

    switch (encryptedYShare.yShare.j) {
      case 1:
        userYShare = yShare;
        break;
      case 2:
        backupYShare = yShare;
        break;
      case 3:
        bitgoYShare = yShare;
        break;
      default:
        throw new Error('Invalid YShare index');
    }

    yShares.push(yShare);
  }

  const combinedKey = MPC.keyCombine(keyShare.uShare, yShares);
  if (combinedKey.pShare.y + combinedKey.pShare.chaincode !== commonKeychain) {
    throw new Error('Common keychains do not match');
  }
  if (!bitgoYShare) {
    throw new Error('Missing BitGo Y Share');
  }

  const signingMaterial: SigningMaterial = {
    uShare: keyShare.uShare,
    bitgoYShare,
    backupYShare,
    userYShare,
  };

  return {
    signingMaterial,
    commonKeychain,
  };
}

/**
 * Creates the User Sign Share containing the User XShare , the User to Bitgo RShare and User to Bitgo commitment
 *
 * @param {Buffer} signablePayload - the signablePayload as a buffer
 * @param {PShare} pShare - User's signing material
 * @returns {Promise<SignShare>} - User Sign Share
 */
export async function createUserSignShare(signablePayload: Buffer, pShare: PShare): Promise<SignShare> {
  const MPC = await Eddsa.initialize();

  if (pShare.i !== ShareKeyPosition.USER) {
    throw new Error('Invalid PShare, PShare doesnt belong to the User');
  }
  const jShare: JShare = { i: ShareKeyPosition.BITGO, j: ShareKeyPosition.USER };
  return MPC.signShare(signablePayload, pShare, [jShare]);
}

/**
 * Creates the User to Bitgo GShare
 *
 * @param {SignShare} userSignShare - the User Sign Share
 * @param {SignatureShareRecord} bitgoToUserRShare - the Bitgo to User RShare
 * @param {YShare} backupToUserYShare - the backup key Y share received during wallet creation
 * @param {Buffer} signablePayload - the signable payload from a tx
 * @param {CommitmentShareRecord} [bitgoToUserCommitment] - the Bitgo to User Commitment
 * @returns {Promise<GShare>} - the User to Bitgo GShare
 */
export async function createUserToBitGoGShare(
  userSignShare: SignShare,
  bitgoToUserRShare: SignatureShareRecord,
  backupToUserYShare: YShare,
  bitgoToUserYShare: YShare,
  signablePayload: Buffer,
  bitgoToUserCommitment?: CommitmentShareRecord
): Promise<GShare> {
  if (userSignShare.xShare.i !== ShareKeyPosition.USER) {
    throw new Error('Invalid XShare, doesnt belong to the User');
  }
  if (bitgoToUserRShare.from !== SignatureShareType.BITGO || bitgoToUserRShare.to !== SignatureShareType.USER) {
    throw new Error('Invalid RShare, is not from Bitgo to User');
  }
  if (backupToUserYShare.i !== ShareKeyPosition.USER) {
    throw new Error('Invalid YShare, doesnt belong to the User');
  }
  if (backupToUserYShare.j !== ShareKeyPosition.BACKUP) {
    throw new Error('Invalid YShare, is not backup key');
  }

  let v, r, R;
  if (bitgoToUserRShare.share.length > 128) {
    v = bitgoToUserRShare.share.substring(0, 64);
    r = bitgoToUserRShare.share.substring(64, 128);
    R = bitgoToUserRShare.share.substring(128, 192);
  } else {
    r = bitgoToUserRShare.share.substring(0, 64);
    R = bitgoToUserRShare.share.substring(64, 128);
  }

  const updatedBitgoToUserRShare: RShare = {
    i: ShareKeyPosition.USER,
    j: ShareKeyPosition.BITGO,
    u: bitgoToUserYShare.u,
    v,
    r,
    R,
  };

  const MPC = await Eddsa.initialize();

  if (bitgoToUserCommitment) {
    if (
      bitgoToUserCommitment.from !== SignatureShareType.BITGO ||
      bitgoToUserCommitment.to !== SignatureShareType.USER
    ) {
      throw new Error('Invalid Commitment, is not from Bitgo to User');
    }
    if (bitgoToUserCommitment.type !== CommitmentType.COMMITMENT) {
      throw new Error('Invalid Commitment type, got: ' + bitgoToUserCommitment.type + ' expected: commitment');
    }
    updatedBitgoToUserRShare.commitment = bitgoToUserCommitment.share;
  }

  return MPC.sign(signablePayload, userSignShare.xShare, [updatedBitgoToUserRShare], [backupToUserYShare]);
}

/**
 * Sends the User to Bitgo RShare to Bitgo
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @param {SignShare} userSignShare - the user Sign Share
 * @param {String} encryptedSignerShare - signer share encrypted to bitgo key
 * @returns {Promise<void>}
 * @param {IRequestTracer} reqId - the request tracer request id
 */
export async function offerUserToBitgoRShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  userSignShare: SignShare,
  encryptedSignerShare: string,
  apiMode: 'full' | 'lite' = 'lite',
  vssProof?: string,
  privateShareProof?: string,
  userPublicGpgKey?: string,
  publicShare?: string,
  reqId?: IRequestTracer
): Promise<void> {
  const rShare: RShare = userSignShare.rShares[ShareKeyPosition.BITGO];
  if (_.isNil(rShare)) {
    throw new Error('userToBitgo RShare not found');
  }
  if (rShare.i !== ShareKeyPosition.BITGO || rShare.j !== ShareKeyPosition.USER) {
    throw new Error('Invalid RShare, is not from User to Bitgo');
  }
  const signatureShare: SignatureShareRecord = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: rShare.r + rShare.R,
    vssProof,
    privateShareProof,
    publicShare,
  };

  // TODO (BG-57944): implement message signing for EDDSA
  await sendSignatureShare(
    bitgo,
    walletId,
    txRequestId,
    signatureShare,
    RequestType.tx,
    encryptedSignerShare,
    'eddsa',
    apiMode,
    userPublicGpgKey,
    reqId
  );
}

/**
 * Gets the Bitgo to User RShare from Bitgo
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @param {IRequestTracer} reqId - the request tracer request id
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function getBitgoToUserRShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  reqId?: IRequestTracer
): Promise<SignatureShareRecord> {
  const txRequest = await getTxRequest(bitgo, walletId, txRequestId, reqId);
  let signatureShares;
  if (txRequest.apiVersion === 'full') {
    assert(txRequest.transactions, 'transactions required as part of txRequest');
    signatureShares = txRequest.transactions[0].signatureShares;
  } else {
    signatureShares = txRequest.signatureShares;
  }
  if (_.isNil(signatureShares) || _.isEmpty(signatureShares)) {
    throw new Error(`No signatures shares found for id: ${txRequestId}`);
  }
  // at this point we expect the only share to be the RShare
  const bitgoToUserRShare = signatureShares.find(
    (sigShare) => sigShare.from === SignatureShareType.BITGO && sigShare.to === SignatureShareType.USER
  );
  if (_.isNil(bitgoToUserRShare)) {
    throw new Error(`Bitgo to User RShare not found for id: ${txRequestId}`);
  }
  return bitgoToUserRShare;
}

/**
 * Sends the User to Bitgo GShare to Bitgo
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @param {GShare} userToBitgoGShare - the User to Bitgo GShare
 * @param {IRequestTracer} reqId - the request tracer request id
 * @returns {Promise<void>}
 */
export async function sendUserToBitgoGShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  userToBitgoGShare: GShare,
  apiMode: 'full' | 'lite' = 'lite',
  reqId?: IRequestTracer
): Promise<void> {
  if (userToBitgoGShare.i !== ShareKeyPosition.USER) {
    throw new Error('Invalid GShare, doesnt belong to the User');
  }
  const signatureShare: SignatureShareRecord = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: userToBitgoGShare.R + userToBitgoGShare.gamma,
  };

  // TODO (BG-57944): implement message signing for EDDSA
  await sendSignatureShare(
    bitgo,
    walletId,
    txRequestId,
    signatureShare,
    RequestType.tx,
    undefined,
    'eddsa',
    apiMode,
    undefined,
    reqId
  );
}

/**
 * Prepares a YShare to be exchanged with other key holders.
 * Output is in a format that is usable within BitGo's ecosystem.
 *
 * @param params.keyShare - TSS key share of the party preparing exchange materials
 * @param params.recipientIndex - index of the recipient (1, 2, or 3)
 * @param params.recipientGpgPublicArmor - recipient's public gpg key in armor format
 * @param params.senderGpgPrivateArmor - sender's private gpg key in armor format
 * @returns { EncryptedYShare } encrypted Y Share
 */
export async function encryptYShare(params: {
  keyShare: KeyShare;
  recipientIndex: number;
  recipientGpgPublicArmor: string;
  senderGpgPrivateArmor: string;
}): Promise<EncryptedYShare> {
  const { keyShare, recipientIndex, recipientGpgPublicArmor, senderGpgPrivateArmor } = params;

  const yShare = keyShare.yShares[recipientIndex];
  if (!yShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = Buffer.concat([
    Buffer.from(keyShare.uShare.y, 'hex'),
    Buffer.from(yShare.v!, 'hex'),
    Buffer.from(keyShare.uShare.chaincode, 'hex'),
  ]).toString('hex');

  const privateShare = Buffer.concat([Buffer.from(yShare.u, 'hex'), Buffer.from(yShare.chaincode, 'hex')]).toString(
    'hex'
  );

  const encryptedPrivateShare = await encryptAndSignText(privateShare, recipientGpgPublicArmor, senderGpgPrivateArmor);

  return {
    i: yShare.i,
    j: yShare.j,
    publicShare,
    encryptedPrivateShare,
  };
}

/**
 *
 * Initializes Eddsa instance
 *
 * @returns {Promise<Eddsa>} the Eddsa instance
 */
export async function getInitializedMpcInstance() {
  const hdTree = await Ed25519Bip32HdTree.initialize();
  return await Eddsa.initialize(hdTree);
}

/**
 *
 * Generates a TSS signature using the user and backup key
 *
 * @param {UserSigningMaterial} userSigningMaterial decrypted user TSS key
 * @param {BackupSigningMaterial} backupSigningMaterial decrypted backup TSS key
 * @param {string} path bip32 derivation path
 * @param {BaseTransaction} transaction the transaction to sign
 * @returns {Buffer} the signature
 */
export async function getTSSSignature(
  userSigningMaterial: UserSigningMaterial,
  backupSigningMaterial: BackupSigningMaterial,
  path = 'm/0',
  transaction: BaseTransaction
): Promise<Buffer> {
  const MPC = await getInitializedMpcInstance();

  const userCombine = MPC.keyCombine(userSigningMaterial.uShare, [
    userSigningMaterial.bitgoYShare,
    userSigningMaterial.backupYShare,
  ]);
  const backupCombine = MPC.keyCombine(backupSigningMaterial.uShare, [
    backupSigningMaterial.bitgoYShare,
    backupSigningMaterial.userYShare,
  ]);

  const userSubkey = MPC.keyDerive(
    userSigningMaterial.uShare,
    [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
    path
  );

  const backupSubkey = MPC.keyCombine(backupSigningMaterial.uShare, [
    userSubkey.yShares[2],
    backupSigningMaterial.bitgoYShare,
  ]);

  const messageBuffer = transaction.signablePayload;
  const userSignShare = MPC.signShare(messageBuffer, userSubkey.pShare, [userCombine.jShares[2]]);
  const backupSignShare = MPC.signShare(messageBuffer, backupSubkey.pShare, [backupCombine.jShares[1]]);
  const userSign = MPC.sign(
    messageBuffer,
    userSignShare.xShare,
    [backupSignShare.rShares[1]],
    [userSigningMaterial.bitgoYShare]
  );
  const backupSign = MPC.sign(
    messageBuffer,
    backupSignShare.xShare,
    [userSignShare.rShares[2]],
    [backupSigningMaterial.bitgoYShare]
  );
  const signature = MPC.signCombine([userSign, backupSign]);
  const result = MPC.verify(messageBuffer, signature);
  if (!result) {
    throw new Error('Invalid signature');
  }
  const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
  return rawSignature;
}

/**
 * Verifies that a TSS wallet signature was produced with the expected key and that the signed data contains the
 * expected common keychain, the expected user and backup key ids as well as the public share that is generated from the
 * private share that was passed in.
 */
export async function verifyWalletSignature(params: {
  walletSignature: openpgp.Key;
  bitgoPub: openpgp.Key;
  commonKeychain: string;
  userKeyId: string;
  backupKeyId: string;
  decryptedShare: string;
  verifierIndex: 1 | 2; // the index of the verifier, 1 means user, 2 means backup
}): Promise<void> {
  const rawNotations = await commonVerifyWalletSignature(params);

  const { decryptedShare, verifierIndex } = params;

  const publicShare =
    Buffer.from(
      await sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(decryptedShare.slice(0, 64), 'hex'))
    ).toString('hex') + decryptedShare.slice(64);
  const publicShareRawNotationIndex = 2 + verifierIndex;

  assert(
    publicShare === Buffer.from(rawNotations[publicShareRawNotationIndex].value).toString(),
    'bitgo share mismatch'
  );
}
