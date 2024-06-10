import { Ecdsa } from './../../../account-lib/mpc/tss';
import {
  AShare,
  BShare,
  CombinedKey,
  CreateUserOmicronAndDeltaShareRT,
  DecryptableNShare,
  DShare,
  EncryptedNShare,
  GShare,
  KeyShare,
  NShare,
  OShare,
  ReceivedShareType,
  SendShareToBitgoRT,
  SendShareType,
  Signature,
  SignatureShare,
  SigningMaterial,
  SignShare,
  WShare,
  XShareWithChallenges,
  YShareWithChallenges,
} from './types';
import { createShareProof, RequestType, SignatureShareRecord, SignatureShareType } from '../../utils';
import { ShareKeyPosition } from '../types';
import { BitGoBase } from '../../bitgoBase';
import {
  KShare,
  MUShare,
  RangeProofShare,
  RangeProofWithCheckShare,
  SignConvertStep2Response,
  SShare,
} from '../../../account-lib/mpc/tss/ecdsa/types';
import { commonVerifyWalletSignature, getTxRequest, sendSignatureShare } from '../common';
import createKeccakHash from 'keccak';
import assert from 'assert';
import { bip32, ecc } from '@bitgo/utxo-lib';
import * as pgp from 'openpgp';
import bs58 from 'bs58';
import { ApiKeyShare } from '../../keychain';
import { Hash } from 'crypto';
import { EcdsaPaillierProof } from '@bitgo/sdk-lib-mpc';
import { IRequestTracer } from '../../../api';

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
    const nShare = await decryptNShare(encryptedNShare, encryptedNShare.isbs58Encoded);

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
export async function createUserSignShare(
  xShare: XShareWithChallenges,
  yShare: YShareWithChallenges
): Promise<SignShare> {
  if (xShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid XShare, XShare doesn't belong to the User`);
  }

  if (yShare.i !== ShareKeyPosition.USER || yShare.j !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid YShare provided for sign');
  }
  return await MPC.signShare(xShare, yShare);
}

/**
 * Creates the Gamma Share and MuShare with User WShare and AShare From BitGo
 * @param {WShare} wShare User WShare
 * @param {AShare} aShare AShare from Bitgo
 * @returns {Promise<SignConvertStep2Response>}
 */
export async function createUserGammaAndMuShare(wShare: WShare, aShare: AShare): Promise<SignConvertStep2Response> {
  if (wShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid WShare, doesn't belong to the User`);
  }
  if (aShare.i !== ShareKeyPosition.USER || aShare.j !== ShareKeyPosition.BITGO) {
    throw new Error('Invalid AShare, is not from Bitgo to User');
  }
  return MPC.signConvertStep2({ wShare, aShare });
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
  message: Buffer,
  hash: Hash = createKeccakHash('keccak256')
): Promise<SignatureShare> {
  if (oShare.i !== ShareKeyPosition.USER) {
    throw new Error(`Invalid OShare, doesn't belong to the User`);
  }

  if (dShare.i !== ShareKeyPosition.USER || dShare.j !== ShareKeyPosition.BITGO) {
    throw new Error(`Invalid DShare, doesn't seem to be from BitGo`);
  }
  return MPC.sign(message, oShare, dShare, hash);
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
 * @param vssProof - the v value of the share
 * @param privateShareProof - the uSig of the share
 * @param publicShare - the y value of the share
 * @param userPublicGpgKey - the public key of the gpg key used for creating the privateShareProof
 * @param reqId - request tracer request id
 * @returns {Promise<SignatureShareRecord>} - a Signature Share
 */
export async function sendShareToBitgo(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  requestType: RequestType,
  shareType: SendShareType,
  share: SShare | MuDShare | KShare,
  signerShare?: string,
  vssProof?: string,
  privateShareProof?: string,
  publicShare?: string,
  userPublicGpgKey?: string,
  reqId?: IRequestTracer
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
      signatureShare.vssProof = vssProof;
      signatureShare.publicShare = publicShare;
      signatureShare.privateShareProof = privateShareProof;
      await sendSignatureShare(
        bitgo,
        walletId,
        txRequestId,
        signatureShare,
        requestType,
        signerShare,
        'ecdsa',
        'full',
        userPublicGpgKey,
        reqId
      );
      responseFromBitgo = await getBitgoToUserLatestShare(
        bitgo,
        walletId,
        txRequestId,
        ReceivedShareType.AShare,
        requestType,
        reqId
      );
      break;
    case SendShareType.MUShare:
      const shareToSend = share as MuDShare;
      const muShareRecord = convertMuShare(shareToSend.muShare);
      const dShareRecord = convertDShare(shareToSend.dShare);
      signatureShare = {
        to: SignatureShareType.BITGO,
        from: getParticipantFromIndex(shareToSend.dShare.j),
        share: `${muShareRecord.share}${secondaryDelimeter}${dShareRecord.share}`,
      };
      await sendSignatureShare(
        bitgo,
        walletId,
        txRequestId,
        signatureShare,
        requestType,
        signerShare,
        'ecdsa',
        undefined,
        undefined,
        reqId
      );
      responseFromBitgo = await getBitgoToUserLatestShare(
        bitgo,
        walletId,
        txRequestId,
        ReceivedShareType.DShare,
        requestType,
        reqId
      );
      break;
    case SendShareType.SShare:
      const sShare = share as SShare;
      signatureShare = convertSignatureShare(sShare, 1, 3);
      await sendSignatureShare(
        bitgo,
        walletId,
        txRequestId,
        signatureShare,
        requestType,
        signerShare,
        'ecdsa',
        undefined,
        undefined,
        reqId
      );
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
 * @param {IRequestTracer} reqId - request tracer request id
 * @returns {Promise<SendShareToBitgoRT>} - share from bitgo to user
 */
export async function getBitgoToUserLatestShare(
  bitgo: BitGoBase,
  walletId: string,
  txRequestId: string,
  shareType: ReceivedShareType,
  requestType: RequestType,
  reqId?: IRequestTracer
): Promise<SendShareToBitgoRT> {
  let responseFromBitgo: SendShareToBitgoRT;
  const txRequest = await getTxRequest(bitgo, walletId, txRequestId, reqId);
  let userShares;
  switch (requestType) {
    case RequestType.tx:
      assert(txRequest.transactions, 'transactions required as part of txRequest');
      userShares = txRequest.transactions[0].signatureShares;
      break;
    case RequestType.message:
      assert(txRequest.messages, 'messages required as part of txRequest');
      userShares = txRequest.messages[0].signatureShares;
      break;
  }
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
 * @param senderGpgKey - ephemeral GPG key to encrypt / decrypt sensitve data exchanged between user and server
 * @param isbs58Encoded - is bs58 encoded or not
 * @returns encrypted N Share
 */
export async function encryptNShare(
  keyShare: KeyShare,
  recipientIndex: number,
  recipientGpgPublicArmor: string,
  senderGpgKey: pgp.SerializedKeyPair<string>,
  isbs58Encoded = true
): Promise<EncryptedNShare> {
  const nShare = keyShare.nShares[recipientIndex];
  if (!nShare) {
    throw new Error('Invalid recipient');
  }

  const publicShare = Buffer.concat([
    Buffer.from(keyShare.pShare.y, 'hex'),
    Buffer.from(keyShare.pShare.chaincode, 'hex'),
  ]).toString('hex');

  let privateShare;
  if (isbs58Encoded) {
    privateShare = bip32.fromPrivateKey(Buffer.from(nShare.u, 'hex'), Buffer.from(nShare.chaincode, 'hex')).toBase58();
  } else {
    privateShare = Buffer.concat([Buffer.from(nShare.u, 'hex'), Buffer.from(nShare.chaincode, 'hex')]).toString('hex');
  }
  const recipientPublicKey = await pgp.readKey({ armoredKey: recipientGpgPublicArmor });

  const encryptedPrivateShare = (await pgp.encrypt({
    message: await pgp.createMessage({
      text: privateShare,
    }),
    encryptionKeys: [recipientPublicKey],
  })) as string;

  return {
    i: nShare.i,
    j: nShare.j,
    publicShare,
    encryptedPrivateShare,
    n: nShare.n,
    vssProof: nShare.v,
    privateShareProof: await createShareProof(senderGpgKey.privateKey, nShare.u, 'ecdsa'),
  };
}

/**
 * Prepares a NShare to be exchanged with other key holders.
 * An API key share received from a third party should already be encrypted
 *
 * @param keyShare - TSS key share of the party preparing exchange materials
 * @returns encrypted N Share
 */
export async function buildNShareFromAPIKeyShare(keyShare: ApiKeyShare): Promise<EncryptedNShare> {
  return {
    i: getParticipantIndex(keyShare.to),
    j: getParticipantIndex(keyShare.from),
    publicShare: keyShare.publicShare,
    encryptedPrivateShare: keyShare.privateShare,
    n: keyShare.n ?? '', // this is not currently needed for key creation
    privateShareProof: keyShare.privateShareProof,
    vssProof: keyShare.vssProof,
  };
}

/**
 * Decrypts encrypted n share
 * @param encryptedNShare - decryptable n share with recipient private gpg key armor and sender public gpg key
 * @param isbs58Encoded
 * @returns N share
 */
export async function decryptNShare(encryptedNShare: DecryptableNShare, isbs58Encoded = true): Promise<NShare> {
  const recipientPrivateKey = await pgp.readKey({ armoredKey: encryptedNShare.recipientPrivateArmor });
  const prv = (
    await pgp.decrypt({
      message: await pgp.readMessage({ armoredMessage: encryptedNShare.nShare.encryptedPrivateShare }),
      decryptionKeys: [recipientPrivateKey as pgp.PrivateKey],
    })
  ).data as string;

  let u: string;
  if (isbs58Encoded) {
    const privateShare = bs58.decode(prv).toString('hex');
    u = privateShare.slice(92, 156);
  } else {
    u = prv.slice(0, 64);
  }

  return {
    i: encryptedNShare.nShare.i,
    j: encryptedNShare.nShare.j,
    n: encryptedNShare.nShare.n,
    y: encryptedNShare.nShare.publicShare.slice(0, 66),
    u: u,
    chaincode: encryptedNShare.nShare.publicShare.slice(66, 130),
    v: encryptedNShare.nShare.vssProof,
  };
}

/**
 * Gets public key from common keychain
 * @param commonKeyChain - common keychain of ecdsa tss
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

function validateOptionalValues(shares: string[], start: number, end: number, shareName: string, valueName: string) {
  let found = false;
  for (let i = start; i < end; i++) {
    if (shares[i]) {
      found = true;
    } else if (found) {
      throw new Error(`Inconsistent optional ${valueName} value in ${shareName} share`);
    }
  }
  return found;
}

/**
 * parses K share from signature share record
 * @param share - signature share record
 * @returns K Share
 */
export function parseKShare(share: SignatureShareRecord): KShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 11 + 2 * EcdsaPaillierProof.m, 'K');
  const hasProof = validateOptionalValues(shares, 5, 11, 'K', 'proof');

  const proof: RangeProofShare | undefined = hasProof
    ? {
        z: shares[5],
        u: shares[6],
        w: shares[7],
        s: shares[8],
        s1: shares[9],
        s2: shares[10],
      }
    : undefined;

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    k: shares[0],
    n: shares[1],
    ntilde: shares[2],
    h1: shares[3],
    h2: shares[4],
    proof,
    p: shares.slice(11, 11 + EcdsaPaillierProof.m),
    sigma: shares.slice(11 + EcdsaPaillierProof.m, 11 + 2 * EcdsaPaillierProof.m),
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
    share: `${share.k}${delimeter}${share.n}${delimeter}${share.ntilde}${delimeter}${share.h1}${delimeter}${
      share.h2
    }${delimeter}${share.proof?.z || ''}${delimeter}${share.proof?.u || ''}${delimeter}${
      share.proof?.w || ''
    }${delimeter}${share.proof?.s || ''}${delimeter}${share.proof?.s1 || ''}${delimeter}${
      share.proof?.s2 || ''
    }${delimeter}${(share.p || []).join(delimeter)}${delimeter}${(share.sigma || []).join(delimeter)}`,
  };
}

/**
 * parses A share from signature share record
 * @param share - signature share record
 * @returns A Share
 */
export function parseAShare(share: SignatureShareRecord): AShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 37 + EcdsaPaillierProof.m, 'A');
  const hasProof = validateOptionalValues(shares, 7, 13, 'A', 'proof');
  const hasGammaProof = validateOptionalValues(shares, 13, 25, 'A', 'gammaProof');
  const hasWProof = validateOptionalValues(shares, 25, 37, 'A', 'wProof');

  const proof: RangeProofShare | undefined = hasProof
    ? {
        z: shares[7],
        u: shares[8],
        w: shares[9],
        s: shares[10],
        s1: shares[11],
        s2: shares[12],
      }
    : undefined;

  const gammaProof: RangeProofWithCheckShare | undefined = hasGammaProof
    ? {
        z: shares[13],
        zprm: shares[14],
        t: shares[15],
        v: shares[16],
        w: shares[17],
        s: shares[18],
        s1: shares[19],
        s2: shares[20],
        t1: shares[21],
        t2: shares[22],
        u: shares[23],
        x: shares[24],
      }
    : undefined;

  const wProof: RangeProofWithCheckShare | undefined = hasWProof
    ? {
        z: shares[25],
        zprm: shares[26],
        t: shares[27],
        v: shares[28],
        w: shares[29],
        s: shares[30],
        s1: shares[31],
        s2: shares[32],
        t1: shares[33],
        t2: shares[34],
        u: shares[35],
        x: shares[36],
      }
    : undefined;

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    k: shares[0],
    alpha: shares[1],
    mu: shares[2],
    n: shares[3],
    ntilde: shares[4],
    h1: shares[5],
    h2: shares[6],
    proof,
    gammaProof,
    wProof,
    sigma: shares.slice(37),
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
    share: `${share.k}${delimeter}${share.alpha}${delimeter}${share.mu}${delimeter}${share.n}${delimeter}${
      share.ntilde
    }${delimeter}${share.h1}${delimeter}${share.h2}${delimeter}${share.proof?.z || ''}${delimeter}${
      share.proof?.u || ''
    }${delimeter}${share.proof?.w || ''}${delimeter}${share.proof?.s || ''}${delimeter}${
      share.proof?.s1 || ''
    }${delimeter}${share.proof?.s2 || ''}${delimeter}${share.gammaProof?.z || ''}${delimeter}${
      share.gammaProof?.zprm || ''
    }${delimeter}${share.gammaProof?.t || ''}${delimeter}${share.gammaProof?.v || ''}${delimeter}${
      share.gammaProof?.w || ''
    }${delimeter}${share.gammaProof?.s || ''}${delimeter}${share.gammaProof?.s1 || ''}${delimeter}${
      share.gammaProof?.s2 || ''
    }${delimeter}${share.gammaProof?.t1 || ''}${delimeter}${share.gammaProof?.t2 || ''}${delimeter}${
      share.gammaProof?.u || ''
    }${delimeter}${share.gammaProof?.x || ''}${delimeter}${share.wProof?.z || ''}${delimeter}${
      share.wProof?.zprm || ''
    }${delimeter}${share.wProof?.t || ''}${delimeter}${share.wProof?.v || ''}${delimeter}${
      share.wProof?.w || ''
    }${delimeter}${share.wProof?.s || ''}${delimeter}${share.wProof?.s1 || ''}${delimeter}${
      share.wProof?.s2 || ''
    }${delimeter}${share.wProof?.t1 || ''}${delimeter}${share.wProof?.t2 || ''}${delimeter}${
      share.wProof?.u || ''
    }${delimeter}${share.wProof?.x || ''}${delimeter}${(share.sigma || []).join(delimeter)}`,
  };
}

/**
 * parses Mu share from signature share record
 * @param share - signature share record
 * @returns Mu Share
 */
export function parseMuShare(share: SignatureShareRecord): MUShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 26, 'Mu');
  const hasGammaProof = validateOptionalValues(shares, 2, 14, 'Mu', 'gammaProof');
  const hasWProof = validateOptionalValues(shares, 14, 26, 'Mu', 'wProof');

  let gammaProof;
  if (hasGammaProof) {
    gammaProof = {
      z: shares[2],
      zprm: shares[3],
      t: shares[4],
      v: shares[5],
      w: shares[6],
      s: shares[7],
      s1: shares[8],
      s2: shares[9],
      t1: shares[10],
      t2: shares[11],
      u: shares[12],
      x: shares[13],
    };
  }

  let wProof;
  if (hasWProof) {
    wProof = {
      z: shares[14],
      zprm: shares[15],
      t: shares[16],
      v: shares[17],
      w: shares[18],
      s: shares[19],
      s1: shares[20],
      s2: shares[21],
      t1: shares[22],
      t2: shares[23],
      u: shares[24],
      x: shares[25],
    };
  }

  return {
    i: getParticipantIndex(share.to),
    j: getParticipantIndex(share.from),
    alpha: shares[0],
    mu: shares[1],
    gammaProof,
    wProof,
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
    share: `${share.alpha}${delimeter}${share.mu}${delimeter}${share.gammaProof?.z || ''}${delimeter}${
      share.gammaProof?.zprm || ''
    }${delimeter}${share.gammaProof?.t || ''}${delimeter}${share.gammaProof?.v || ''}${delimeter}${
      share.gammaProof?.w || ''
    }${delimeter}${share.gammaProof?.s || ''}${delimeter}${share.gammaProof?.s1 || ''}${delimeter}${
      share.gammaProof?.s2 || ''
    }${delimeter}${share.gammaProof?.t1 || ''}${delimeter}${share.gammaProof?.t2 || ''}${delimeter}${
      share.gammaProof?.u || ''
    }${delimeter}${share.gammaProof?.x || ''}${delimeter}${share.wProof?.z || ''}${delimeter}${
      share.wProof?.zprm || ''
    }${delimeter}${share.wProof?.t || ''}${delimeter}${share.wProof?.v || ''}${delimeter}${
      share.wProof?.w || ''
    }${delimeter}${share.wProof?.s || ''}${delimeter}${share.wProof?.s1 || ''}${delimeter}${
      share.wProof?.s2 || ''
    }${delimeter}${share.wProof?.t1 || ''}${delimeter}${share.wProof?.t2 || ''}${delimeter}${
      share.wProof?.u || ''
    }${delimeter}${share.wProof?.x || ''}`,
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
 * @param senderIndex
 * @param recipientIndex
 * @returns signature share record
 */
export function convertSignatureShare(
  share: SignatureShare,
  senderIndex: number,
  recipientIndex: number
): SignatureShareRecord {
  return {
    to: getParticipantFromIndex(recipientIndex),
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
    share: `${share.beta}${delimeter}${share.gamma}${delimeter}${share.k}${delimeter}${share.nu}${delimeter}${
      share.w
    }${delimeter}${share.y}${delimeter}${share.l}${delimeter}${share.m}${delimeter}${share.n}${delimeter}${
      share.ntilde
    }${delimeter}${share.h1}${delimeter}${share.h2}${delimeter}${share.ck}${delimeter}${(share.p || []).join(
      delimeter
    )}`,
  };
}

/**
 * parses B share from signature share record
 * @param share B share record
 * @returns B Share
 */
export function parseBShare(share: SignatureShareRecord): BShare {
  const shares = share.share.split(delimeter);
  validateSharesLength(shares, 13 + EcdsaPaillierProof.m, 'B');

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
    ntilde: shares[9],
    h1: shares[10],
    h2: shares[11],
    ck: shares[12],
    p: shares.slice(13, 13 + EcdsaPaillierProof.m),
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

/**
 * Helper function to verify u-value wallet signatures for the bitgo-user and bitgo-backup shares.
 * @param params
 */
export async function verifyWalletSignature(params: {
  walletSignature: pgp.Key;
  bitgoPub: pgp.Key;
  commonKeychain: string;
  userKeyId: string;
  backupKeyId: string;
  decryptedShare: string;
  verifierIndex: 1 | 2;
}): Promise<void> {
  const rawNotations = await commonVerifyWalletSignature(params);
  const publicUValueRawNotationIndex = 2 + params.verifierIndex;

  // Derive public form of u-value
  const publicUValue = ecc.pointFromScalar(Buffer.from(params.decryptedShare.slice(0, 64), 'hex'), true);
  assert(publicUValue !== null, 'null public u-value');
  // Verify that the u value + chaincode is equal to the proof retrieved from the raw notations
  assert(
    Buffer.from(publicUValue).toString('hex') + params.decryptedShare.slice(64) ===
      Buffer.from(rawNotations[publicUValueRawNotationIndex].value).toString(),
    'bitgo share mismatch'
  );
}
