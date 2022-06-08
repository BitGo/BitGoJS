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
import { BitGoBase } from '../bitgoBase';

type SignedMessage = {
  encryptedText: string;
  signature: string;
};

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
 * Encrypts a string and produces a detached signature
 * @param text string to encrypt and sign
 * @param publicArmor public key to encrypt with
 * @param privateArmor private key to sign with
 * @return {SignedMessage} object containing encrypted text and signature
 */
export async function encryptAndSignText(
  text: string,
  publicArmor: string,
  privateArmor: string
): Promise<SignedMessage> {
  const publicKey = await readKey({ armoredKey: publicArmor });
  const privateKey = await readPrivateKey({ armoredKey: privateArmor });

  const message = await createMessage({ text });
  const signature = await sign({
    message,
    signingKeys: privateKey,
    detached: true,
  });
  const encryptedText = await encrypt({
    message: message,
    encryptionKeys: publicKey,
    format: 'armored',
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });

  return {
    encryptedText,
    signature,
  };
}

/**
 * Reads an encrypted message and verifies its signature.
 * This will throw an error if the signature does not match the provided public key.
 *
 * @param signedMessage object containing encrypted text and signature
 * @param publicArmor public key to verify signature
 * @param privateArmor private key to decrypt message
 */
export async function readSignedMessage(
  signedMessage: SignedMessage,
  publicArmor: string,
  privateArmor: string
): Promise<string> {
  const publicKey = await readKey({ armoredKey: publicArmor });
  const privateKey = await readPrivateKey({ armoredKey: privateArmor });

  const message = await readMessage({ armoredMessage: signedMessage.encryptedText });
  const decrypted = await decrypt({
    message,
    decryptionKeys: privateKey,
  });
  const decryptedMessage = await createMessage({ text: decrypted.data });
  const signature = await readSignature({ armoredSignature: signedMessage.signature });
  const verificationResults = await verify({
    message: decryptedMessage,
    signature,
    verificationKeys: publicKey,
  });

  if (verificationResults.signatures.length !== 1) {
    throw new Error('Malformed signature');
  }

  const { verified } = verificationResults.signatures[0];
  try {
    await verified;
  } catch {
    throw new Error('Signature does not match public key');
  }

  return decrypted.data;
}
