// OP_HASH160 {scriptHash} OP_EQUAL

import { script as bscript } from '../../';
import { opcodes } from '../../';

export function check(script: Buffer | Array<number | Buffer>): boolean {
  const buffer = bscript.compile(script);

  return (
    buffer.length === 23 && buffer[0] === opcodes.OP_HASH160 && buffer[1] === 0x14 && buffer[22] === opcodes.OP_EQUAL
  );
}
check.toJSON = (): string => {
  return 'scriptHash output';
};
