// {pubKey} OP_CHECKSIG

import { Stack } from '../../';
import { script as bscript } from '../../';
import { opcodes } from '../../';

export function check(script: Buffer | Stack): boolean {
  const chunks = bscript.decompile(script) as Stack;

  return chunks.length === 2 && bscript.isCanonicalPubKey(chunks[0] as Buffer) && chunks[1] === opcodes.OP_CHECKSIG;
}
check.toJSON = (): string => {
  return 'pubKey output';
};
