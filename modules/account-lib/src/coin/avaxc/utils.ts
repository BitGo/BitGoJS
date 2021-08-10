import { NetworkType } from '@bitgo/statics';
import { KeyPair } from '../eth';
import { TxData } from '../eth/iface';

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<any> {
  // TODO
}

/**
 * @param network
 */
export function getCommon(network: NetworkType): any {
  // TODO
}

// TODO: add walletSimpleByteCode
export const walletSimpleByteCode = '';
