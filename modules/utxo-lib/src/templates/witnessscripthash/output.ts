// OP_0 {scriptHash}

import { script as bscript } from '../../';
import { opcodes } from '../../';

export function check(script: Buffer | Array<number | Buffer>): boolean {
  const buffer = bscript.compile(script);

  return buffer.length === 34 && buffer[0] === opcodes.OP_0 && buffer[1] === 0x20;
}
check.toJSON = (): string => {
  return 'Witness scriptHash output';
};
