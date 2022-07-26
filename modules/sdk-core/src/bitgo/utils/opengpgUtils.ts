/* eslint-disable @typescript-eslint/ban-ts-comment */

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
import * as pgp from 'openpgp';
import { BitGoBase } from '../bitgoBase';

const sodium = require('libsodium-wrappers-sumo');

/**
 * Fetches BitGo's pubic gpg key used in MPC flows
 * @param {BitGo} bitgo BitGo object
 * @return {Key} public gpg key
 */
export async function getBitgoGpgPubKey(bitgo: BitGoBase): Promise<Key> {
  const constants = await bitgo.fetchConstants();
  if (!constants.mpc || !constants.mpc.bitgoPublicKey) {
    throw new Error('Unable to create MPC keys - bitgoPublicKey is missing from constants');
  }

  const bitgoPublicKeyStr = constants.mpc.bitgoPublicKey as string;
  return await readKey({ armoredKey: bitgoPublicKeyStr });
}

/**
 * Creates an Eddsa KeyShare Proof by appending an ed25519 subkey to an armored gpg private key.
 *
 * @param privateArmor gpg private key in armor format
 * @param uValue u value from an Eddsa keyshare
 * @return {string} keyshare proof
 */
export async function createShareProof(privateArmor: string, uValue: string): Promise<string> {
  const privateKey = await readKey({ armoredKey: privateArmor });
  const dateTime = new Date();
  await sodium.ready;
  const subKeyVal = Buffer.from(
    sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(uValue, 'hex'), 'uint8array')
  );

  // Sub-key (encryption key) packet.
  const publicSubKey = new Uint8Array([...new Uint8Array([0x40]), ...new Uint8Array(subKeyVal)]);
  const subOid = [0x2b, 0x06, 0x01, 0x04, 0x01, 0xda, 0x47, 0x0f, 0x01];

  // @ts-ignore
  subOid.write = () => new Uint8Array(Buffer.from('092b06010401da470f01', 'hex'));
  // @ts-ignore - type inconsistency, this ctor supports a date param: https://docs.openpgpjs.org/SecretSubkeyPacket.html
  const secretSubkeyPacket = new pgp.SecretSubkeyPacket(dateTime);
  secretSubkeyPacket.algorithm = pgp.enums.publicKey.eddsa;
  // @ts-ignore - same as above
  secretSubkeyPacket.isEncrypted = false;
  secretSubkeyPacket.publicParams = {
    oid: subOid,
    Q: new Uint8Array(publicSubKey),
  };
  // @ts-ignore - same as above
  await secretSubkeyPacket.computeFingerprintAndKeyID();

  // Sub-key signature packet.
  const subKeydataToSign = {
    key: privateKey.keyPacket,
    bind: privateKey.keyPacket,
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

  if (!(await newPubKey.verifyPrimaryUser([privateKey]))[0].valid) {
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
