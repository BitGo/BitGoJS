import * as utxolib from '@bitgo/utxo-lib';

export type TransactionObj = {
  id: string;
  hex: string;
  ins: {
    txid: string;
    index: number;
    scriptSig?: string;
    witness?: string[];
  }[];
  outs: {
    script: string;
    value: number;
  }[];
};

export function transactionToObj(tx: utxolib.bitgo.UtxoTransaction): TransactionObj {
  return {
    id: tx.getId(),
    hex: tx.toBuffer().toString('hex'),
    ins: tx.ins.map((v) => ({
      txid: Buffer.from(v.hash).reverse().toString('hex'),
      index: v.index,
      script: v.script?.toString('hex'),
      witness: v.witness?.map((v) => v.toString('hex')),
    })),
    outs: tx.outs.map((v) => ({
      script: v.script.toString('hex'),
      value: v.value,
    })),
  };
}

export function transactionHexToObj(txHex: string, network: utxolib.Network): TransactionObj {
  const obj = transactionToObj(utxolib.bitgo.createTransactionFromBuffer(Buffer.from(txHex, 'hex'), network));
  if (obj.hex !== txHex) {
    throw new Error(`serialized txHex does not match input`);
  }
  return obj;
}
