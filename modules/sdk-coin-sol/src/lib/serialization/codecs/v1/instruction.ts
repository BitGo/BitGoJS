/**
 * v1 (SIMD-0296/0385) transaction instruction codec: header + payload encoding.
 */

export type CompiledInstruction = {
  programAddressIndex: number;
  accountIndices: number[];
  data: Uint8Array;
};

function pushU8(buf: number[], v: number) {
  buf.push(v & 0xff);
}
function pushU16LE(buf: number[], v: number) {
  buf.push(v & 0xff, (v >>> 8) & 0xff);
}

/**
 * Encode instruction headers (4 bytes each) then payloads for the given
 * compiled instructions, appending to `buf`.
 */
export function encodeInstructions(buf: number[], instructions: CompiledInstruction[]): void {
  for (const instruction of instructions) {
    pushU8(buf, instruction.programAddressIndex);
    pushU8(buf, instruction.accountIndices.length);
    pushU16LE(buf, instruction.data.length);
  }
  for (const instruction of instructions) {
    for (const idx of instruction.accountIndices) {
      pushU8(buf, idx);
    }
    for (const b of instruction.data) {
      pushU8(buf, b);
    }
  }
}
