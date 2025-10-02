"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uint8ArrayToHex = exports.reverseBuffer = void 0;
/**
 * Reverses the order of bytes in a buffer.
 * @param buffer - The buffer to reverse.
 * @returns A new buffer with the bytes reversed.
 */
const reverseBuffer = (buffer) => {
    const clonedBuffer = new Uint8Array(buffer);
    if (clonedBuffer.length < 1)
        return clonedBuffer;
    for (let i = 0, j = clonedBuffer.length - 1; i < clonedBuffer.length / 2; i++, j--) {
        let tmp = clonedBuffer[i];
        clonedBuffer[i] = clonedBuffer[j];
        clonedBuffer[j] = tmp;
    }
    return clonedBuffer;
};
exports.reverseBuffer = reverseBuffer;
/**
 * Converts a Uint8Array to a hexadecimal string.
 * @param uint8Array - The Uint8Array to convert.
 * @returns The hexadecimal string.
 */
const uint8ArrayToHex = (uint8Array) => {
    return Array.from(uint8Array)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};
exports.uint8ArrayToHex = uint8ArrayToHex;
