import Eddsa, {
  GShare,
  JShare,
  KeyShare,
  PShare,
  RShare,
  SignShare,
  UShare,
  YShare,
} from '@bitgo/account-lib/dist/src/mpc/tss';
import { readSignedMessage, encryptAndSignText } from './v2/internal/opengpgUtils';
import { SignatureShareRecord, SignatureShareType, TxRequest } from './v2/internal/tssUtils';
import _ = require('lodash');
import { BitGoBase } from '@bitgo/sdk-core';


// YShare that has been encrypted and signed via GPG
export type EncryptedYShare = {
  i: number
  j: number
  publicShare: string
  // signed and encrypted gpg armor
  encryptedPrivateShare: string
};

// YShare with information needed to decrypt and verify a GPG mesasge
export type DecryptableYShare = {
  yShare: EncryptedYShare
  recipientPrivateArmor: string
  senderPublicArmor: string
};

// Final TSS "Keypair"
export type CombinedKey = {
  commonKeychain: string
  signingMaterial: SigningMaterial
}

// Private portion of a TSS key, this must be handled like any other private key
export type SigningMaterial = {
  uShare: UShare;
  bitgoYShare: YShare;
  backupYShare?: YShare;
  userYShare?: YShare;
}

export enum ShareKeyPosition {
  USER = 1,
  BACKUP = 2,
  BITGO = 3,
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
  keyShare: KeyShare,
  recipientIndex: number,
  recipientGpgPublicArmor: string,
  senderGpgPrivateArmor: string
}): Promise<EncryptedYShare> {
  const { keyShare, recipientIndex, recipientGpgPublicArmor, senderGpgPrivateArmor } = params;

  const yShare = keyShare.yShares[recipientIndex];
  if (!yShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = Buffer.concat([
    Buffer.from(keyShare.uShare.y, 'hex'),
    Buffer.from(keyShare.uShare.chaincode, 'hex'),
  ]).toString('hex');

  const privateShare = Buffer.concat([
    Buffer.from(yShare.u, 'hex'),
    Buffer.from(yShare.chaincode, 'hex'),
  ]).toString('hex');

  const encryptedPrivateShare = await encryptAndSignText(
    privateShare, recipientGpgPublicArmor, senderGpgPrivateArmor);

  return {
    i: yShare.i,
    j: yShare.j,
    publicShare,
    encryptedPrivateShare,
  };
}

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
  keyShare: KeyShare,
  encryptedYShares: DecryptableYShare[],
  commonKeychain: string,
}): Promise<CombinedKey> {
  await Eddsa.initialize();
  const MPC = new Eddsa();

  const { keyShare, encryptedYShares, commonKeychain } = params;
  const yShares: YShare[] = [];

  let bitgoYShare: YShare | undefined;
  let userYShare: YShare | undefined;
  let backupYShare: YShare | undefined;

  for (const encryptedYShare of encryptedYShares) {
    const privateShare = await readSignedMessage(encryptedYShare.yShare.encryptedPrivateShare,
      encryptedYShare.senderPublicArmor, encryptedYShare.recipientPrivateArmor);

    const yShare: YShare = {
      i: encryptedYShare.yShare.i,
      j: encryptedYShare.yShare.j,
      y: encryptedYShare.yShare.publicShare.slice(0, 64),
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
 * Creates the User Sign Share containing the User XShare and the User to Bitgo RShare
 *
 * @param {Buffer} signablePayload - the signablePayload as a buffer
 * @param {PShare} pShare - User's signing material
 * @returns {Promise<SignShare>} - User Sign Share
 */
export async function createUserSignShare( signablePayload: Buffer, pShare: PShare): Promise<SignShare> {
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
 * @returns {Promise<GShare>} - the User to Bitgo GShare
 */
export async function createUserToBitGoGShare(
  userSignShare: SignShare,
  bitgoToUserRShare: SignatureShareRecord,
  backupToUserYShare: YShare,
  bitgoToUserYShare: YShare,
  signablePayload: Buffer
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

  const RShare: RShare = {
    i: ShareKeyPosition.USER,
    j: ShareKeyPosition.BITGO,
    u: bitgoToUserYShare.u,
    r: bitgoToUserRShare.share.substring(0, 64),
    R: bitgoToUserRShare.share.substring(64, 128),
  };

  const MPC = await Eddsa.initialize();
  return MPC.sign(signablePayload, userSignShare.xShare, [RShare], [backupToUserYShare]);
}


/**
 * Sends the User to Bitgo RShare to Bitgo
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @param {SignShare} userSignShare - the user Sign Share
 * @param {String} encryptedSignerShare - signer share encrypted to bitgo key
 * @returns {Promise<void>}
 */
export async function offerUserToBitgoRShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  userSignShare: SignShare,
  encryptedSignerShare: string
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
  };

  await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare, encryptedSignerShare);
}

/**
 * Gets the Bitgo to User RShare from Bitgo
 *
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id
 * @param {String} txRequestId - the txRequest Id
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function getBitgoToUserRShare(bitgo: BitGoBase, walletId: string, txRequestId: string): Promise<SignatureShareRecord> {
  const txRequest = await getTxRequest(bitgo, walletId, txRequestId);
  const signatureShares = txRequest.signatureShares;
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
 * @returns {Promise<void>}
 */
export async function sendUserToBitgoGShare(bitgo: BitGoBase, walletId: string, txRequestId: string, userToBitgoGShare: GShare): Promise<void> {
  if (userToBitgoGShare.i !== ShareKeyPosition.USER) {
    throw new Error('Invalid GShare, doesnt belong to the User');
  }
  const signatureShare: SignatureShareRecord = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: userToBitgoGShare.R + userToBitgoGShare.gamma,
  };

  await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
}

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
  signerShare?: string
): Promise<SignatureShareRecord> {
  return bitgo
    .post(bitgo.url('/wallet/' + walletId + '/txrequests/' + txRequestId + '/signatureshares', 2))
    .send({
      signatureShare,
      signerShare,
    })
    .result();
}
