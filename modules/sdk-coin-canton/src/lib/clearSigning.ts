import { MessageStandardType } from '@bitgo/sdk-core';
import { PreparedTransaction } from '../../resources/proto/preparedTransaction.js';
import utils from './utils';

/**
 * Clear signing and payload-type detection for Canton message signing requests.
 *
 * The Canton Signing Driver receives raw `tx` bytes and a `txHash` from the
 * Canton Gateway's signTransaction() call. It does not know whether `tx` is a
 * Daml prepared transaction or a topology transaction. This module owns that
 * detection, keeping Canton-specific proto knowledge inside sdk-coin-canton.
 *
 * Usage in wallet-platform (buildUnsignedMsgWithIntent):
 *   1. Call detectCantonSigningPayloadType(tx) → MessageStandardType
 *   2. Use that type as messageStandardType in the msgrequest
 *   3. In getHsmPayload, key off the type to choose Format 1 vs Format 2
 */

export interface DecodedCantonTransaction {
  /** 'CreateCommand' or 'ExerciseCommand' */
  kind: string;
  /** Fully-qualified Daml template identifier */
  templateId: {
    packageId: string;
    moduleName: string;
    entityName: string;
  };
  /** Decoded Daml arguments (create arguments or choice arguments) */
  argument: unknown;
  /** Choice name — present for ExerciseCommand only */
  choice?: string;
  /** Contract ID being exercised — present for ExerciseCommand only */
  contractId?: string;
  /** Parties acting on this command — present for ExerciseCommand only */
  actingParties?: string[];
}

/**
 * Detect whether a Canton `tx` payload (base64) is a Daml prepared transaction
 * or a topology transaction, by attempting to parse as PreparedTransaction proto.
 *
 * - PreparedTransaction → has `transaction.nodes` populated → CANTON_SIGN_TRANSACTION
 * - Topology bytes     → parsing fails or nodes empty      → CANTON_SIGN_TOPOLOGY
 *
 * wallet-platform calls this on the raw `tx` bytes from the Canton Gateway to
 * determine which MessageStandardType to use and which HSM payload format to apply.
 *
 * @param txBase64 - base64-encoded `tx` bytes from Canton's signTransaction request
 * @returns The appropriate MessageStandardType for this payload
 */
export function detectCantonSigningPayloadType(txBase64: string): MessageStandardType {
  try {
    const bytes = Buffer.from(txBase64, 'base64');
    const decoded = PreparedTransaction.fromBinary(bytes);
    if (decoded.transaction && Array.isArray(decoded.transaction.nodes) && decoded.transaction.nodes.length > 0) {
      return MessageStandardType.CANTON_SIGN_TRANSACTION;
    }
  } catch {
    // bytes did not parse as a PreparedTransaction proto
  }
  return MessageStandardType.CANTON_SIGN_TOPOLOGY;
}

/**
 * Decode a Canton prepared transaction into a human-readable structure
 * suitable for storage as a clearSigningPayload on the txRequest message.
 *
 * Only meaningful when detectCantonSigningPayloadType() returns CANTON_SIGN_TRANSACTION.
 * For topology transactions, there is no Daml command structure to decode.
 *
 * @param preparedTransactionBase64 - base64-encoded protobuf bytes from the Canton signTransaction request
 * @returns Decoded command info describing the Daml operation being signed
 */
export function decodePreparedTransaction(preparedTransactionBase64: string): DecodedCantonTransaction {
  // Single parse: extractCantonCommandInfo internally calls PreparedTransaction.fromBinary.
  // Any failure (topology bytes, random bytes, missing transaction body) is caught here and
  // surfaced as a descriptive error rather than letting an internal proto exception escape.
  try {
    const info = utils.extractCantonCommandInfo(preparedTransactionBase64);
    return {
      kind: info.kind,
      templateId: info.templateId,
      argument: info.argument,
      ...(info.choice !== undefined && { choice: info.choice }),
      ...(info.contractId !== undefined && { contractId: info.contractId }),
      ...(info.actingParties !== undefined && { actingParties: info.actingParties }),
    };
  } catch {
    throw new Error(
      'decodePreparedTransaction: payload is not a Daml PreparedTransaction — call detectCantonSigningPayloadType() first'
    );
  }
}
