/* eslint-disable no-redeclare */
import { script, ScriptSignature, TxOutput } from 'bitcoinjs-lib';
import { isPlaceholderSignature, parseSignatureScript, UtxoTransaction } from '../../src/bitgo';
import { secp256k1 } from '@noble/curves/secp256k1';

const n = BigInt(secp256k1.CURVE.n);
const nDiv2 = n / BigInt(2);

function bytesToBigInt(bytes: Uint8Array): bigint {
  return BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
}

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

  let ss = bytesToBigInt(s);

  if (ss > nDiv2) {
    throw new Error(`signature already has high s value`);
  }

  // convert to high-S
  ss = n - ss;

  const newSig = ScriptSignature.encode(
    Buffer.concat([r, Buffer.from(ss.toString(16).padStart(64, '0'), 'hex')]),
    hashType
  );
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

/** Return transaction with script xored with 0xff for the given input */
export function getPrevOutsWithInvalidOutputScript<TNumber extends number | bigint>(
  prevOuts: TxOutput<TNumber>[],
  inputIndex: number
): TxOutput<TNumber>[] {
  return prevOuts.map((prevOut, i) => {
    return i === inputIndex
      ? {
          ...prevOut,
          script: prevOut.script.map((v) => v ^ 0xff) as typeof prevOut.script,
        }
      : prevOut;
  });
}
