/**
 * Concatenates multiple Uint8Array instances into a single Uint8Array
 * @param chunks - Array of Uint8Array instances to concatenate
 * @returns Concatenated Uint8Array
 */
export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const buffers = chunks.map((chunk) => Buffer.from(chunk));
  return new Uint8Array(Buffer.concat(buffers));
}
