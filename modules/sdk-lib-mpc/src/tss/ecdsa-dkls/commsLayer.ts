import { SerializedMessages, AuthEncMessage, AuthEncMessages, PartyGpgKey, AuthMessage } from './types';
import * as pgp from 'openpgp';

/**
 * Detach signs a binary and encodes it in base64
 * @param data binary to encode in base64 and sign
 * @param privateArmor private key to sign with
 */
export async function detachSignData(data: Buffer, privateArmor: string): Promise<AuthMessage> {
  const message = await pgp.createMessage({ binary: data });
  const privateKey = await pgp.readPrivateKey({ armoredKey: privateArmor });
  const signature = await pgp.sign({
    message,
    signingKeys: privateKey,
    format: 'armored',
    detached: true,
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });
  return {
    message: data.toString('base64'),
    signature: signature,
  };
}

/**
 * Encrypts and detach signs a binary
 * @param data binary to encrypt and sign
 * @param publicArmor public key to encrypt with
 * @param privateArmor private key to sign with
 */
export async function encryptAndDetachSignData(
  data: Buffer,
  publicArmor: string,
  privateArmor: string
): Promise<AuthEncMessage> {
  const message = await pgp.createMessage({ binary: data });
  const publicKey = await pgp.readKey({ armoredKey: publicArmor });
  const privateKey = await pgp.readPrivateKey({ armoredKey: privateArmor });
  const encryptedMessage = await pgp.encrypt({
    message,
    encryptionKeys: publicKey,
    format: 'armored',
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });
  const signature = await pgp.sign({
    message,
    signingKeys: privateKey,
    format: 'armored',
    detached: true,
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
  });
  return {
    encryptedMessage: encryptedMessage,
    signature: signature,
  };
}

/**
 * Decrypts and verifies signature on a binary
 * @param encryptedAndSignedMessage message to decrypt and verify
 * @param publicArmor public key to verify signature with
 * @param privateArmor private key to decrypt with
 */
export async function decryptAndVerifySignedData(
  encryptedAndSignedMessage: AuthEncMessage,
  publicArmor: string,
  privateArmor: string
): Promise<string> {
  const publicKey = await pgp.readKey({ armoredKey: publicArmor });
  const privateKey = await pgp.readPrivateKey({ armoredKey: privateArmor });
  const decryptedMessage = await pgp.decrypt({
    message: await pgp.readMessage({ armoredMessage: encryptedAndSignedMessage.encryptedMessage }),
    decryptionKeys: [privateKey],
    config: {
      rejectCurves: new Set(),
      showVersion: false,
      showComment: false,
    },
    format: 'binary',
  });
  const verificationResult = await pgp.verify({
    message: await pgp.createMessage({ binary: decryptedMessage.data }),
    signature: await pgp.readSignature({ armoredSignature: encryptedAndSignedMessage.signature }),
    verificationKeys: publicKey,
  });
  await verificationResult.signatures[0].verified;
  return Buffer.from(decryptedMessage.data).toString('base64');
}

/**
 * Verifies signature on a binary (message passed should be encoded in base64).
 * @param signedMessage message to verify
 * @param publicArmor public key to verify signature with
 */
export async function verifySignedData(signedMessage: AuthMessage, publicArmor: string): Promise<boolean> {
  const publicKey = await pgp.readKey({ armoredKey: publicArmor });
  const verificationResult = await pgp.verify({
    message: await pgp.createMessage({ binary: Buffer.from(signedMessage.message, 'base64') }),
    signature: await pgp.readSignature({ armoredSignature: signedMessage.signature }),
    verificationKeys: publicKey,
  });
  try {
    await verificationResult.signatures[0].verified;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Decrypts and verifies p2p messages + verifies broadcast messages
 * @param messages message to decrypt and verify
 * @param pubVerificationGpgKeys public keys to verify signatures with
 * @param prvDecryptionGpgKeys private keys to decrypt with
 */
export async function decryptAndVerifyIncomingMessages(
  messages: AuthEncMessages,
  pubVerificationGpgKeys: PartyGpgKey[],
  prvDecryptionGpgKeys: PartyGpgKey[]
): Promise<SerializedMessages> {
  return {
    p2pMessages: await Promise.all(
      messages.p2pMessages.map(async (m) => {
        const pubGpgKey = pubVerificationGpgKeys.find((k) => k.partyId === m.from);
        const prvGpgKey = prvDecryptionGpgKeys.find((k) => k.partyId === m.to);
        if (!pubGpgKey) {
          throw Error(`No public key provided for sender with ID: ${m.from}`);
        }
        if (!prvGpgKey) {
          throw Error(`No private key provided for recepient with ID: ${m.to}`);
        }
        return {
          to: m.to,
          from: m.from,
          payload: await decryptAndVerifySignedData(m.payload, pubGpgKey.gpgKey, prvGpgKey.gpgKey),
          commitment: m.commitment,
        };
      })
    ),
    broadcastMessages: await Promise.all(
      messages.broadcastMessages.map(async (m) => {
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
    ),
  };
}

/**
 * Encrypts and signs p2p messages + signs broadcast messages
 * @param messages messages to encrypt and sign
 * @param pubEncryptionGpgKey public keys to encrypt data to
 * @param prvAuthenticationGpgKey private keys to sign with
 */
export async function encryptAndAuthOutgoingMessages(
  messages: SerializedMessages,
  pubEncryptionGpgKeys: PartyGpgKey[],
  prvAuthenticationGpgKeys: PartyGpgKey[]
): Promise<AuthEncMessages> {
  return {
    p2pMessages: await Promise.all(
      messages.p2pMessages.map(async (m) => {
        const pubGpgKey = pubEncryptionGpgKeys.find((k) => k.partyId === m.to);
        const prvGpgKey = prvAuthenticationGpgKeys.find((k) => k.partyId === m.from);
        if (!pubGpgKey) {
          throw Error(`No public key provided for recipient with ID: ${m.to}`);
        }
        if (!prvGpgKey) {
          throw Error(`No private key provided for sender with ID: ${m.from}`);
        }
        return {
          to: m.to,
          from: m.from,
          payload: await encryptAndDetachSignData(Buffer.from(m.payload, 'base64'), pubGpgKey.gpgKey, prvGpgKey.gpgKey),
          commitment: m.commitment,
        };
      })
    ),
    broadcastMessages: await Promise.all(
      messages.broadcastMessages.map(async (m) => {
        const prvGpgKey = prvAuthenticationGpgKeys.find((k) => k.partyId === m.from);
        if (!prvGpgKey) {
          throw Error(`No private key provided for sender with ID: ${m.from}`);
        }
        return {
          from: m.from,
          payload: await detachSignData(Buffer.from(m.payload, 'base64'), prvGpgKey.gpgKey),
          signatureR: m.signatureR
            ? {
                message: m.signatureR,
                signature: '',
              }
            : undefined,
        };
      })
    ),
  };
}
