import { BuildTransactionError } from '@bitgo/sdk-core';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { decodeV1Message } from './codecs/v1/message';

const SIGNATURE_BYTE_LENGTH = 64;
const V1_VERSION_PREFIX = 0x81;
const V1_TRANSACTION_SIZE_LIMIT = 4096;

export type ParsedWireTransaction = {
  messageBytes: Uint8Array;
  signatures: Uint8Array[];
  signerPublicKeys: string[];
};

export function parseWireTransaction(wireBytes: Uint8Array): ParsedWireTransaction {
  if (!wireBytes || wireBytes.length === 0) {
    throw new BuildTransactionError('Invalid v1 transaction: empty');
  }
  if (wireBytes[0] !== V1_VERSION_PREFIX) {
    throw new BuildTransactionError(
      `Invalid v1 transaction: expected version prefix 0x${V1_VERSION_PREFIX.toString(
        16
      )}, got 0x${wireBytes[0].toString(16)}`
    );
  }
  if (wireBytes.length < 42) {
    throw new BuildTransactionError('Invalid v1 transaction: too short');
  }
  if (wireBytes.length > V1_TRANSACTION_SIZE_LIMIT) {
    throw new BuildTransactionError(
      `Invalid v1 transaction: exceeds the ${V1_TRANSACTION_SIZE_LIMIT}-byte size limit: ${wireBytes.length} bytes`
    );
  }
  const decoded = decodeV1Message(wireBytes);
  const messageLength = decoded.byteLength;
  const numSignatures = decoded.header.numSignerAccounts;
  const expectedSigBytes = numSignatures * SIGNATURE_BYTE_LENGTH;

  if (wireBytes.length - messageLength !== expectedSigBytes) {
    throw new BuildTransactionError(
      `Invalid v1 transaction: expected ${expectedSigBytes} signature bytes after message, got ${
        wireBytes.length - messageLength
      }`
    );
  }

  const messageBytes = wireBytes.slice(0, messageLength);
  const signatures: Uint8Array[] = [];
  for (let i = 0; i < numSignatures; i++) {
    signatures.push(
      wireBytes.slice(messageLength + i * SIGNATURE_BYTE_LENGTH, messageLength + (i + 1) * SIGNATURE_BYTE_LENGTH)
    );
  }
  return { messageBytes, signatures, signerPublicKeys: decoded.staticAccounts.slice(0, numSignatures) };
}

export function verifyV1Signatures(
  messageBytes: Uint8Array,
  signatures: Uint8Array[],
  signerPublicKeys: string[]
): void {
  if (signatures.length !== signerPublicKeys.length) {
    throw new BuildTransactionError('Signature count does not match signer count');
  }
  for (let i = 0; i < signatures.length; i++) {
    const pubkey = new PublicKey(signerPublicKeys[i]).toBuffer();
    if (!nacl.sign.detached.verify(messageBytes, signatures[i], pubkey)) {
      throw new BuildTransactionError(`Signature verification failed for signer ${i}`);
    }
  }
}

export function validateRawTransactionV1(wireBytes: Uint8Array): void {
  const { messageBytes, signatures, signerPublicKeys } = parseWireTransaction(wireBytes);
  verifyV1Signatures(messageBytes, signatures, signerPublicKeys);
}
