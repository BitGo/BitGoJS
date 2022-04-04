import { createMessage, encrypt, Key, readKey } from 'openpgp';
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
 * @param text string to encrypt
 * @param key encryption key
 * @return {string} encrypted string
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
