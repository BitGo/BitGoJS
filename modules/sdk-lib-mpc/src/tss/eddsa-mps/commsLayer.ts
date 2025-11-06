import { SerializedMessage, AuthMessage, AuthEncMessage } from './types';
import { DklsTypes } from '../ecdsa-dkls/';
import {
  decryptAndVerifySignedData,
  detachSignData,
  encryptAndDetachSignData,
  verifySignedData,
} from '../ecdsa-dkls/commsLayer';

/**
 * Authenticates outgoing broadcast messages by creating detached signatures
 *
 * @param {SerializedMessage[]} messages - array of serialized messages to authenticate
 * @param {DklsTypes.PartyGpgKey[]} prvAuthenticationGpgKeys - array of private GPG keys for signing, one per sender party
 * @returns {Promise<AuthMessage[]>} array of authenticated messages with detached signatures
 * @throws {Error} if no private key is found for a sender or if signing fails
 *
 * @description
 * This function processes outgoing messages by:
 * 1. Matching each message with its sender's private GPG key based on party ID
 * 2. Creating a detached signature for each message payload
 * 3. Returning the messages with their detached signatures for transmission
 * Note: This is used for broadcast messages where encryption is not needed, only authentication
 */
export async function encryptAndAuthOutgoingMessages(
  messages: SerializedMessage[],
  prvAuthenticationGpgKeys: DklsTypes.PartyGpgKey[]
): Promise<AuthMessage[]> {
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
 * Encrypts and signs a single peer-to-peer (P2P) message
 *
 * @param {SerializedMessage} message - the serialized message to encrypt and authenticate
 * @param {DklsTypes.PartyGpgKey} fromPartyGpgKey - GPG private key of the sender party for signing
 * @param {DklsTypes.PartyGpgKey} toPartyGpgKey - GPG public key of the recipient party for encryption
 * @returns {Promise<AuthMessage>} authenticated and encrypted message ready for transmission
 * @throws {Error} if encryption or signing fails
 *
 * @description
 * This function secures a P2P message by:
 * 1. Encrypting the message payload using the recipient's public GPG key
 * 2. Creating a detached signature using the sender's private GPG key
 * 3. Returning both the encrypted message and signature as an authenticated message
 */
export async function encryptAndAuthOutgoingMessageP2P(
  message: SerializedMessage,
  fromPartyGpgKey: DklsTypes.PartyGpgKey,
  toPartyGpgKey: DklsTypes.PartyGpgKey
): Promise<AuthEncMessage> {
  const { gpgKey: toPartyPubKey } = toPartyGpgKey
  const { gpgKey: fromPartyPrvKey } = fromPartyGpgKey
  const { encryptedMessage, signature } = await encryptAndDetachSignData(
    Buffer.from(message.payload, 'base64'),
    toPartyPubKey,
    fromPartyPrvKey
  );
  return {
    from: message.from,
    payload: {
      encryptedMessage: encryptedMessage,
      signature: signature,
    },
  };
}

/**
 * Decrypts and verifies broadcast messages
 * @param messages message to decrypt and verify
 * @param pubVerificationGpgKeys public keys to verify signatures with
 */
export function decryptAndVerifyIncomingMessages(
  messages: AuthMessage[],
  pubVerificationGpgKeys: DklsTypes.PartyGpgKey[]
): Promise<SerializedMessage[]> {
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

/**
 * Decrypts and verifies peer-to-peer (P2P) messages
 *
 * @param {AuthMessage[]} messages - array of authenticated and encrypted messages to process
 * @param {DklsTypes.PartyGpgKey} fromPartyGpgKey - GPG public key of the sender party for signature verification
 * @param {DklsTypes.PartyGpgKey} toPartyGpgKey - GPG private key of the recipient party for decryption
 * @returns {Promise<SerializedMessage[]>} array of decrypted and verified serialized messages
 * @throws {Error} if decryption or signature verification fails
 *
 * @description
 * This function processes P2P messages by:
 * 1. Decrypting each message using the recipient's private GPG key
 * 2. Verifying the signature using the sender's public GPG key
 * 3. Returning the decrypted and verified payload as serialized messages
 */
export async function decryptAndVerifyIncomingMessageP2P(
  messages: AuthEncMessage[],
  fromPartyGpgKey: DklsTypes.PartyGpgKey,
  toPartyGpgKey: DklsTypes.PartyGpgKey
): Promise<SerializedMessage[]> {
  return await Promise.all(
    messages.map(async (m) => {
      return {
        from: m.from,
        payload: await decryptAndVerifySignedData(
          { encryptedMessage: m.payload.encryptedMessage, signature: m.payload.signature },
          fromPartyGpgKey.gpgKey,
          toPartyGpgKey.gpgKey
        ),
      };
    })
  );
}
