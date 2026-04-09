/**
 * Reverses the order of bytes in a buffer.
 * @param buffer - The buffer to reverse.
 * @returns A new buffer with the bytes reversed.
 */
export const reverseBuffer = (buffer: Uint8Array): Uint8Array => {
  const clonedBuffer = new Uint8Array(buffer);
  if (clonedBuffer.length < 1) return clonedBuffer;
  for (let i = 0, j = clonedBuffer.length - 1; i < clonedBuffer.length / 2; i++, j--) {
    let tmp = clonedBuffer[i];
    clonedBuffer[i] = clonedBuffer[j];
    clonedBuffer[j] = tmp;
  }
  return clonedBuffer;
};

/**
 * Converts a Uint8Array to a hexadecimal string.
 * @param uint8Array - The Uint8Array to convert.
 * @returns The hexadecimal string.
 */
export const uint8ArrayToHex = (uint8Array: Uint8Array): string => {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
