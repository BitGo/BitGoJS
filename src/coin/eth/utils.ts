import { Buffer } from 'buffer';
import {
	addHexPrefix,
	bufferToHex,
	bufferToInt,
	fromRpcSig,
	generateAddress,
	isValidAddress,
	setLengthLeft,
	toBuffer,
} from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import * as BN from 'bn.js';
import { BuildTransactionError, SigningError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { SignatureParts, TxData } from './iface';
import { KeyPair } from './keyPair';
import {
	createForwarderMethodId,
	sendMultisigMethodId,
	walletSimpleByteCode,
	walletSimpleConstructor,
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
 * Returns the create forwarder method calling data
 *
 * @returns {string} - the createForwarder method encoded
 */
export function getAddressInitializationData(): string {
  return createForwarderMethodId;
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

/**
 * Generates an address of the forwarder address to be deployed
 *
 * @param {string} contractAddress the address which is creating this new address
 * @param {number} contractCounter the nonce of the contract address
 * @returns {string} the calculated forwarder contract address
 */
export function calculateForwarderAddress(contractAddress: string, contractCounter: number): string {
  const forwarderAddress = generateAddress(contractAddress, addHexPrefix(contractCounter.toString(16)));
  return addHexPrefix(forwarderAddress.toString('hex'));
}


/**
 * Convert the given signature parts to a string representation
 *
 * @param sig The signature to convert to string
 */
export function toStringSig(sig: SignatureParts): string {
	return bufferToHex(Buffer.concat([setLengthLeft(sig.r, 32), setLengthLeft(sig.s, 32), toBuffer(sig.v)]));
}

/**
 * Convert the given signature parts to a string representation
 *
 * @param sig The signature to convert to string
 */
export function fromStringSig(sig: string): SignatureParts {
	const { v, r, s } = fromRpcSig(sig);
	return {
		v: bufferToHex(v),
		r: bufferToHex(r),
		s: bufferToHex(s),
	};
}

/**
 * Return whether or not the given tx data has a signature
 * @param txData The transaction data to check for signature
 * @return true if the tx has a signature, else false
 */
export function hasSignature(txData: TxData): boolean {
return txData.v !== undefined && txData.r !== undefined && txData.s !== undefined
    && txData.v.length > 0 && txData.r.length > 0 && txData.s.length > 0;
}
