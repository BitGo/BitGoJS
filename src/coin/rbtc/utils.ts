import { Utils, KeyPair } from '../eth';
import { TxData } from '../eth/iface';
import { testnetCommon, mainnetCommon } from './resources';

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  return Utils.signInternal(transactionData, keyPair, testnetCommon);
}
