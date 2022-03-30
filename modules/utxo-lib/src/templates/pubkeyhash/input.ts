// {signature} {pubKey}

import { Stack } from '../../';
import { script as bscript } from '../../';

export function check(script: Buffer | Stack): boolean {
  const chunks = bscript.decompile(script) as Stack;

  return (
    chunks.length === 2 &&
    bscript.isCanonicalScriptSignature(chunks[0] as Buffer) &&
    bscript.isCanonicalPubKey(chunks[1] as Buffer)
  );
}
check.toJSON = (): string => {
  return 'pubKeyHash input';
};
