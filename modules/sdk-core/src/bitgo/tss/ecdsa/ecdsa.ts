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
    const nShare = await decryptNShare(encryptedNShare);

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
  let signatureShare: SignatureShareRecord;
  let responseFromBitgo: SendShareToBitgoRT;

  switch (shareType) {
    case SendShareType.KShare:
      const kShare = share as KShare;
      signatureShare = convertKShare(kShare);
      const AShareRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
      responseFromBitgo = parseAShare(AShareRecord);
      break;
    case SendShareType.MUShare:
      const muShare = share as MUShare;
      signatureShare = convertMuShare(muShare);
      const dShareRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
      responseFromBitgo = parseDShare(dShareRecord);
      break;
    case SendShareType.SShare:
      if (!dShare) {
        throw new Error('DShare not provided');
      }
      if (dShare.i !== ShareKeyPosition.BITGO || dShare.j !== ShareKeyPosition.USER) {
        throw new Error('Invalid DShare provided');
      }
      const sShare = share as SShare;
      signatureShare = convertSDShare({ sShare, dShare });
      const signatureRecord = await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare);
      responseFromBitgo = parseSignatureShare(signatureRecord);
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
 * @returns encrypted N Share
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

/**
 * Decrypts encrypted n share
 * @param encryptedNShare - decryptable n share with recipient private gpg key armor and sender public gpg key
 * @returns N share
 */
export async function decryptNShare(encryptedNShare: DecryptableNShare): Promise<NShare> {
  const privateShare = await readSignedMessage(
    encryptedNShare.nShare.encryptedPrivateShare,
    encryptedNShare.senderPublicArmor,
    encryptedNShare.recipientPrivateArmor
  );

  const nShare: NShare = {
    i: encryptedNShare.nShare.i,
    j: encryptedNShare.nShare.j,
    y: encryptedNShare.nShare.publicShare.slice(0, 66),
    u: privateShare,
    n: encryptedNShare.nShare.publicShare.slice(130),
    chaincode: encryptedNShare.nShare.publicShare.slice(66, 130),
  };

  return nShare;
}

/**
 * Gets public key from common key chain
 * @param commonKeyChain - common key chain of ecdsa tss
 * @returns public key
 */
export function getPublicKey(commonKeyChain: string): string {
  return commonKeyChain.slice(0, 66);
}

/**
 * validates signature share record
 * @param share - signature share record to validate
 * @param shareLength - share record expected length
 * @param isExactLength - if this false then share length can be greater.
 */
function validateShare(share: SignatureShareRecord, shareLength: number, isExactLength = true): void {
  const error = (message: string) => new Error(message);

  if (share.share.length < shareLength) {
    throw error(`Excepted share length to be greater than or equal ${shareLength} but got ${share.share.length}.`);
  }

  if (isExactLength && share.share.length !== shareLength) {
    throw error(`Excepted share length to be ${shareLength} but got ${share.share.length}.`);
  }

  if (share.from === share.to) {
    throw error(`Key share sender and receiver cannot be the same.`);
  }
}

/**
 * parses K share from signature share record
 * @param share - signature share record
 * @returns K Share
 */
export function parseKShare(share: SignatureShareRecord): KShare {
  validateShare(share, 1536, false);

  return {
    i: getParticapantIndex(share.to),
    j: getParticapantIndex(share.from),
    k: share.share.substring(0, 1536),
    n: share.share.substring(1536),
  };
}

/**
 * convert K share to signature share record
 * @param share - K share
 * @returns signature share record
 */
export function convertKShare(share: KShare): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.i),
    from: getParticapantFromIndex(share.j),
    share: share.k + share.n,
  };
}

/**
 * parses A share from signature share record
 * @param share - signature share record
 * @returns A Share
 */
export function parseAShare(share: SignatureShareRecord): AShare {
  validateShare(share, 4608, false);
  return {
    i: getParticapantIndex(share.to),
    j: getParticapantIndex(share.from),
    k: share.share.slice(0, 1536),
    alpha: share.share.slice(1536, 3072),
    mu: share.share.slice(3072, 4608),
    n: share.share.slice(4608),
  };
}

/**
 * convert A share to signature share record
 * @param share - A share
 * @returns signature share record
 */
export function convertAShare(share: AShare): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.i),
    from: getParticapantFromIndex(share.j),
    share: share.k! + share.alpha! + share.mu! + share.n!,
  };
}

/**
 * parses Mu share from signature share record
 * @param share - signature share record
 * @returns Mu Share
 */
export function parseMuShare(share: SignatureShareRecord): MUShare {
  validateShare(share, 3072);
  return {
    i: getParticapantIndex(share.to),
    j: getParticapantIndex(share.from),
    alpha: share.share.slice(0, 1536),
    mu: share.share.slice(1536, 3072),
  };
}

/**
 * convert Mu share to signature share record
 * @param share - Mu share
 * @returns signature share record
 */
export function convertMuShare(share: MUShare): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.i),
    from: getParticapantFromIndex(share.j),
    share: share.alpha + share.mu,
  };
}

/**
 * parses D share from signature share record
 * @param share - signature share record
 * @returns D Share
 */
export function parseDShare(share: SignatureShareRecord): DShare {
  validateShare(share, 130);
  return {
    i: getParticapantIndex(share.to),
    j: getParticapantIndex(share.from),
    delta: share.share.slice(0, 64),
    Gamma: share.share.slice(64, 130),
  };
}

/**
 * convert D share to signature share record
 * @param share - D share
 * @returns signature share record
 */
export function convertDShare(share: DShare): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.i),
    from: getParticapantFromIndex(share.j),
    share: share.delta + share.Gamma,
  };
}

/**
 * parses S and D share from signature share record
 * @param share - signature share record
 * @returns Object containing S and D Share
 */
export function parseSDShare(share: SignatureShareRecord): { sShare: SignatureShare; dShare: DShare } {
  validateShare(share, 324);
  return {
    sShare: parseSignatureShare({ to: share.to, from: share.from, share: share.share.slice(0, 194) }),
    dShare: parseDShare({ to: share.to, from: share.from, share: share.share.slice(194) }),
  };
}

/**
 * convert S and D share to signature share record
 * @param share - S and D share in a object
 * @returns signature share record
 */
export function convertSDShare(share: { sShare: SignatureShare; dShare: DShare }): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.dShare.i),
    from: getParticapantFromIndex(share.dShare.j),
    share: share.sShare.r + share.sShare.s + share.sShare.y + share.dShare.delta + share.dShare.Gamma,
  };
}

/**
 * parses signature share from signature share record
 * @param share - signature share record
 * @returns Signature Share
 */
export function parseSignatureShare(share: SignatureShareRecord): SignatureShare {
  validateShare(share, 194);
  return {
    i: getParticapantIndex(share.to),
    r: share.share.substring(0, 64),
    s: share.share.substring(64, 128),
    y: share.share.substring(128, 194),
  };
}

/**
 * convert signature share to signature share record
 * @param share - K share
 * @returns signature share record
 */
export function convertSignatureShare(share: SignatureShare, senderIndex: number): SignatureShareRecord {
  return {
    to: getParticapantFromIndex(share.i),
    from: getParticapantFromIndex(senderIndex),
    share: share.r + share.s + share.y,
  };
}

/**
 * gets particapant index
 * @param participant - participants (user, backup, or bitgo)
 * @returns index (1, 2, 0r 3)
 */
export function getParticapantIndex(participant: 'user' | 'backup' | 'bitgo'): number {
  switch (participant) {
    case 'user':
      return 1;
    case 'backup':
      return 2;
    case 'bitgo':
      return 3;
    default:
      throw Error('Unkown participant');
  }
}

/**
 * gets particapant name by index
 * @param index particapant index
 * @returns particapant name
 */
export function getParticapantFromIndex(index: number): SignatureShareType {
  switch (index) {
    case 1:
      return SignatureShareType.USER;
    case 2:
      return SignatureShareType.BACKUP;
    case 3:
      return SignatureShareType.BITGO;
    default:
      throw new Error(`Unknown particapant index ${index}`);
  }
}
