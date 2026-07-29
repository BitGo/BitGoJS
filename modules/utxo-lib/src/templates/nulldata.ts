// OP_RETURN {data}
import { script as bscript } from '../';
import { opcodes } from '../';

export function check(script: Buffer | Array<number | Buffer>): boolean {
  const buffer = bscript.compile(script);

  return buffer.length > 1 && buffer[0] === opcodes.OP_RETURN;
}
check.toJSON = (): string => {
  return 'null data output';
};

const output = { check };

export { output };
