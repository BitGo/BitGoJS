import { Buffer } from 'buffer';
import { isValidAddress, addHexPrefix, toBuffer } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import * as BN from 'bn.js';
import { SigningError, BuildTransactionError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { TxData } from './iface';
import { KeyPair } from './keyPair';
import {
  walletSimpleConstructor,
  walletSimpleByteCode,
  createForwarderMethodId,
  sendMultisigMethodId,
} from './walletUtil';
import { testnetCommon } from './resources';
import { EthTransactionData } from './types';

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
  const ethTx = EthTransactionData.fromJson(transactionData);
  ethTx.sign(keyPair);
  return ethTx.toSerialized();
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

/**
 * Returns the smart contract encoded data
 *
 * @param {string} data The wallet creation data to decode
 * @returns {string[]} - The list of signer addresses
 */
export function decodeWalletCreationData(data: string): string[] {
  if (!data.startsWith(walletSimpleByteCode)) {
    throw new BuildTransactionError(`Invalid wallet bytecode: ${data}`);
  }

  const splitBytecode = data.split(walletSimpleByteCode);
  if (splitBytecode.length !== 2) {
    throw new BuildTransactionError(`Invalid wallet bytecode: ${data}`);
  }

  const serializedSigners = Buffer.from(splitBytecode[1], 'hex');

  const resultEncodedParameters = EthereumAbi.rawDecode(walletSimpleConstructor, serializedSigners);
  if (resultEncodedParameters.length !== 1) {
    throw new BuildTransactionError(`Could not decode wallet constructor bytecode: ${resultEncodedParameters}`);
  }

  const addresses: BN[] = resultEncodedParameters[0];
  if (addresses.length !== 3) {
    throw new BuildTransactionError(`invalid number of addresses in parsed constructor: ${addresses}`);
  }

  return addresses.map(address => addHexPrefix(address.toString('hex')));
}

/**
 * Classify the given transaction data based as a transaction type.
 * ETH transactions are defined by the first 8 bytes of the transaction data, also known as the method id
 *
 * @param {string} data The data to classify the transactino with
 * @returns {TransactionType} The classified transaction type
 */
export function classifyTransaction(data: string): TransactionType {
  if (data.startsWith(walletSimpleByteCode)) {
    return TransactionType.WalletInitialization;
  } else if (data.startsWith(createForwarderMethodId)) {
    return TransactionType.AddressInitialization;
  } else if (data.startsWith(sendMultisigMethodId)) {
    return TransactionType.Send;
  } else {
    throw new BuildTransactionError(`Unrecognized transaction type: ${data}`);
  }
}

/**
 *
 * @param {number} num number to be converted to hex
 * @returns {string} the hex number
 */
export function numberToHexString(num: number): string {
  const hex = num.toString(16);
  return hex.length % 2 === 0 ? '0x' + hex : '0x0' + hex;
}

/**
 *
 * @param {string} hex The hex string to be converted
 * @returns {number} the resulting number
 */
export function hexStringToNumber(hex: string): number {
  return parseInt(hex.slice(2), 16);
}
