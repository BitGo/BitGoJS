import { Utils, KeyPair } from '../eth';
import { TxJson } from '../eth/iface';
import { testnetCommon, mainnetCommon } from './resources';

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxJson} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxJson, keyPair: KeyPair): Promise<string> {
  return Utils.signInternal(transactionData, keyPair, testnetCommon);
}
