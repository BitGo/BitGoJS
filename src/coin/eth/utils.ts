import { Buffer } from 'buffer';
import { isValidAddress, addHexPrefix, toBuffer } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './iface';
import { KeyPair } from './keyPair';
import { walletSimpleConstructor, walletSimpleByteCode } from './walletUtil';
import { testnetCommon } from './resources';
import { EthTransaction } from './types';

/**
 * Signs the transaction using the appropriate algorithm
 * and the provided common for the blockchain
 *
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @param {EthereumCommon} customCommon the network's custom common
 * @returns {string} the transaction signed and encoded
 */
export async function signInternal(
  transactionData: TxData,
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
 * @param {TxData} transactionData the transaction data to sign
 * @param {KeyPair} keyPair the signer's keypair
 * @returns {string} the transaction signed and encoded
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
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
 * Returns the contract method encoded data
 *
 * @param {string} to destination address
 * @param {number} value Amount to tranfer
 * @param {string} data aditional method call data
 * @param {number} expireTime expiration time for the transaction in seconds
 * @param {number} sequenceId sequence id
 * @param {string} signature signature of the call
 * @returns {string} -- the contract method encoded data
 */
export function sendMultiSigData(
  to: string,
  value: number,
  data: string,
  expireTime: number,
  sequenceId: number,
  signature: string,
): string {
  const params = [to, value, toBuffer(data), expireTime, sequenceId, toBuffer(signature)];
  const types = ['address', 'uint', 'bytes', 'uint', 'uint', 'bytes'];
  const method = EthereumAbi.methodID('sendMultiSig', types);
  const args = EthereumAbi.rawEncode(types, params);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
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
