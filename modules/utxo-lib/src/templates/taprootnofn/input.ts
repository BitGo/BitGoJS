// [signatures ...]

import { Stack } from '../../payments';
import * as bscript from '../../script';
import { OPS } from '../../script';

function isPartialSignature(value: number | Buffer): boolean {
  return value === OPS.OP_0 || bscript.isCanonicalSchnorrSignature(value as Buffer);
}

export function check(script: Buffer | Stack, allowIncomplete?: boolean): boolean {
  const chunks = bscript.decompile(script) as Stack;
  if (chunks.length < 1) return false;

  if (allowIncomplete) {
    // Don't match completely unsigned to avoid colliding with multisig
    return chunks.every(isPartialSignature) && chunks.some((chunk) => chunk !== OPS.OP_0);
  }

  return (chunks as Buffer[]).every(bscript.isCanonicalSchnorrSignature);
}
check.toJSON = (): string => {
  return 'taproot n-of-n input';
};
