import { isValidAddress, addHexPrefix } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import { SigningError } from '../baseCoin/errors';
import { TxJson } from './iface';
import { KeyPair } from './keyPair';
import { walletSimpleConstructor, walletSimpleByteCode } from './walletUtil';
import { testnetCommon } from './resources';
import { EthTransaction } from './types';

/**
 * Signs the transaction using the appropriate algorithm
 * and the provided common for the blockchain
 *
 * @param {TxJson} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @param {EthereumCommon} customCommon the network's custom common
 * @returns {string} the transaction signed and encoded
 */
export async function signInternal(
  transactionData: TxJson,
  keyPair: KeyPair,
  customCommon: EthereumCommon,
): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const ethTx = EthTransaction.fromJson(transactionData);
  const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
  ethTx.tx.sign(privateKey);
  const encodedTransaction = ethTx.tx.serialize().toString('hex');
  return addHexPrefix(encodedTransaction);
}

/**
 * Signs the transaction using the appropriate algorithm
 *
 * @param {TxJson} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxJson, keyPair: KeyPair): Promise<string> {
  return signInternal(transactionData, keyPair, testnetCommon);
}

/**
 * Returns the smart contract encoded data
 *
 * @param {string[]} addresses - the contract signers
 * @returns {string} - the smart contract encoded data
 */
export function getContractData(addresses: string[]): string {
  const params = [addresses];
  const resultEncodedParameters = EthereumAbi.rawEncode(walletSimpleConstructor, params)
    .toString('hex')
    .replace('0x', '');
  return walletSimpleByteCode + resultEncodedParameters;
}

/**
 * Returns whether or not the string is a valid Eth address
 *
 * @param {string} address - the tx hash to validate
 * @returns {boolean} - the validation result
 */
export function isValidEthAddress(address: string): boolean {
  return isValidAddress(address);
}
