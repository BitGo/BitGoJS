// OP_0 {pubKeyHash}

import { script as bscript } from '../../';
import { opcodes } from '../../';

export function check(script: Buffer | Array<number | Buffer>): boolean {
  const buffer = bscript.compile(script);

  return buffer.length === 22 && buffer[0] === opcodes.OP_0 && buffer[1] === 0x14;
}
check.toJSON = (): string => {
  return 'Witness pubKeyHash output';
};
