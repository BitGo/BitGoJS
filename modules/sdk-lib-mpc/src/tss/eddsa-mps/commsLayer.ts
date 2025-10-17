import { SerializedMessages, AuthEncMessages } from './types';
import { DklsTypes } from '../ecdsa-dkls/';
import { detachSignData, verifySignedData } from '../ecdsa-dkls/commsLayer';

/**
 * Encrypts and signs p2p messages + signs broadcast messages
 * @param messages messages to encrypt and sign
 * @param prvAuthenticationGpgKey private keys to sign with
 */
export async function encryptAndAuthOutgoingMessages(
  messages: SerializedMessages,
  prvAuthenticationGpgKeys: DklsTypes.PartyGpgKey[]
): Promise<AuthEncMessages> {
  const prvGpgKey = prvAuthenticationGpgKeys;
  if (!prvGpgKey) {
    throw Error(`No public key provided for bitgo`);
  }
  return await Promise.all(
    messages.map(async (m) => {
      const prvGpgKey = prvAuthenticationGpgKeys.find((k) => k.partyId === m.from);
      if (!prvGpgKey) {
        throw Error(`No private key provided for sender with ID: ${m.from}`);
      }
      return {
        from: m.from,
        payload: await detachSignData(Buffer.from(m.payload, 'base64'), prvGpgKey.gpgKey),
      };
    })
  );
}

/**
 * Decrypts and verifies p2p messages + verifies broadcast messages
 * @param messages message to decrypt and verify
 * @param pubVerificationGpgKeys public keys to verify signatures with
 */
export function decryptAndVerifyIncomingMessages(
  messages: AuthEncMessages,
  pubVerificationGpgKeys: DklsTypes.PartyGpgKey[]
): Promise<SerializedMessages> {
  return Promise.all(
    messages.map(async (m) => {
      const pubGpgKey = pubVerificationGpgKeys.find((k) => k.partyId === m.from);
      if (!pubGpgKey) {
        throw Error(`No public key provided for sender with ID: ${m.from}`);
      }
      if (!(await verifySignedData(m.payload, pubGpgKey.gpgKey))) {
        throw Error(`Failed to authenticate broadcast message from party: ${m.from}`);
      }
      return {
        from: m.from,
        payload: m.payload.message,
      };
    })
  );
}
