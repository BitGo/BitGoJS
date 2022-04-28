import {
  createMessage,
  decrypt,
  encrypt,
  Key,
  readKey,
  readMessage,
  readPrivateKey,
} from 'openpgp';
import { BitGo } from '../../bitgo';

/**
 * Fetches BitGo's pubic gpg key used in MPC flows
 * @param {BitGo} bitgo BitGo object
 * @return {Key} public gpg key
 */
export async function getBitgoGpgPubKey(bitgo: BitGo): Promise<Key> {
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
