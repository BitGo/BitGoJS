import { promises as fs } from 'fs';
import * as utxolib from '@bitgo/utxo-lib';
import { HttpClient } from '@bitgo/blockapis';
import { fetchPrevTx } from './fetch';
import { getParserTxProperties, ParserTx } from './ParserTx';

function getOutfile(tx: ParserTx, format: string): string {
  const { id } = getParserTxProperties(tx, undefined);
  const suffix = format === 'psbt' ? 'psbt' : 'hex';
  return `${id}.${suffix}`;
}

async function legacyToPsbt(httpClient: HttpClient, tx: utxolib.bitgo.UtxoTransaction<bigint>) {
  const prevTxs = await fetchPrevTx(httpClient, tx);
  const prevOutputs = tx.ins.map((input, i): utxolib.bitgo.PrevOutput<bigint> => {
    const { txid, vout } = utxolib.bitgo.getOutputIdForInput(input);
    const prevTx = prevTxs[i];
    const prevTxParsed = utxolib.bitgo.createTransactionFromBuffer(prevTxs[i], tx.network, { amountType: 'bigint' });
    const { script, value } = prevTxParsed.outs[vout];
    return { txid, vout, script, value, prevTx };
  });

  return utxolib.bitgo.createPsbtFromTransaction(tx, prevOutputs);
}

export async function convertTransaction(
  tx: ParserTx,
  params: {
    httpClient: HttpClient;
    format: 'legacy' | 'psbt';
    outfile?: string;
  }
): Promise<void> {
  const { format } = params;

  switch (format) {
    case 'legacy':
      if (tx instanceof utxolib.bitgo.UtxoTransaction) {
        throw new Error(`input is already in legacy format`);
      }
      if (tx instanceof utxolib.bitgo.UtxoPsbt) {
        throw new Error(`TODO`);
      }

      throw new Error(`unknown tx type`);
    case 'psbt':
      if (tx instanceof utxolib.bitgo.UtxoPsbt) {
        throw new Error(`input is already in psbt format`);
      }

      if (tx instanceof utxolib.bitgo.UtxoTransaction) {
        const psbt = await legacyToPsbt(params.httpClient, tx);
        const { outfile = getOutfile(tx, format) } = params;
        await fs.writeFile(outfile, psbt.toBase64());
        console.log(`wrote ${outfile}`);
        return;
      }

      throw new Error(`unknown tx type`);
  }
}
