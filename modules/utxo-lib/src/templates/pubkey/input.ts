// {signature}

import { Stack } from '../../';
import { script as bscript } from '../../';

export function check(script: Buffer | Stack): boolean {
  const chunks = bscript.decompile(script) as Stack;

  return chunks.length === 1 && bscript.isCanonicalScriptSignature(chunks[0] as Buffer);
}
check.toJSON = (): string => {
  return 'pubKey input';
};
