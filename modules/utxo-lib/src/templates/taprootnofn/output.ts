// [pubKeys[0:n-1] OP_CHECKSIGVERIFY] pubKeys[n-1] OP_CHECKSIG

import { Stack } from '../../';
import { script as bscript } from '../../';
import { opcodes } from '../../';
import { ecc } from '../../noble_ecc';

export function check(script: Buffer | Stack, allowIncomplete?: boolean): boolean {
  const chunks = bscript.decompile(script) as Stack;

  if (chunks.length < 3) return false;
  const ops = chunks.filter((_, index) => index % 2 === 1);
  if (ops[ops.length - 1] !== opcodes.OP_CHECKSIG) return false;
  if (!ops.slice(0, -1).every((op) => op === opcodes.OP_CHECKSIGVERIFY)) return false;

  if (chunks.length / 2 > 16) return false;
  if (allowIncomplete) return true;

  const keys = chunks.filter((_, index) => index % 2 === 0) as Buffer[];
  return keys.every(ecc.isXOnlyPoint);
}
check.toJSON = (): string => {
  return 'taproot n-of-n output';
};
