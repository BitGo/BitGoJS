import { Ecdsa } from './../../../account-lib/mpc/tss';
import {
  DecryptableNShare,
  CombinedKey,
  SigningMaterial,
  EncryptedNShare,
  AShare,
  CreateUserGammaAndMuShareRT,
  CreateUserOmicronAndDeltaShareRT,
  DShare,
  GShare,
  KeyShare,
  NShare,
  OShare,
  SendShareType,
  SignatureShare,
  SignShare,
  WShare,
  XShare,
  YShare,
  SendShareToBitgoRT,
} from './types';
import { encryptAndSignText, readSignedMessage, SignatureShareRecord, SignatureShareType } from './../../utils';
import { ShareKeyPosition } from '../types';
import { BitGoBase } from '../../bitgoBase';
import { KShare, MUShare, SShare } from '../../../account-lib/mpc/tss/ecdsa/types';
import { sendSignatureShare } from '../common';

const MPC = new Ecdsa();

/**
 * Combines NShares to combine the final TSS key
 * This can only be used to create the User or Backup key since it requires the common keychain from BitGo first
 *
 * @param keyShare - TSS key share
 * @param encryptedNShares - encrypted NShares with information on how to decrypt
 * @param commonKeychain - expected common keychain of the combined key
 * @returns {CombinedKey} combined TSS key
 */
export async function createCombinedKey(
  keyShare: KeyShare,
  encryptedNShares: DecryptableNShare[],
  commonKeychain: string
): Promise<CombinedKey> {
  const nShares: NShare[] = [];

  let bitgoNShare: NShare | undefined;
  let userNShare: NShare | undefined;
  let backupNShare: NShare | undefined;

  for (const encryptedNShare of encryptedNShares) {
    const privateShare = await readSignedMessage(
      encryptedNShare.nShare.encryptedPrivateShare,
      encryptedNShare.senderPublicArmor,
      encryptedNShare.recipientPrivateArmor
    );

    const nShare: NShare = {
      i: encryptedNShare.nShare.i,
      j: encryptedNShare.nShare.j,
      y: encryptedNShare.nShare.publicShare.slice(0, 65),
      u: privateShare,
      n: encryptedNShare.nShare.publicShare.slice(129),
      chaincode: encryptedNShare.nShare.publicShare.slice(65, 129),
    };

    switch (encryptedNShare.nShare.j) {
      case 1:
        userNShare = nShare;
        break;
      case 2:
        backupNShare = nShare;
        break;
      case 3:
        bitgoNShare = nShare;
        break;
      default:
        throw new Error('Invalid NShare index');
    }

    nShares.push(nShare);
  }

  if (!bitgoNShare) {
    throw new Error('Missing BitGo N Share');
  }

  const combinedKey = MPC.keyCombine(keyShare.pShare, nShares);
  if (combinedKey.xShare.y + combinedKey.xShare.chaincode !== commonKeychain) {
    throw new Error('Common keychains do not match');
  }

  const signingMaterial: SigningMaterial = {
    pShare: keyShare.pShare,
    bitgoNShare,
    backupNShare,
    userNShare,
  };

  return {
    signingMaterial,
    commonKeychain,
  };
}

/**
 * Creates the SignShare with User XShare and YShare Corresponding to BitGo
 * @param {XShare} xShare User secret xShare
 * @param {YShare} yShare YShare from Bitgo
 * @returns {Promise<SignShare>}
 */
export async function createUserSignShare(xShare: XShare, yShare: YShare): Promise<SignShare> {
  if (xShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid XShare, XShare doesn't belong to the User`);
  }

  if (yShare.i !== ShareKeyPosition.USER || yShare.j !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid YShare provided for sign');
  }
  return MPC.signShare(xShare, yShare);
}

/**
 * Creates the Gamma Share and MuShare with User WShare and AShare From BitGo
 * @param {WShare} wShare User WShare
 * @param {AShare} aShare AShare from Bitgo
 * @returns {Promise<CreateUserGammaAndMuShareRT>}
 */
export async function createUserGammaAndMuShare(wShare: WShare, aShare: AShare): Promise<CreateUserGammaAndMuShareRT> {
  if (wShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid WShare, doesn't belong to the User`);
  }
  if (aShare.i !== ShareKeyPosition.USER || aShare.j !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid AShare, is not from Bitgo to User');
  }

  return MPC.signConvert({ wShare, aShare });
}

/**
 * Creates the Omicron Share and Delta share with user GShare
 * @param {GShare} gShare User GShare
 * @returns {Promise<CreateUserOmicronAndDeltaShareRT>}
 */
export async function createUserOmicronAndDeltaShare(gShare: GShare): Promise<CreateUserOmicronAndDeltaShareRT> {
  if (gShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid GShare, doesn't belong to the User`);
  }
  return MPC.signCombine({
    gShare: gShare,
    signIndex: {
      i: ShareKeyPosition.BITGO,
      j: gShare.i,
    },
  });
}

/**
 * Creates the Signature Share with User OShare and DShare From BitGo
 * @param {OShare} oShare User OShare
 * @param {DShare} dShare DShare from bitgo
 * @param {Buffer} message message to perform sign
 * @returns {Promise<createUserSignShareRT>}
 */
export async function createUserSignatureShare(
  oShare: OShare,
  dShare: DShare,
  message: Buffer
): Promise<SignatureShare> {
  if (oShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid OShare, doesn't belong to the User`);
  }

  if (dShare.i !== ShareKeyPosition.USER || dShare.j !== ShareKeyPosition.BITGO) {
    throw new Error(`Invalid DShare, doesn't seem to be from BitGo`);
  }
  return MPC.sign(message, oShare, dShare);
}

/**
 * Sends Share To Bitgo
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param {SignatureShareRecord} signatureShare - a Signature Share
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendShareToBitgo(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  shareType: SendShareType,
  share: SShare | MUShare | KShare,
  dShare?: DShare
): Promise<SendShareToBitgoRT> {
  if (shareType !== SendShareType.SShare && share.i !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid Share, is not from User to Bitgo');
  }
  const signatureShare: SignatureShareRecord = {
    from: SignatureShareType.USER,
    to: SignatureShareType.BITGO,
    share: '',
  };

  let responseFromBitgo: SendShareToBitgoRT;

  switch (shareType) {
    case SendShareType.KShare:
      const kShare = share as KShare;
      signatureShare.share = kShare.k + kShare.n;
      const AShareRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
      if (AShareRecord.share.length < 4608) {
        throw new Error('Invalid AShare from Bitgo');
      }
      responseFromBitgo = {
        i: kShare.j,
        j: 3,
        k: AShareRecord.share.substring(0, 1536),
        alpha: AShareRecord.share.substring(1536, 3072),
        mu: AShareRecord.share.substring(3072, 4608),
        n: AShareRecord.share.substring(4608),
      };
      break;
    case SendShareType.MUShare:
      const muShare = share as MUShare;
      signatureShare.share = muShare.alpha + muShare.mu;
      const dShareRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
      if (dShareRecord.share.length !== 130) {
        throw new Error('Invalid DShare from Bitgo');
      }
      responseFromBitgo = {
        i: muShare.j,
        j: 3,
        delta: dShareRecord.share.substring(0, 64),
        Gamma: dShareRecord.share.substring(64, 130),
      };
      break;
    case SendShareType.SShare:
      if (!dShare) {
        throw new Error('DShare not provided');
      }
      if (dShare.i !== ShareKeyPosition.BITGO || dShare.j !== ShareKeyPosition.USER) {
        throw new Error('Invalid DShare provided');
      }
      const sShare = share as SShare;
      signatureShare.share = sShare.r + sShare.s + sShare.y + dShare.delta + dShare.Gamma;
      const signatureRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);

      if (signatureRecord.share.length !== 194) {
        throw new Error('Invalid Signature from Bitgo');
      }
      responseFromBitgo = {
        r: signatureRecord.share.substring(0, 64),
        s: signatureRecord.share.substring(64, 128),
        y: signatureRecord.share.substring(128, 194),
      };
      break;
    default:
      throw 'Invalid Share given to send';
  }

  return responseFromBitgo;
}

/**
 * Prepares a NShare to be exchanged with other key holders.
 * Output is in a format that is usable within BitGo's ecosystem.
 *
 * @param keyShare - TSS key share of the party preparing exchange materials
 * @param recipientIndex - index of the recipient (1, 2, or 3)
 * @param recipientGpgPublicArmor - recipient's public gpg key in armor format
 * @param senderGpgPrivateArmor - sender's private gpg key in armor format
 * @returns { EncryptedNShare } encrypted Y Share
 */
export async function encryptNShare(
  keyShare: KeyShare,
  recipientIndex: number,
  recipientGpgPublicArmor: string,
  senderGpgPrivateArmor: string
): Promise<EncryptedNShare> {
  const nShare = keyShare.nShares[recipientIndex];
  if (!nShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = keyShare.pShare.y + nShare.chaincode + nShare.n;
  const privateShare = nShare.u;

  const encryptedPrivateShare = await encryptAndSignText(privateShare, recipientGpgPublicArmor, senderGpgPrivateArmor);

  return {
    i: nShare.i,
    j: nShare.j,
    publicShare,
    encryptedPrivateShare,
  };
}
