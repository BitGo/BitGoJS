import { BuildTransactionError } from '@bitgo/sdk-core';

const SIGNATURE_BYTE_LENGTH = 64;
const V1_VERSION_PREFIX = 0x81;
const V1_TRANSACTION_SIZE_LIMIT = 4096;

/**
 * Assemble the v1 wire format of a signed transaction.
 *
 * Unlike legacy and v0 transactions, where signatures are prefixed before the message, a v1
 * transaction places the message first and appends the signatures at the tail with no length
 * prefix; the signature count is derived from the message header's numRequiredSignatures.
 *
 * @param messageBytes - The serialized v1 message bytes (starting with the 0x81 version prefix)
 * @param signatures - The ed25519 signatures over the message bytes, one per required signer
 * @returns The full v1 wire transaction bytes
 */
export function serializeV1Transaction(messageBytes: Uint8Array, signatures: Uint8Array[]): Uint8Array {
  if (!messageBytes || messageBytes.length === 0) {
    throw new BuildTransactionError('messageBytes is required to serialize a v1 transaction');
  }
  if (!signatures || signatures.length === 0) {
    throw new BuildTransactionError('At least one signature is required to serialize a v1 transaction');
  }

  for (const signature of signatures) {
    if (signature.length !== SIGNATURE_BYTE_LENGTH) {
      throw new BuildTransactionError(
        `Invalid signature length: expected ${SIGNATURE_BYTE_LENGTH} bytes, got ${signature.length}`
      );
    }
  }

  if (messageBytes[0] !== V1_VERSION_PREFIX) {
    throw new BuildTransactionError(
      `Invalid v1 message: expected version prefix 0x${V1_VERSION_PREFIX.toString(
        16
      )}, got 0x${messageBytes[0].toString(16)}`
    );
  }

  if (messageBytes[1] !== signatures.length) {
    throw new BuildTransactionError(
      `Signature count mismatch: message declares ${messageBytes[1]} required signers but ${signatures.length} were provided`
    );
  }

  const totalLength = messageBytes.length + signatures.length * SIGNATURE_BYTE_LENGTH;
  if (totalLength > V1_TRANSACTION_SIZE_LIMIT) {
    throw new BuildTransactionError(
      `v1 transaction exceeds the ${V1_TRANSACTION_SIZE_LIMIT}-byte size limit: ${totalLength} bytes`
    );
  }

  const buffer = new Uint8Array(totalLength);
  buffer.set(messageBytes, 0);

  let offset = messageBytes.length;
  for (const signature of signatures) {
    buffer.set(signature, offset);
    offset += SIGNATURE_BYTE_LENGTH;
  }

  return buffer;
}
