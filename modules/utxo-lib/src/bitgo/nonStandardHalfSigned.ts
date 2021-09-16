/**
 * @prettier
 */
import * as opcodes from 'bitcoin-ops';
import * as bscript from '../script';

import { Input } from './signature';

/**
 * @param input - Input of non-standard half-signed transaction created with `tx.build()` instead of `tx.buildIncomplete()`.
 * @param signatureIndex - Position to map the existing signatures to. Other signatures will be padded with OP_0.
 */
export function padInputScript(input: Input, signatureIndex: number): void {
  if (![0, 1, 2].includes(signatureIndex)) {
    throw new Error(`invalid signature index: must be one of [0, 1, 2]`);
  }

  let decompiledSigScript;
  if (input.witness && input.witness.length > 0) {
    decompiledSigScript = input.witness;
  } else {
    decompiledSigScript = bscript.decompile(input.script);
  }

  // The shape of a non-standard half-signed input is
  //   OP_0 <signature> <p2ms>
  if (decompiledSigScript.length !== 3) {
    return;
  }

  const [op0, signatureBuffer, sigScript] = decompiledSigScript;
  if (op0 !== opcodes.OP_0 && !(Buffer.isBuffer(op0) && op0.length === 0)) {
    return;
  }

  if (bscript.classifyOutput(sigScript) !== bscript.types.MULTISIG) {
    return;
  }

  const paddedSigScript = [
    op0,
    ...[0, 1, 2].map((i) => (i === signatureIndex ? signatureBuffer : Buffer.from([]))),
    sigScript,
  ];

  if (input.witness.length) {
    input.witness = paddedSigScript;
  } else {
    // @ts-ignore: bscript uses an odd "Buffer" type (per jsdoc)
    input.script = bscript.compile(paddedSigScript);
  }
}
