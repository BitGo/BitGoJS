/**
 * @prettier
 */
import * as assert from 'assert';
import * as opcodes from 'bitcoin-ops';
import { classify, script as bscript, TxInput } from '../';

/**
 * @param input - Input of non-standard half-signed transaction created with `tx.build()` instead of `tx.buildIncomplete()`.
 * @param signatureIndex - Position to map the existing signatures to. Other signatures will be padded with OP_0.
 */
export function padInputScript(input: TxInput, signatureIndex: number): void {
  if (![0, 1, 2].includes(signatureIndex)) {
    throw new Error(`invalid signature index: must be one of [0, 1, 2]`);
  }

  // We only use `txb.build()` on certain legacy v1 SDKs.
  // Since native segwit was never enabled in v1 we do not have to worry about p2wsh inputs
  // and can focus on p2sh and p2shP2wsh.
  if (!input.script) {
    throw new Error(`native segwit not supported`);
  }

  const inputClassification = classify.input(input.script, true);
  const decompiledSigScript = input.witness.length ? input.witness : bscript.decompile(input.script);
  if (!decompiledSigScript) {
    throw new Error(`could not parse input script`);
  }
  const expectedScriptType =
    inputClassification === classify.types.P2SH || inputClassification === classify.types.P2WSH;

  if (!expectedScriptType) {
    return;
  }

  // The shape of a non-standard half-signed input is
  //   OP_0 <signature> <p2ms>
  if (decompiledSigScript.length !== 3) {
    return;
  }

  const [op0, signatureBuffer, sigScript] = decompiledSigScript;

  if (op0 !== opcodes.OP_0 && !(Buffer.isBuffer(op0) && op0.length === 0)) {
    throw new Error(`unexpected instruction`);
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
