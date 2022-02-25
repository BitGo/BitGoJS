// OP_DUP OP_HASH160 {pubKeyHash} OP_EQUALVERIFY OP_CHECKSIG

import { script as bscript } from '../../';
import { opcodes } from '../../';

export function check(script: Buffer | Array<number | Buffer>): boolean {
  const buffer = bscript.compile(script);

  return (
    buffer.length === 25 &&
    buffer[0] === opcodes.OP_DUP &&
    buffer[1] === opcodes.OP_HASH160 &&
    buffer[2] === 0x14 &&
    buffer[23] === opcodes.OP_EQUALVERIFY &&
    buffer[24] === opcodes.OP_CHECKSIG
  );
}
check.toJSON = (): string => {
  return 'pubKeyHash output';
};
