import { signTransaction } from '@celo/contractkit/lib/utils/signing-utils';
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
  const privateKey = '0x' + (keyPair.getKeys().prv as string);
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
    nonce: '0x' + Number(transactionData.nonce).toString(16),
    data: transactionData.data,
    gasLimit: '0x' + Number(transactionData.gasLimit).toString(16),
    gasPrice: '0x' + Number(transactionData.gasPrice).toString(16),
    chainId: '0x' + Number(transactionData.chainId).toString(16),
  };
}
