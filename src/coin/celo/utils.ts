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
  console.log('CELO SIGN');
  const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
  const rawTransaction = await signTransaction(formatTx(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * Format transaction to be signed
 *
 * @param {TxData} transactionData the transaction data with base values
 * @returns {TxData} the transaction data with hex values
 */
function formatTx(transactionData: TxData): TxData {
  return {
    nonce: addHexPrefix(Number(transactionData.nonce).toString(16)),
    data: transactionData.data,
    gasLimit: addHexPrefix(Number(transactionData.gasLimit).toString(16)),
    gasPrice: addHexPrefix(Number(transactionData.gasPrice).toString(16)),
    chainId: addHexPrefix(Number(transactionData.chainId).toString(16)),
  };
}
