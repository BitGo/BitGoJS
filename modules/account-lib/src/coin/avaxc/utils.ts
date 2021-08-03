import { NetworkType } from '@bitgo/statics';
import { isValidAddress, isValidPrivate, isValidPublic } from 'ethereumjs-util';
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
 * @param {NetworkType} network either mainnet or testnet
 */
export function getCommon(network: NetworkType): any {
  // TODO
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
  const privateKeyBuffer = Buffer.from(privateKey, 'hex');
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

// TODO: add walletSimpleByteCode
export const walletSimpleByteCode = '';
