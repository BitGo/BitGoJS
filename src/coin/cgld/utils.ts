import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { addHexPrefix } from 'ethereumjs-util';
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
  const rawTransaction = await signTransaction(filterTx(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * Filters the unused fields of the tx to be used with @celo/contractkit
 *
 * @param {TxData} transactionData the transaction data unfiltered
 * @returns {TxData} the transaction data filtered with the available values
 */
function filterTx(transactionData: TxData): TxData {
  const filtered: TxData = {
    nonce: transactionData.nonce,
    data: transactionData.data,
    gasLimit: transactionData.gasLimit,
    gasPrice: transactionData.gasPrice,
    chainId: transactionData.chainId,
    value: transactionData.value,
  };
  if (transactionData.to && transactionData.to !== '0x') filtered.to = transactionData.to;

  return filtered;
}
