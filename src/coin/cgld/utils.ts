import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
import { addHexPrefix } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { TxJson } from '../eth/iface';
import { KeyPair } from '../eth/keyPair';
import { SigningError } from '../baseCoin/errors';
import { TxData as CeloTxData } from './iface';

/**
 * Signs a Celo transaction using celo contract kit
 *
 * @param {TxJson} transactionData json the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxJson, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const privateKey = addHexPrefix(keyPair.getKeys().prv as string);
  const rawTransaction = await signTransaction(formatTx(transactionData), privateKey);
  return rawTransaction.raw;
}

/**
 * Format transaction to be signed
 *
 * @param {TxJson} transactionData the transaction data with base values
 * @returns {CeloTxData} the transaction data with hex values, ready for CELO signing library
 */
function formatTx(transactionData: TxJson): CeloTxData {
  return {
    nonce: addHexPrefix(Number(transactionData.nonce).toString(16)),
    data: transactionData.data,
    gasLimit: addHexPrefix(Number(transactionData.gasLimit).toString(16)),
    gasPrice: addHexPrefix(new BigNumber(transactionData.gasPrice as string).toString(16)),
    chainId: addHexPrefix(Number(transactionData.chainId).toString(16)),
  };
}
