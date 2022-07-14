import { NetworkType } from '@bitgo/statics';
import { isValidAddress, isValidPrivate, isValidPublic } from 'ethereumjs-util';
import EthereumCommon from '@ethereumjs/common';
import { Utils, KeyPair, TxData } from '@bitgo/sdk-coin-eth';
import { InvalidTransactionError } from '@bitgo/sdk-core';
import { testnetCommon, mainnetCommon } from './resources';

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<any> {
  return Utils.signInternal(transactionData, keyPair, testnetCommon);
}

const commons: Map<NetworkType, EthereumCommon> = new Map<NetworkType, EthereumCommon>([
  [NetworkType.MAINNET, mainnetCommon],
  [NetworkType.TESTNET, testnetCommon],
]);

/**
 * @param {NetworkType} network either mainnet or testnet
 * @returns {EthereumCommon} Ethereum common configuration object
 */
export function getCommon(network: NetworkType): EthereumCommon {
  const common = commons.get(network);
  if (!common) {
    throw new InvalidTransactionError('Missing network common configuration');
  }
  return common;
}

/**
 * Returns whether or not the string is a valid C-Chain address in Eth format
 *
 * @param {string} address - the address string
 * @returns {boolean} - the validation result
 */
export function isValidEthAddress(address: string): boolean {
  return isValidAddress(address);
}

/**
 * Returns whether or not the string is a valid C-Chain private key in Eth format
 *
 * @param {string} privateKey - the string formatted key
 * @returns {boolean} - the validation result
 */
export function isValidEthPrivateKey(privateKey: string): boolean {
  if (privateKey.length !== 64) {
    return false;
  }
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');

  if (privateKeyBuffer.length !== 32) {
    return false;
  }
  return isValidPrivate(privateKeyBuffer);
}

/**
 * Returns whether or not the string is a valid C-Chain public key in Eth format
 *
 * @param {string} publicKey - the uncompressed public key string
 * @returns {boolean} - the validation result
 */
export function isValidEthPublicKey(publicKey: string): boolean {
  // Uncompressed Eth Public Keys have a 04 prefix that needs to be removed in order to validate it.
  const publicKeyWithoutPrefix = publicKey.slice(2);
  const publicKeyBuffer = Buffer.from(publicKeyWithoutPrefix, 'hex');
  return isValidPublic(publicKeyBuffer);
}
