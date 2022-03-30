// m [pubKeys ...] n OP_CHECKMULTISIG

import { Stack } from '../../'
import { script as bscript } from '../../'
import { opcodes } from '../../'
const { Number } = require('typeforce');
const OP_INT_BASE = opcodes.OP_RESERVED; // OP_1 - 1

export function check(
  script: Buffer | Stack,
  allowIncomplete?: boolean,
): boolean {
  const chunks = bscript.decompile(script) as Stack;

  if (chunks.length < 4) return false;
  if (chunks[chunks.length - 1] !== opcodes.OP_CHECKMULTISIG) return false;
  if (!Number(chunks[0])) return false;
  if (!Number(chunks[chunks.length - 2])) return false;
  const m = (chunks[0] as number) - OP_INT_BASE;
  const n = (chunks[chunks.length - 2] as number) - OP_INT_BASE;

  if (m <= 0) return false;
  if (n > 16) return false;
  if (m > n) return false;
  if (n !== chunks.length - 3) return false;
  if (allowIncomplete) return true;

  const keys = chunks.slice(1, -2) as Buffer[];
  return keys.every(bscript.isCanonicalPubKey);
}
check.toJSON = (): string => {
  return 'multi-sig output';
};
