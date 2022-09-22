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
  ReceivedShareType,
  BShare,
  Signature,
} from './types';
import {
  encryptAndSignText,
  readSignedMessage,
  SignatureShareRecord,
  SignatureShareType,
  RequestType,
} from './../../utils';
import { ShareKeyPosition } from '../types';
import { BitGoBase } from '../../bitgoBase';
import { KShare, MUShare, SShare } from '../../../account-lib/mpc/tss/ecdsa/types';
import { getTxRequest, sendSignatureShare } from '../common';
import createKeccakHash from 'keccak';
import assert from 'assert';

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
  return MPC.sign(message, oShare, dShare, createKeccakHash('keccak256'));
}

export type MuDShare = { muShare: MUShare; dShare: DShare; i: ShareKeyPosition };

/**
 * Sends Share To Bitgo
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param requestType - the type of request being submitted (either tx or message for signing)
 * @param shareType
 * @param share
 * @param signerShare
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendShareToBitgo(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  requestType: RequestType,
  shareType: SendShareType,
  share: SShare | MuDShare | KShare,
  signerShare?: string
): Promise<SendShareToBitgoRT> {
  if (shareType !== SendShareType.SShare && share.i !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid Share, is not from User to Bitgo');
  }
  let signatureShare: SignatureShareRecord;
  let responseFromBitgo: SendShareToBitgoRT;

  switch (shareType) {
    case SendShareType.KShare:
      assert(signerShare, `signer share must be present`);
      const kShare = share as KShare;
      signatureShare = convertKShare(kShare);
      await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare, requestType, signerShare, 'ecdsa');
      responseFromBitgo = await getBitgoToUserLatestShare(bitgo, walletId, txRequestId, ReceivedShareType.AShare);
      break;
    case SendShareType.MUShare:
      const shareToSend = share as MuDShare;
      const muShareRecord = convertMuShare(shareToSend.muShare);
      const dShareRecord = convertDShare(shareToSend.dShare);
      signatureShare = {
        to: SignatureShareType.BITGO,
        from: getParticipantFromIndex(shareToSend.dShare.i),
        share: `${muShareRecord.share}${secondaryDelimeter}${dShareRecord.share}`,
      };
      await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare, requestType, signerShare, 'ecdsa');
      responseFromBitgo = await getBitgoToUserLatestShare(bitgo, walletId, txRequestId, ReceivedShareType.DShare);
      break;
    case SendShareType.SShare:
      const sShare = share as SShare;
      signatureShare = convertSignatureShare(sShare, share.i);
      await sendSignatureShare(bitgo, walletId, txRequestId, signatureShare, requestType, signerShare, 'ecdsa');
      responseFromBitgo = sShare;
      break;
    default:
      throw new Error('Invalid Share given to send');
  }

  return responseFromBitgo;
}

/**
 * Gets the latest user's share from bitgo needed to continue signing flow
 * @param {BitGoBase} bitgo - the bitgo instance
 * @param {String} walletId - the wallet id  *
 * @param {String} txRequestId - the txRequest Id
 * @param {ReceivedShareType} shareType - the excpected share type
 * @returns {Promise<SendShareToBitgoRT>} - share from bitgo to user
 */
export async function getBitgoToUserLatestShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  shareType: ReceivedShareType
): Promise<SendShareToBitgoRT> {
  let responseFromBitgo: SendShareToBitgoRT;
  const txRequest = await getTxRequest(bitgo, walletId, txRequestId);
  const userShares = txRequest.transactions[0].signatureShares;
  if (!userShares || !userShares.length) {
    throw new Error('user share is not present');
  }

  const shareRecord = userShares[userShares.length - 1];
  switch (shareType) {
    case ReceivedShareType.AShare:
      responseFromBitgo = parseAShare(shareRecord);
      break;
    case ReceivedShareType.DShare:
      responseFromBitgo = parseDShare(shareRecord);
      break;
    case ReceivedShareType.Signature:
      responseFromBitgo = parseSignatureShare(shareRecord);
      break;
    default:
      throw new Error('Invalid share received');
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

export const delimeter = ':';
export const secondaryDelimeter = '-';

function validateSharesLength(shares: string[], expectedLength: number, shareName: string) {
  if (shares.length < expectedLength) {
    throw new Error(`Invalid ${shareName} share`);
  }
}

/**
 * parses K share from signature share record
 * @param share - signature share record
 * @returns K Share
 */
export function parseKShare(share: SignatureShareRecord): KShare {
  const shares = share.share.split(delimeter);

  validateSharesLength(shares, 2, 'K');

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    k: shares[0],
    n: shares[1],
  };
}

/**
 * convert K share to signature share record
 * @param share - K share
 * @returns signature share record
 */
export function convertKShare(share: KShare): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.i),
    from: getParticipantFromIndex(share.j),
    share: `${share.k}${delimeter}${share.n}`,
  };
}

/**
 * parses A share from signature share record
 * @param share - signature share record
 * @returns A Share
 */
export function parseAShare(share: SignatureShareRecord): AShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 4, 'A');

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    k: shares[0],
    alpha: shares[1],
    mu: shares[2],
    n: shares[3],
  };
}

/**
 * convert A share to signature share record
 * @param share - A share
 * @returns signature share record
 */
export function convertAShare(share: AShare): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.i),
    from: getParticipantFromIndex(share.j),
    share: `${share.k}${delimeter}${share.alpha}${delimeter}${share.mu}${delimeter}${share.n}`,
  };
}

/**
 * parses Mu share from signature share record
 * @param share - signature share record
 * @returns Mu Share
 */
export function parseMuShare(share: SignatureShareRecord): MUShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 2, 'Mu');

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    alpha: shares[0],
    mu: shares[1],
  };
}

/**
 * convert Mu share to signature share record
 * @param share - Mu share
 * @returns signature share record
 */
export function convertMuShare(share: MUShare): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.i),
    from: getParticipantFromIndex(share.j),
    share: `${share.alpha}${delimeter}${share.mu}`,
  };
}

/**
 * parses D share from signature share record
 * @param share - signature share record
 * @returns D Share
 */
export function parseDShare(share: SignatureShareRecord): DShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 2, 'D');

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    delta: shares[0],
    Gamma: shares[1],
  };
}

/**
 * convert D share to signature share record
 * @param share - D share
 * @returns signature share record
 */
export function convertDShare(share: DShare): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.i),
    from: getParticipantFromIndex(share.j),
    share: `${share.delta}${delimeter}${share.Gamma}`,
  };
}

/**
 * parses S and D share from signature share record
 * @param share - signature share record
 * @returns Object containing S and D Share
 */
export function parseSDShare(share: SignatureShareRecord): { sShare: SignatureShare; dShare: DShare } {
  const shares = share.share.split(secondaryDelimeter);
  validateSharesLength(shares, 2, 'SD');

  return {
    sShare: parseSignatureShare({ to: share.to, from: share.from, share: shares[0] }),
    dShare: parseDShare({ to: share.to, from: share.from, share: shares[1] }),
  };
}

/**
 * convert S and D share to signature share record
 * @param share - S and D share in a object
 * @returns signature share record
 */
export function convertSDShare(share: { sShare: SShare; dShare: DShare }): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.dShare.i),
    from: getParticipantFromIndex(share.dShare.j),
    share: `${share.sShare.R}${delimeter}${share.sShare.s}${delimeter}${share.sShare.y}${secondaryDelimeter}${share.dShare.delta}${delimeter}${share.dShare.Gamma}`,
  };
}

/**
 * parses signature share from signature share record
 * @param share - signature share record
 * @returns Signature Share
 */
export function parseSignatureShare(share: SignatureShareRecord): SignatureShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 3, 'Signature');

  return {
    i: getParticipantIndex(share.to),
    R: shares[0],
    s: shares[1],
    y: shares[2],
  };
}

/**
 * convets combined signature to signature share record
 * @param signature - combined signature share
 * @param userIndex - user index, either 1 (user) or 2 (backup)
 * @returns signature share record
 */
export function convertCombinedSignature(signature: Signature, userIndex: number): SignatureShareRecord {
  return {
    to: SignatureShareType.BITGO,
    from: getParticipantFromIndex(userIndex),
    share: `${signature.recid}${delimeter}${signature.r}${delimeter}${signature.s}${delimeter}${signature.y}`,
  };
}

export function parseCombinedSignature(share: SignatureShareRecord): Signature {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 3, 'Signature');

  return {
    recid: Number(shares[0]),
    r: shares[1],
    s: shares[2],
    y: shares[3],
  };
}

/**
 * convert signature share to signature share record
 * @param share - Signature share
 * @returns signature share record
 */
export function convertSignatureShare(share: SignatureShare, senderIndex: number): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(share.i),
    from: getParticipantFromIndex(senderIndex),
    share: `${share.R}${delimeter}${share.s}${delimeter}${share.y}`,
  };
}

/**
 * converts B share to signature share record
 * @param share - B share
 * @returns signature share record
 */
export function convertBShare(share: BShare): SignatureShareRecord {
  return {
    to: SignatureShareType.BITGO,
    from: getParticipantFromIndex(share.i),
    share: `${share.beta}${delimeter}${share.gamma}${delimeter}${share.k}${delimeter}${share.nu}${delimeter}${share.w}${delimeter}${share.y}${delimeter}${share.l}${delimeter}${share.m}${delimeter}${share.n}`,
  };
}

/**
 * parses B share from signature share record
 * @param share B share record
 * @returns B Share
 */
export function parseBShare(share: SignatureShareRecord): BShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 9, 'B');

  return {
    i: getParticipantIndex(share.to),
    beta: shares[0],
    gamma: shares[1],
    k: shares[2],
    nu: shares[3],
    w: shares[4],
    y: shares[5],
    l: shares[6],
    m: shares[7],
    n: shares[8],
  };
}

/**
 * converts O share to signature share record
 * @param share O share
 * @returns signature share record
 */
export function convertOShare(share: OShare): SignatureShareRecord {
  return {
    to: SignatureShareType.BITGO,
    from: getParticipantFromIndex(share.i),
    share: `${share.Gamma}${delimeter}${share.delta}${delimeter}${share.k}${delimeter}${share.omicron}${delimeter}${share.y}`,
  };
}

/**
 * parses O share from signature share record
 * @param share O share record
 * @returns O Share
 */
export function parseOShare(share: SignatureShareRecord): OShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 5, 'O');

  return {
    i: getParticipantIndex(share.to),
    Gamma: shares[0],
    delta: shares[1],
    k: shares[2],
    omicron: shares[3],
    y: shares[4],
  };
}

/**
 * gets participant index
 * @param participant - participants (user, backup, or bitgo)
 * @returns index (1, 2, 0r 3)
 */
export function getParticipantIndex(participant: 'user' | 'backup' | 'bitgo'): number {
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
 * gets participant name by index
 * @param index participant index
 * @returns participant name
 */
export function getParticipantFromIndex(index: number): SignatureShareType {
  switch (index) {
    case 1:
      return SignatureShareType.USER;
    case 2:
      return SignatureShareType.BACKUP;
    case 3:
      return SignatureShareType.BITGO;
    default:
      throw new Error(`Unknown participant index ${index}`);
  }
}
