// [signatures ...]

import { Stack } from '../../';
import { script as bscript } from '../../';
import { opcodes } from '../../';

function isPartialSignature(value: number | Buffer): boolean {
  return value === opcodes.OP_0 || bscript.isCanonicalSchnorrSignature(value as Buffer);
}

export function check(script: Buffer | Stack, allowIncomplete?: boolean): boolean {
  const chunks = bscript.decompile(script) as Stack;
  if (chunks.length < 1) return false;

  if (allowIncomplete) {
    // Don't match completely unsigned to avoid colliding with multisig
    return chunks.every(isPartialSignature) && chunks.some((chunk) => chunk !== opcodes.OP_0);
  }

  return (chunks as Buffer[]).every(bscript.isCanonicalSchnorrSignature);
}
check.toJSON = (): string => {
  return 'taproot n-of-n input';
};
