/* eslint-disable no-redeclare */
import { script, ScriptSignature } from 'bitcoinjs-lib';
import { isPlaceholderSignature, parseSignatureScript, UtxoTransaction } from '../../src/bitgo';

const BN = require('bn.js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');
const n = secp256k1.curve.n;
const nDiv2 = n.shrn(1);

function changeSignatureToHighS(signatureBuffer: Buffer): Buffer {
  if (!script.isCanonicalScriptSignature(signatureBuffer)) {
    throw new Error(`not canonical`);
  }
  const { signature, hashType } = ScriptSignature.decode(signatureBuffer);

  const r = signature.subarray(0, 32);
  const s = signature.subarray(32);

  if (r.length !== 32 || s.length !== 32) {
    throw new Error(`invalid scalar length`);
  }

  let ss = new BN(s);

  if (ss.cmp(nDiv2) > 0) {
    throw new Error(`signature already has high s value`);
  }

  // convert to high-S
  ss = n.sub(ss);

  const newSig = ScriptSignature.encode(Buffer.concat([r, ss.toArrayLike(Buffer, 'be', 32)]), hashType);
  if (!script.isCanonicalScriptSignature(newSig)) {
    throw new Error(`newSig not canonical`);
  }
  return newSig;
}

function changeSignatureScriptToHighS(script: Buffer, signature: Buffer): Buffer;
function changeSignatureScriptToHighS(witness: Buffer[], signature: Buffer): Buffer[];
function changeSignatureScriptToHighS(v: Buffer | Buffer[], signature: Buffer): Buffer | Buffer[] {
  const parts = Buffer.isBuffer(v) ? script.decompile(v) : v;
  if (!parts) {
    throw new Error(`could not decompile input`);
  }
  const newParts = parts.map((p) => {
    if (typeof p === 'number') {
      return p;
    }
    return p.equals(signature) ? changeSignatureToHighS(p) : Buffer.from(p);
  });
  return Buffer.isBuffer(v) ? script.compile(newParts) : (newParts as Buffer[]);
}

export function getTransactionWithHighS<TNumber extends number | bigint>(
  tx: UtxoTransaction<TNumber>,
  inputIndex: number
): UtxoTransaction<TNumber>[] {
  const parsed = parseSignatureScript(tx.ins[inputIndex]);
  switch (parsed.scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
      break;
    default:
      return [];
  }
  return parsed.signatures.flatMap((signature) => {
    if (isPlaceholderSignature(signature)) {
      return [];
    }
    const cloned = tx.clone();
    cloned.ins[inputIndex].script = changeSignatureScriptToHighS(cloned.ins[inputIndex].script, signature);
    cloned.ins[inputIndex].witness = changeSignatureScriptToHighS(cloned.ins[inputIndex].witness, signature);
    if (parseSignatureScript(cloned.ins[inputIndex]).scriptType !== parsed.scriptType) {
      throw new Error(`could not parse modified input`);
    }
    return [cloned];
  });
}
