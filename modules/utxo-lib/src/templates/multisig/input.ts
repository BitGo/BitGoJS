// OP_0 [signatures ...]

import { Stack } from '../../';
import { script as bscript } from '../../';
import { opcodes } from '../../';

function partialSignature(value: number | Buffer): boolean {
  return value === opcodes.OP_0 || bscript.isCanonicalScriptSignature(value as Buffer);
}

export function check(script: Buffer | Stack, allowIncomplete?: boolean): boolean {
  const chunks = bscript.decompile(script) as Stack;
  if (chunks.length < 2) return false;
  if (chunks[0] !== opcodes.OP_0) return false;

  if (allowIncomplete) {
    return chunks.slice(1).every(partialSignature);
  }

  return (chunks.slice(1) as Buffer[]).every(bscript.isCanonicalScriptSignature);
}
check.toJSON = (): string => {
  return 'multisig input';
};
