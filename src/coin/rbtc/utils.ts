import EthereumCommon from 'ethereumjs-common';
import { NetworkType } from '@bitgo/statics';
import { Utils, KeyPair } from '../eth';
import { TxData } from '../eth/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
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

const commons: Map<NetworkType, EthereumCommon> = new Map<NetworkType, EthereumCommon>([
  [NetworkType.MAINNET, mainnetCommon],
  [NetworkType.TESTNET, testnetCommon],
]);

/**
 * @param network
 */
export function getCommon(network: NetworkType): EthereumCommon {
  const common = commons.get(network);
  if (!common) {
    throw new InvalidTransactionError('Missing network common configuration');
  }
  return common;
}
