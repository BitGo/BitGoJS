import * as utxolib from '@bitgo/utxo-lib';
import { BitGoBase, IRequestTracer } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, TransactionPrebuild } from '../abstractUtxoCoin';

/**
 * Get the inputs for a psbt from a prebuild.
 */
export function getPsbtTxInputs(
  psbtArg: string | utxolib.bitgo.UtxoPsbt,
  network: utxolib.Network
): { address: string; value: bigint; valueString: string }[] {
  const psbt = psbtArg instanceof utxolib.bitgo.UtxoPsbt ? psbtArg : utxolib.bitgo.createPsbtFromHex(psbtArg, network);
  const txInputs = psbt.txInputs;
  return psbt.data.inputs.map((input, index) => {
    let address: string;
    let value: bigint;
    if (input.witnessUtxo) {
      address = utxolib.address.fromOutputScript(input.witnessUtxo.script, network);
      value = input.witnessUtxo.value;
    } else if (input.nonWitnessUtxo) {
      const tx = utxolib.bitgo.createTransactionFromBuffer<bigint>(input.nonWitnessUtxo, network, {
        amountType: 'bigint',
      });
      const txId = (Buffer.from(txInputs[index].hash).reverse() as Buffer).toString('hex');
      if (tx.getId() !== txId) {
        throw new Error('input transaction hex does not match id');
      }
      const prevTxOutputIndex = txInputs[index].index;
      address = utxolib.address.fromOutputScript(tx.outs[prevTxOutputIndex].script, network);
      value = tx.outs[prevTxOutputIndex].value;
    } else {
      throw new Error('psbt input is missing both witnessUtxo and nonWitnessUtxo');
    }
    return { address, value, valueString: value.toString() };
  });
}

/**
 * Get the inputs for a transaction from a prebuild.
 */
export async function getTxInputs<TNumber extends number | bigint>(params: {
  txPrebuild: TransactionPrebuild<TNumber>;
  bitgo: BitGoBase;
  coin: AbstractUtxoCoin;
  disableNetworking: boolean;
  reqId?: IRequestTracer;
}): Promise<{ address: string; value: TNumber; valueString: string }[]> {
  const { txPrebuild, bitgo, coin, disableNetworking, reqId } = params;
  if (!txPrebuild.txHex) {
    throw new Error(`txPrebuild.txHex not set`);
  }
  const transaction = coin.createTransactionFromHex<TNumber>(txPrebuild.txHex);
  const transactionCache = {};
  return await Promise.all(
    transaction.ins.map(async (currentInput): Promise<{ address: string; value: TNumber; valueString: string }> => {
      const transactionId = (Buffer.from(currentInput.hash).reverse() as Buffer).toString('hex');
      const txHex = txPrebuild.txInfo?.txHexes?.[transactionId];
      if (txHex) {
        const localTx = coin.createTransactionFromHex<TNumber>(txHex);
        if (localTx.getId() !== transactionId) {
          throw new Error('input transaction hex does not match id');
        }
        const currentOutput = localTx.outs[currentInput.index];
        const address = utxolib.address.fromOutputScript(currentOutput.script, coin.network);
        return {
          address,
          value: currentOutput.value,
          valueString: currentOutput.value.toString(),
        };
      } else if (!transactionCache[transactionId]) {
        if (disableNetworking) {
          throw new Error('attempting to retrieve transaction details externally with networking disabled');
        }
        if (reqId) {
          bitgo.setRequestTracer(reqId);
        }
        transactionCache[transactionId] = await bitgo.get(coin.url(`/public/tx/${transactionId}`)).result();
      }
      const transactionDetails = transactionCache[transactionId];
      return transactionDetails.outputs[currentInput.index];
    })
  );
}
