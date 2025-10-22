import { decode } from 'cbor-x';
import { DeserializedMessage, KeyShareReadable, SerializedMessage } from './types';

/**
 * Concatenates multiple Uint8Array instances into a single Uint8Array
 * @param chunks - Array of Uint8Array instances to concatenate
 * @returns Concatenated Uint8Array
 */
export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  // Convert Uint8Array to Buffer for concatenation, then back to Uint8Array
  const buffers = chunks.map((chunk) => Buffer.from(chunk));
  return new Uint8Array(Buffer.concat(buffers));
}

/**
 * Fetches and formats material from key shares
 * @param shares - Array of Buffer containing key share data
 * @returns Array of formatted share material
 */
export function fetchMaterial(shares: Buffer[]) {
  return shares.map((share) => {
    const material = decode(share) as unknown as KeyShareReadable;
    return {
      threshold: material.threshold,
      total_parties: material.total_parties,
      party_id: material.party_id,
      d_i: Buffer.from(material.d_i).toString('hex'),
      public_key: Buffer.from(material.public_key).toString('hex'),
      key_id: Buffer.from(material.key_id).toString('hex'),
      root_chain_code: Buffer.from(material.root_chain_code).toString('hex'),
      final_session_id: Buffer.from(material.final_session_id).toString('hex'),
    };
  });
}

/**
 * Serializes messages payloads to base64 strings.
 * @param messages
 */
export function serializeMessages(messages: DeserializedMessage[]): SerializedMessage[] {
  return messages.map((message) => ({
    from: message.from,
    payload: Buffer.from(message.payload).toString('base64'),
  }));
}

/**
 * Deserialize messages payloads to Uint8Array.
 * @param messages
 */
export function deserializeMessages(messages: SerializedMessage[]): DeserializedMessage[] {
  return messages.map((message) => ({
    from: message.from,
    payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
  }));
}
