import { script } from 'bitcoinjs-lib';
import * as utxolib from '@bitgo/utxo-lib';

function dropSignature(script: Buffer, signature: Buffer, placeholder: 0): Buffer;
// eslint-disable-next-line no-redeclare
function dropSignature(witness: Buffer[], signature: Buffer, placeholder: Buffer): Buffer[];
// eslint-disable-next-line no-redeclare
function dropSignature(v: Buffer | Buffer[], signature: Buffer, placeholder: Buffer | 0): Buffer | Buffer[] {
  const parts = Buffer.isBuffer(v) ? script.decompile(v) : v;
  if (!parts) {
    throw new Error(`could not decompile input`);
  }
  const newParts = parts.map((p) => {
    if (typeof p === 'number') {
      return p;
    }
    return p.equals(signature) ? placeholder : Buffer.from(p);
  });
  return Buffer.isBuffer(v) ? script.compile(newParts as Buffer[]) : (newParts as Buffer[]);
}

export function dropSignatureForInput<TNumber extends number | bigint>(
  tx: utxolib.bitgo.UtxoTransaction<TNumber>,
  inputIndex: number,
  signatureIndex: number
): void {
  const parsed = utxolib.bitgo.parseSignatureScript(tx.ins[inputIndex]);
  switch (parsed.scriptType) {
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
      break;
    default:
      return;
  }
  const sig = parsed.signatures[signatureIndex];
  if (!sig) {
    throw new Error();
  }
  tx.ins[inputIndex].script = dropSignature(tx.ins[inputIndex].script, sig, 0);
  tx.ins[inputIndex].witness = dropSignature(tx.ins[inputIndex].witness, sig, Buffer.of());
  if (utxolib.bitgo.parseSignatureScript(tx.ins[inputIndex]).scriptType !== parsed.scriptType) {
    throw new Error(`could not parse modified input`);
  }
}
