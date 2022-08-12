// [pubKeys[0:n-1] OP_CHECKSIGVERIFY] pubKeys[n-1] OP_CHECKSIG

import { Stack } from '../../payments';
import * as schnorrBip340 from '../../schnorrBip340';
import * as bscript from '../../script';
import { OPS } from '../../script';

export function check(
  script: Buffer | Stack,
  allowIncomplete?: boolean,
): boolean {
  const chunks = bscript.decompile(script) as Stack;

  if (chunks.length < 3) return false;
  const ops = chunks.filter((_, index) => index % 2 === 1);
  if (ops[ops.length - 1] !== OPS.OP_CHECKSIG) return false;
  if (!ops.slice(0, -1).every(op => op === OPS.OP_CHECKSIGVERIFY)) return false;

  if (chunks.length / 2 > 16) return false;
  if (allowIncomplete) return true;

  const keys = chunks.filter((_, index) => index % 2 === 0) as Buffer[];
  return keys.every(schnorrBip340.isXOnlyPoint);
}
check.toJSON = (): string => {
  return 'taproot n-of-n output';
};
