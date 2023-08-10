import * as utxolib from '@bitgo/utxo-lib';
import { BitGoBase, IRequestTracer, Triple } from '@bitgo/sdk-core';
import {
  AbstractUtxoCoin,
  ExplainTransactionOptions,
  Output,
  TransactionExplanation,
  TransactionPrebuild,
} from './abstractUtxoCoin';
import { bip32, BIP32Interface, bitgo } from '@bitgo/utxo-lib';

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

function explainCommon<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: ExplainTransactionOptions<TNumber>,
  network: utxolib.Network
) {
  const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'];
  let spendAmount = BigInt(0);
  let changeAmount = BigInt(0);
  const changeOutputs: Output[] = [];
  const outputs: Output[] = [];

  const { changeAddresses = [] } = params.txInfo ?? {};

  tx.outs.forEach((currentOutput) => {
    const currentAddress = utxolib.address.fromOutputScript(currentOutput.script, network);
    const currentAmount = BigInt(currentOutput.value);

    if (changeAddresses.includes(currentAddress)) {
      // this is change
      changeAmount += currentAmount;
      changeOutputs.push({
        address: currentAddress,
        amount: currentAmount.toString(),
      });
      return;
    }

    spendAmount += currentAmount;
    outputs.push({
      address: currentAddress,
      amount: currentAmount.toString(),
    });
  });

  const outputDetails = {
    outputAmount: spendAmount.toString(),
    changeAmount: changeAmount.toString(),
    outputs,
    changeOutputs,
  };

  let fee: string | undefined;
  let locktime: number | undefined;

  if (params.feeInfo) {
    displayOrder.push('fee');
    fee = params.feeInfo;
  }

  if (Number.isInteger(tx.locktime) && tx.locktime > 0) {
    displayOrder.push('locktime');
    locktime = tx.locktime;
  }

  return { displayOrder, id: tx.getId(), ...outputDetails, fee, locktime };
}

function getRootWalletKeys<TNumber extends number | bigint>(params: ExplainTransactionOptions<TNumber>) {
  const keys = params.pubs?.map((xpub) => bip32.fromBase58(xpub));
  return keys && keys.length === 3 ? new bitgo.RootWalletKeys(keys as Triple<BIP32Interface>) : undefined;
}

function getPsbtInputSignaturesCount<TNumber extends number | bigint>(
  psbt: bitgo.UtxoPsbt,
  params: ExplainTransactionOptions<TNumber>
) {
  const rootWalletKeys = getRootWalletKeys(params);
  return rootWalletKeys
    ? bitgo.getSignatureValidationArrayPsbt(psbt, rootWalletKeys).map((sv) => sv[1].filter((v) => v).length)
    : (Array(psbt.data.inputs.length) as number[]).fill(0);
}

function getTxInputSignaturesCount<TNumber extends number | bigint>(
  tx: bitgo.UtxoTransaction<TNumber>,
  params: ExplainTransactionOptions<TNumber>,
  network: utxolib.Network
) {
  const prevOutputs = params.txInfo?.unspents?.map((u) => bitgo.toOutput<TNumber>(u, network));
  const rootWalletKeys = getRootWalletKeys(params);
  const { unspents = [] } = params.txInfo ?? {};

  // get the number of signatures per input
  return tx.ins.map((input, idx): number => {
    if (unspents.length !== tx.ins.length) {
      return 0;
    }
    if (!prevOutputs) {
      throw new Error(`invalid state`);
    }
    if (!rootWalletKeys) {
      // no pub keys or incorrect number of pub keys
      return 0;
    }
    try {
      return bitgo.verifySignatureWithUnspent<TNumber>(tx, idx, unspents, rootWalletKeys).filter((v) => v).length;
    } catch (e) {
      // some other error occurred and we can't validate the signatures
      return 0;
    }
  });
}

/**
 * Decompose a raw psbt into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainPsbt<TNumber extends number | bigint>(
  params: ExplainTransactionOptions<TNumber>,
  network: utxolib.Network
): TransactionExplanation {
  const { txHex } = params;
  let psbt: bitgo.UtxoPsbt;
  try {
    psbt = bitgo.createPsbtFromHex(txHex, network);
  } catch (e) {
    throw new Error('failed to parse psbt hex');
  }
  const tx = psbt.getUnsignedTx() as bitgo.UtxoTransaction<TNumber>;
  const common = explainCommon(tx, params, network);
  const inputSignaturesCount = getPsbtInputSignaturesCount(psbt, params);

  // Set fee from subtracting inputs from outputs
  const outputAmount = psbt.txOutputs.reduce((cumulative, curr) => cumulative + BigInt(curr.value), BigInt(0));
  const inputAmount = psbt.txInputs.reduce((cumulative, txInput, i) => {
    const data = psbt.data.inputs[i];
    if (data.witnessUtxo) {
      return cumulative + BigInt(data.witnessUtxo.value);
    } else if (data.nonWitnessUtxo) {
      const tx = bitgo.createTransactionFromBuffer<bigint>(data.nonWitnessUtxo, network, { amountType: 'bigint' });
      return cumulative + BigInt(tx.outs[txInput.index].value);
    } else {
      throw new Error('could not find value on input');
    }
  }, BigInt(0));

  return {
    ...common,
    fee: (inputAmount - outputAmount).toString(),
    inputSignatures: inputSignaturesCount,
    signatures: inputSignaturesCount.reduce((prev, curr) => (curr > prev ? curr : prev), 0),
  } as TransactionExplanation;
}

/**
 * Decompose a raw transaction into useful information, such as the total amounts,
 * change amounts, and transaction outputs.
 */
export function explainTx<TNumber extends number | bigint>(
  params: ExplainTransactionOptions<TNumber>,
  coin: AbstractUtxoCoin
): TransactionExplanation {
  const { txHex } = params;
  let tx;
  try {
    tx = coin.createTransactionFromHex(txHex);
  } catch (e) {
    throw new Error('failed to parse transaction hex');
  }
  const common = explainCommon(tx, params, coin.network);
  const inputSignaturesCount = getTxInputSignaturesCount(tx, params, coin.network);
  return {
    ...common,
    inputSignatures: inputSignaturesCount,
    signatures: inputSignaturesCount.reduce((prev, curr) => (curr > prev ? curr : prev), 0),
  } as TransactionExplanation;
}
