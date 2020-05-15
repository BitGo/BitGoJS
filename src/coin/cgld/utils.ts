import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { addHexPrefix } from 'ethereumjs-util';
import { RLP } from 'ethers/utils';
import BigNumber from 'bignumber.js';
import { TxData } from '../eth/iface';
import { KeyPair } from '../eth/keyPair';
import { SigningError } from '../baseCoin/errors';

/**
 * Signs a Celo transaction using celo contract kit
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
  const rawTransaction = await signTransaction(removeEmptyFields(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * removes the unused optional fields of the tx to be used with @celo/contractkit
 *
 * @param {TxData} transactionData the transaction data unfiltered
 * @returns {TxData} the transaction data filtered with the available values
 */
function removeEmptyFields(transactionData: TxData): TxData {
  const filtered: TxData = {
    nonce: transactionData.nonce,
    data: transactionData.data,
    gasLimit: transactionData.gasLimit,
    gasPrice: transactionData.gasPrice,
    chainId: transactionData.chainId,
    value: transactionData.value,
  };
  if (transactionData.to && transactionData.to !== '0x') {
    filtered.to = transactionData.to;
  }
  if (transactionData.from && transactionData.from !== '0x') {
    filtered.from = transactionData.from;
  }
  if (transactionData.r) {
    filtered.r = transactionData.r;
  }
  if (transactionData.s) {
    filtered.s = transactionData.s;
  }
  if (transactionData.v) {
    filtered.v = transactionData.v;
  }

  return filtered;
}

/**
 *
 * @param {string} serializedTx the serialized transaction
 * @returns {TxData} the deserialized transaction
 */
export function deserialize(serializedTx: string): TxData {
  const rawValues = RLP.decode(serializedTx);
  const celoTx: TxData = {
    nonce: rawValues[0].toLowerCase() === '0x' ? 0 : parseInt(rawValues[0], 16),
    gasPrice: rawValues[1].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[1], 16).toString(),
    gasLimit: rawValues[2].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[2], 16).toString(),
    value: rawValues[7].toLowerCase() === '0x' ? '0' : new BigNumber(rawValues[2], 16).toString(),
    data: rawValues[8],
    chainId: rawValues[9],
  };
  if (rawValues[6] !== '0x') celoTx.to = rawValues[6];
  return celoTx;
}
