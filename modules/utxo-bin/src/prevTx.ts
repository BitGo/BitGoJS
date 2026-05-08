import * as utxolib from '@bitgo/utxo-lib';
import { ParserTx } from './ParserTx';

function getPrevOutForOutpoint(outpoint: utxolib.bitgo.TxOutPoint, prevTx: ParserTx) {
  if (prevTx instanceof utxolib.bitgo.UtxoTransaction) {
    const hash = prevTx.getId();
    if (hash !== outpoint.txid) {
      return undefined;
    }
    const out = prevTx.outs[outpoint.vout];
    if (!out) {
      throw new Error(`vout ${outpoint.vout} not found in prevTx ${hash}`);
    }
    return out;
  }

  if (prevTx instanceof utxolib.bitgo.UtxoPsbt) {
    throw new Error(`not implemented for Psbt yet`);
  }

  throw new Error(`unknown tx type`);
}

export function getPrevOutputsFromPrevTxs(tx: ParserTx, prevTxs: ParserTx[]): utxolib.TxOutput<bigint>[] | undefined {
  if (prevTxs.length === 0) {
    return undefined;
  }
  if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    const outpoints = tx.ins.map((i) => utxolib.bitgo.getOutputIdForInput(i));
    return outpoints.map((o) => {
      const matches = prevTxs.flatMap((t) => getPrevOutForOutpoint(o, t));
      if (matches.length === 0) {
        throw new Error(`no prevTx found for input ${o.txid}:${o.vout}`);
      }
      if (matches.length > 1) {
        throw new Error(`more than one prevTx found for input ${o.txid}:${o.vout}`);
      }
      return matches[0] as utxolib.TxOutput<bigint>;
    });
  }

  if (tx instanceof utxolib.bitgo.UtxoPsbt) {
    throw new Error(`not implemented for Psbt yet`);
  }

  throw new Error(`unknown tx type`);
}
