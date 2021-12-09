import * as assert from 'assert';
import * as opcodes from 'bitcoin-ops';
import { classify, script as bscript, TxInput } from '../';

/**
 * @param input - Input of non-standard half-signed transaction created with `tx.build()` instead of `tx.buildIncomplete()`.
 * @param signatureIndex - Position to map the existing signatures to. Other signatures will be padded with OP_0.
 */
export function padInputScript(input: TxInput, signatureIndex: number): void {
  if (![0, 1, 2].includes(signatureIndex)) {
    /* istanbul ignore next */
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
  if (!decompiledSigScript || decompiledSigScript.length !== 3) {
    /* istanbul ignore next */
    return;
  }

  const [op0, signatureBuffer, sigScript] = decompiledSigScript;
  if (op0 !== opcodes.OP_0 && !(Buffer.isBuffer(op0) && op0.length === 0)) {
    /* istanbul ignore next */
    return;
  }

  if (!Buffer.isBuffer(sigScript)) {
    /* istanbul ignore next */
    return;
  }

  if (classify.output(sigScript) !== classify.types.P2MS) {
    /* istanbul ignore next */
    return;
  }

  const paddedSigScript = [
    op0,
    ...[0, 1, 2].map((i) => (i === signatureIndex ? signatureBuffer : Buffer.from([]))),
    sigScript,
  ];

  if (input.witness.length) {
    paddedSigScript.forEach((b) => assert(Buffer.isBuffer(b)));
    input.witness = paddedSigScript as Buffer[];
  } else {
    input.script = bscript.compile(paddedSigScript);
  }
}
