import { Buffer } from 'buffer';
import {
  addHexPrefix,
  bufferToHex,
  generateAddress,
  isValidAddress,
  setLengthLeft,
  stripHexPrefix,
  toBuffer,
} from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import * as BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { BuildTransactionError, SigningError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import { LockMethodId, VoteMethodId } from '../cgld/stakingUtils';
import { SignatureParts, TxData } from './iface';
import { KeyPair } from './keyPair';
import {
  createForwarderMethodId,
  sendMultisigMethodId,
  sendMultisigTokenMethodId,
  sendMultiSigTokenTypes,
  sendMultiSigTypes,
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
  value: string,
  data: string,
  expireTime: number,
  sequenceId: number,
  signature: string,
): string {
  const params = [to, value, toBuffer(data), expireTime, sequenceId, toBuffer(signature)];
  const method = EthereumAbi.methodID('sendMultiSig', sendMultiSigTypes);
  const args = EthereumAbi.rawEncode(sendMultiSigTypes, params);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Returns the contract method encoded data
 *
 * @param {string} to destination address
 * @param {number} value Amount to tranfer
 * @param {string} tokenContractAddress the address of the erc20 token contract
 * @param {number} expireTime expiration time for the transaction in seconds
 * @param {number} sequenceId sequence id
 * @param {string} signature signature of the call
 * @returns {string} -- the contract method encoded data
 */
export function sendMultiSigTokenData(
  to: string,
  value: string,
  tokenContractAddress: string,
  expireTime: number,
  sequenceId: number,
  signature: string,
): string {
  const params = [to, value, tokenContractAddress, expireTime, sequenceId, toBuffer(signature)];
  const method = EthereumAbi.methodID('sendMultiSigToken', sendMultiSigTokenTypes);
  const args = EthereumAbi.rawEncode(sendMultiSigTokenTypes, params);
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
 * Returns whether or not the string is a valid amount number
 *
 * @param {string} amount - the string to validate
 * @returns {boolean} - the validation result
 */
export function isValidAmount(amount: string): boolean {
  const bigNumberAmount = new BigNumber(amount);
  return bigNumberAmount.isInteger() && bigNumberAmount.isGreaterThanOrEqualTo(0);
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

  // sometimes ethereumjs-abi removes 0 padding at the start of addresses,
  // so we should pad until they are the standard 20 bytes
  const paddedAddresses = addresses.map(address => stripHexPrefix(address.toString('hex')).padStart(40, '0'));

  return paddedAddresses.map(address => addHexPrefix(address));
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
  } else if (data.startsWith(sendMultisigMethodId) || data.startsWith(sendMultisigTokenMethodId)) {
    return TransactionType.Send;
  } else if (data.startsWith(LockMethodId)) {
    return TransactionType.StakingLock;
  } else if (data.startsWith(VoteMethodId)) {
    return TransactionType.StakingVote;
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
  const forwarderAddress = generateAddress(contractAddress, contractCounter);
  return addHexPrefix(forwarderAddress.toString('hex'));
}

/**
 * Convert the given signature parts to a string representation
 *
 * @param {SignatureParts} sig The signature to convert to string
 * @returns {string} String representation of the signature
 */
export function toStringSig(sig: SignatureParts): string {
  return bufferToHex(Buffer.concat([setLengthLeft(sig.r, 32), setLengthLeft(sig.s, 32), toBuffer(sig.v)]));
}

/**
 * Return whether or not the given tx data has a signature
 *
 * @param {TxData} txData The transaction data to check for signature
 * @returns {boolean} true if the tx has a signature, else false
 */
export function hasSignature(txData: TxData): boolean {
  return (
    txData.v !== undefined &&
    txData.r !== undefined &&
    txData.s !== undefined &&
    txData.v.length > 0 &&
    txData.r.length > 0 &&
    txData.s.length > 0
  );
}

/**
 * Get the raw data decoded for some types
 *
 * @param {string[]} types ABI types definition
 * @param {Buffer} serializedArgs encoded args
 * @returns {Buffer[]} the decoded raw
 */
export function getRawDecoded(types: string[], serializedArgs: Buffer): Buffer[] {
  return EthereumAbi.rawDecode(types, serializedArgs);
}

/**
 * Get the buffered bytecode from rawData using a methodId as delimiter
 *
 * @param {string} methodId the hex encoded method Id
 * @param {string} rawData the hex encoded raw data
 * @returns {Buffer} data buffered bytecode
 */
export function getBufferedByteCode(methodId: string, rawData: string): Buffer {
  const splitBytecode = rawData.split(methodId);
  if (splitBytecode.length !== 2) {
    throw new BuildTransactionError(`Invalid send bytecode: ${rawData}`);
  }
  return Buffer.from(splitBytecode[1], 'hex');
}
