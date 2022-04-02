import { createMessage, encrypt, Key, readKey } from 'openpgp';
import { BitGo } from '../../bitgo';

export async function getBitgoGpgPubKey(bitgo: BitGo): Promise<Key> {
  const constants = await bitgo.fetchConstants();
  if (!constants.mpc || !constants.mpc.bitgoPublicKey) {
    throw new Error('Unable to create MPC keys - bitgoPublicKey is missing from constants');
  }

  const bitgoPublicKeyStr = constants.mpc.bitgoPublicKey as string;
  return await readKey({ armoredKey: bitgoPublicKeyStr });
}

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
