/* eslint-disable @typescript-eslint/ban-ts-comment */

import * as pgp from 'openpgp';
import {
  createMessage,
  decrypt,
  encrypt,
  Key,
  readKey,
  readMessage,
  readPrivateKey,
  readSignature,
  sign,
  verify,
} from 'openpgp';
import * as _ from 'lodash';
import { ecc as secp256k1 } from '@bitgo/utxo-lib';
import { BitGoBase } from '../bitgoBase';
import crypto from 'crypto';

const sodium = require('libsodium-wrappers-sumo');

export type KeyValidityDict = {
  keyID: pgp.KeyID;
  valid: boolean | null;
}[];

export type AuthEncMessage = {
  encryptedMessage: string;
  signature: string;
};

/**
 * Fetches BitGo's public gpg key used in MPC flows
 * @param {BitGoBase} bitgo BitGo object
 * @return {Key} public gpg key
 */
export async function getBitgoGpgPubKey(bitgo: BitGoBase): Promise<{ mpcV1: Key; mpcV2: Key | undefined }> {
  const constants = await bitgo.fetchConstants();
  if (!constants.mpc || !constants.mpc.bitgoPublicKey) {
    throw new Error('Unable to create MPC keys - bitgoPublicKey is missing from constants');
  }

  const bitgoPublicKeyStr = constants.mpc.bitgoPublicKey as string;
  const bitgoMPCv2PublicKeyStr = constants.mpc.bitgoMPCv2PublicKey
    ? await readKey({ armoredKey: constants.mpc.bitgoMPCv2PublicKey as string })
    : undefined;
  return { mpcV1: await readKey({ armoredKey: bitgoPublicKeyStr }), mpcV2: bitgoMPCv2PublicKeyStr };
}

/**
 * Verifies the primary user on a GPG key using a reference key representing the user to be checked.
 * Allows a verification without a date check by wrapping verifyPrimaryUser of openpgp.
 * @param {Key} pubKey gpg key to check the primary user of.
 * @param {Key} primaryUser gpg key of the user to check.
 * @param {boolean} checkDates If false, disable date checks in the openpgp call to check the primary user.
 * @return {KeyValidityDict} list of users checked and whether each passed as a primary user in pubKey or not.
 */
export async function verifyPrimaryUserWrapper(
  pubKey: Key,
  primaryUser: Key,
  checkDates: boolean
): Promise<KeyValidityDict> {
  if (checkDates) {
    return await pubKey.verifyPrimaryUser([primaryUser]);
  } else {
    return await pubKey.verifyPrimaryUser([primaryUser], null as unknown as undefined);
  }
}

/**
 * Fetches Trust pub key string
 * @param bitgo
 */
export async function getTrustGpgPubKey(bitgo: BitGoBase): Promise<Key> {
  const constants = await bitgo.fetchConstants();
  if (!constants.trustPubKey) {
    throw new Error('Unable to get trustPubKey');
  }
  return readKey({ armoredKey: constants.trustPubKey });
}

/**
 * Verify an Eddsa or Ecdsa KeyShare Proof.
 *
 * @param senderPubKey public key of the sender of the privateShareProof
 * @param privateShareProof u value proof
 * @param uValue u value from an Eddsa keyshare
 * @param algo
 * @return {boolean} whether uValue proof actually was signed by sender as part of their subkeys
 */
export async function verifyShareProof(
  senderPubKey: string,
  privateShareProof: string,
  uValue: string,
  algo: 'eddsa' | 'ecdsa'
): Promise<boolean> {
  const decodedProof = await pgp.readKey({ armoredKey: privateShareProof });
  const senderGpgKey = await pgp.readKey({ armoredKey: senderPubKey });
  if (!(await verifyPrimaryUserWrapper(decodedProof, senderGpgKey, true))[0].valid) {
    return false;
  }
  const proofSubkeys = decodedProof.getSubkeys()[1];
  if (algo === 'eddsa') {
    const decodedUValueProof = Buffer.from(proofSubkeys.keyPacket.publicParams['Q'].slice(1)).toString('hex');
    const rawUValueProof = Buffer.from(
      sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(uValue, 'hex'))
    ).toString('hex');
    return decodedUValueProof === rawUValueProof;
  } else if (algo === 'ecdsa') {
    const decodedUValueProof = Buffer.from(proofSubkeys.keyPacket.publicParams['Q']).toString('hex');
    const rawUValueProof = secp256k1.pointFromScalar(Buffer.from(uValue, 'hex'), false);
    return rawUValueProof !== null && decodedUValueProof === Buffer.from(rawUValueProof).toString('hex');
  } else {
    throw new Error('Invalid algorithm provided');
  }
}

/**
 * Verify a shared data proof.
 *
 * @param senderPubKeyArm public key of the signer of the key with proof data
 * @param keyWithNotation signed reciever key with notation data
 * @param dataToVerify data to be checked against notation data in the signed key
 * @return {boolean} whether proof is valid
 */
export async function verifySharedDataProof(
  senderPubKeyArm: string,
  keyWithNotation: string,
  dataToVerify: { name: string; value: string }[]
): Promise<boolean> {
  const senderPubKey = await pgp.readKey({ armoredKey: senderPubKeyArm });
  const signedKey = await pgp.readKey({ armoredKey: keyWithNotation });
  if (
    !(await verifyPrimaryUserWrapper(signedKey, senderPubKey, true).then((values) =>
      _.some(values, (value) => value.valid)
    ))
  ) {
    return false;
  }
  const primaryUser = await signedKey.getPrimaryUser();
  const anyInvalidProof = _.some(
    // @ts-ignore
    primaryUser.user.otherCertifications[0].rawNotations,
    (notation) => dataToVerify.find((i) => i.name === notation.name)?.value !== Buffer.from(notation.value).toString()
  );
  return !anyInvalidProof;
}

/**
 * Creates a proof through adding notation data to a GPG ceritifying signature.
 *
 * @param privateKeyArmored gpg private key in armor format of the sender
 * @param publicKeyToCertArmored gpg public key in armor fomrat of the reciever
 * @param notations data to be proofed
 * @return {string} keyshare proof
 */
export async function createSharedDataProof(
  privateKeyArmored: string,
  publicKeyToCertArmored: string,
  notations: { name: string; value: string }[]
): Promise<string> {
  const certifyingKey = await pgp.readKey({ armoredKey: privateKeyArmored });
  const publicKeyToCert = await pgp.readKey({ armoredKey: publicKeyToCertArmored });
  const dateTime = new Date();
  // UserId Packet.
  const userIdPkt = new pgp.UserIDPacket();
  const primaryUser = await publicKeyToCert.getPrimaryUser();
  // @ts-ignore
  userIdPkt.userID = primaryUser.user.userID.userID;
  // Signature packet.
  const signaturePacket = new pgp.SignaturePacket();
  signaturePacket.signatureType = pgp.enums.signature.certPositive;
  signaturePacket.publicKeyAlgorithm = pgp.enums.publicKey.ecdsa;
  signaturePacket.hashAlgorithm = pgp.enums.hash.sha256;
  // @ts-ignore
  signaturePacket.issuerFingerprint = await primaryUser.user.mainKey.keyPacket.getFingerprintBytes();
  // @ts-ignore
  signaturePacket.issuerKeyID = primaryUser.user.mainKey.keyPacket.keyID;
  // @ts-ignore
  signaturePacket.signingKeyID = primaryUser.user.mainKey.keyPacket.keyID;
  // @ts-ignore
  signaturePacket.signersUserID = primaryUser.user.userID.userID;
  // @ts-ignore
  signaturePacket.features = [1];
  notations.forEach(({ name, value }) => {
    signaturePacket.rawNotations.push({
      name: name,
      value: new Uint8Array(Buffer.from(value)),
      humanReadable: true,
      critical: false,
    });
  });

  // Prepare signing data.
  const keydataToSign = {};
  // @ts-ignore
  keydataToSign.key = publicKeyToCert.keyPacket;
  // @ts-ignore
  keydataToSign.userID = userIdPkt;

  // Sign the data (create certification).
  // @ts-ignore
  await signaturePacket.sign(certifyingKey.keyPacket, keydataToSign, dateTime);

  // Assemble packets together.
  const publicKeyToCertPkts = publicKeyToCert.toPacketList();
  const newKeyPktList = new pgp.PacketList();
  newKeyPktList.push(...publicKeyToCertPkts.slice(0, 3), signaturePacket, ...publicKeyToCertPkts.slice(3));
  // @ts-ignore
  const newPubKey = new pgp.PublicKey(newKeyPktList);
  return newPubKey.armor().replace(/\r\n/g, '\n');
}

/**
 * Creates a KeyShare Proof based on given algo.
 *
 * Creates an EdDSA KeyShare Proof by appending an ed25519 subkey (auth) to an armored gpg private key.
 * Creates an ECDSA KeyShare Proof by Append a secp256k1 subkey (auth) to a PGP keychain.
 *
 * @param privateArmor gpg private key in armor format
 * @param uValue u value from an Eddsa keyshare
 * @param algo algo to use, eddsa or ecdsa
 * @return {string} keyshare proof
 */
export async function createShareProof(privateArmor: string, uValue: string, algo: string): Promise<string> {
  const privateKey = await readKey({ armoredKey: privateArmor });
  const dateTime = new Date();
  // @ts-ignore - type inconsistency, this ctor supports a date param: https://docs.openpgpjs.org/SecretSubkeyPacket.html
  const secretSubkeyPacket = new pgp.SecretSubkeyPacket(dateTime);
  secretSubkeyPacket.algorithm = pgp.enums.publicKey[algo];
  // @ts-ignore - same as above
  secretSubkeyPacket.isEncrypted = false;
  let oid;
  let Q;
  if (algo === 'eddsa') {
    await sodium.ready;
    const subKeyVal = Buffer.from(
      sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(uValue, 'hex'), 'uint8array')
    );
    // Sub-key (encryption key) packet.
    oid = [0x2b, 0x06, 0x01, 0x04, 0x01, 0xda, 0x47, 0x0f, 0x01];
    // @ts-ignore
    oid.write = () => new Uint8Array(Buffer.from('092b06010401da470f01', 'hex'));
    Q = new Uint8Array([0x40, ...subKeyVal]);
  } else if (algo === 'ecdsa') {
    oid = [0x2b, 0x81, 0x04, 0x00, 0x0a];
    // @ts-ignore - same as above
    oid.write = () => new Uint8Array(Buffer.from('052b8104000a', 'hex'));
    Q = secp256k1.pointFromScalar(new Uint8Array(Buffer.from(uValue, 'hex')), false);
  }
  secretSubkeyPacket.publicParams = {
    oid,
    Q,
  };
  // @ts-ignore - same as above
  await secretSubkeyPacket.computeFingerprintAndKeyID();

  // Sub-key signature packet.
  const subKeydataToSign = {
    key: privateKey.keyPacket,
    bind: secretSubkeyPacket,
  };
  const subkeySignaturePacket = new pgp.SignaturePacket();
  subkeySignaturePacket.signatureType = pgp.enums.signature.subkeyBinding;
  subkeySignaturePacket.publicKeyAlgorithm = pgp.enums.publicKey.ecdsa;
  subkeySignaturePacket.hashAlgorithm = pgp.enums.hash.sha256;
  subkeySignaturePacket.keyFlags = new Uint8Array([pgp.enums.keyFlags.authentication]);

  // Sign the subkey
  // @ts-ignore - sign supports arbitrary data for 2nd param: https://docs.openpgpjs.org/SignaturePacket.html
  await subkeySignaturePacket.sign(privateKey.keyPacket, subKeydataToSign, dateTime);

  // Assemble packets together.
  const newKeyPktList = new pgp.PacketList();
  const privateKeyPkts = privateKey.toPacketList();
  privateKeyPkts.forEach((packet) => newKeyPktList.push(packet));
  newKeyPktList.push(secretSubkeyPacket, subkeySignaturePacket);
  // @ts-ignore - supports packet list as ctor param: https://docs.openpgpjs.org/PrivateKey.html
  const newPubKey = new pgp.PrivateKey(newKeyPktList).toPublic();

  if (!(await verifyPrimaryUserWrapper(newPubKey, privateKey, true))[0].valid) {
    throw new Error('Incorrect signature');
  }

  return newPubKey.armor().replace(/\r\n/g, '\n');
}

/**
 * Encrypts string using gpg key
 * @DEPRECATED - should use encryptAndSignText instead for added security
 *
 * @param text string to encrypt
 * @param key encryption key
 * @return {string} encrypted string
 *
 * TODO(BG-47170): Delete once gpg signatures are fully supported
 */
export async function encryptText(text: string, key: Key): Promise<string> {
  const messageToEncrypt = await createMessage({
    text,
  });
  return await encrypt({
    message: messageToEncrypt,
    encryptionKeys: [key],
    format: 'armored',
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });
}

/**
 * Encrypts and signs a string
 * @param text string to encrypt and sign
 * @param publicArmor public key to encrypt with
 * @param privateArmor private key to sign with
 */
export async function encryptAndSignText(text: string, publicArmor: string, privateArmor: string): Promise<string> {
  const publicKey = await readKey({ armoredKey: publicArmor });
  const privateKey = await readPrivateKey({ armoredKey: privateArmor });

  const message = await createMessage({ text });

  const signedMessage = await encrypt({
    message,
    encryptionKeys: publicKey,
    signingKeys: privateKey,
    format: 'armored',
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });

  return signedMessage;
}

/**
 * Reads a signed and encrypted message
 *
 * @param signed signed and encrypted message
 * @param publicArmor public key to verify signature
 * @param privateArmor private key to decrypt message
 */
export async function readSignedMessage(signed: string, publicArmor: string, privateArmor: string): Promise<string> {
  const publicKey = await readKey({ armoredKey: publicArmor });
  const privateKey = await readPrivateKey({ armoredKey: privateArmor });

  const message = await readMessage({ armoredMessage: signed });
  const decrypted = await decrypt({
    message,
    verificationKeys: publicKey,
    decryptionKeys: privateKey,
    expectSigned: true,
    config: { rejectCurves: new Set() },
  });

  return decrypted.data;
}

/**
 * Generates a signature
 *
 * @param text string to generate a signature for
 * @param privateArmor private key as armored string
 * @return {string} armored signature string
 */
export async function signText(text: string, privateArmor: string): Promise<string> {
  const privateKey = await readPrivateKey({ armoredKey: privateArmor });
  const message = await createMessage({ text });
  const signature = await sign({
    message,
    signingKeys: privateKey,
    format: 'armored',
    detached: true,
  });

  return signature;
}

/**
 * Verifies signature was generated by the public key and matches the expected text
 *
 * @param text text that the signature was for
 * @param armoredSignature signed message as an armored string
 * @param publicArmor public key that generated the signature
 */
export async function verifySignature(text: string, armoredSignature: string, publicArmor: string): Promise<boolean> {
  const publicKey = await readKey({ armoredKey: publicArmor });
  const signature = await readSignature({ armoredSignature });
  const message = await createMessage({ text });
  const verificationResult = await verify({
    message,
    signature,
    verificationKeys: publicKey,
  });

  if (verificationResult.signatures.length !== 1) {
    throw new Error('Invalid number of signatures');
  }

  try {
    await verificationResult.signatures[0].verified;
    return text === verificationResult.data;
  } catch {
    return false;
  }
}

/**
 * Generate a GPG key pair
 *
 * @param: keyCurve the curve to create a key with
 * @param: username name of the user (optional)
 * @param: email email of the user (optional)
 */
export async function generateGPGKeyPair(
  keyCurve: pgp.EllipticCurveName,
  username?: string | undefined,
  email?: string | undefined
): Promise<pgp.SerializedKeyPair<string>> {
  const randomHexString = crypto.randomBytes(12).toString('hex');
  username = username ?? randomHexString;
  email = email ?? `user-${randomHexString}@${randomHexString}.com`;

  // Allow generating secp256k1 key pairs
  pgp.config.rejectCurves = new Set();
  const gpgKey = await pgp.generateKey({
    userIDs: [
      {
        name: username,
        email,
      },
    ],
    curve: keyCurve,
  });

  return gpgKey;
}
