import { Buffer } from 'buffer';
import assert from 'assert';
import {
  addHexPrefix,
  bufferToHex,
  bufferToInt,
  generateAddress,
  isValidAddress,
  setLengthLeft,
  stripHexPrefix,
  toBuffer,
} from 'ethereumjs-util';
import { coins, BaseCoin, Erc20Coin, CeloCoin, NetworkType, ContractAddressDefinedToken } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from 'ethereumjs-common';
import * as BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { BuildTransactionError, InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { TransactionType } from '../baseCoin';
import {
  LockMethodId,
  VoteMethodId,
  UnlockMethodId,
  ActivateMethodId,
  WithdrawMethodId,
  UnvoteMethodId,
} from '../celo/stakingUtils';
import { FlushTokensData, NativeTransferData, SignatureParts, TokenTransferData, TransferData, TxData } from './iface';
import { KeyPair } from './keyPair';
import {
  createForwarderMethodId,
  flushForwarderTokensMethodId,
  flushTokensTypes,
  sendMultisigMethodId,
  sendMultisigTokenMethodId,
  sendMultiSigTokenTypes,
  sendMultiSigTypes,
  walletInitializationFirstBytes,
  walletSimpleByteCode,
  walletSimpleConstructor,
} from './walletUtil';
import { testnetCommon, mainnetCommon } from './resources';
import { EthTransactionData } from './types';

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
  const ethTx = EthTransactionData.fromJson(transactionData, customCommon);
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
 * Get the data required to make a flush tokens contract call
 *
 * @param forwarderAddress The forwarder address to flush
 * @param tokenAddress The token address to flush from
 */
export function flushTokensData(forwarderAddress, tokenAddress): string {
  const params = [forwarderAddress, tokenAddress];
  const method = EthereumAbi.methodID('flushForwarderTokens', flushTokensTypes);
  const args = EthereumAbi.rawEncode(flushTokensTypes, params);
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
  if (!data.startsWith(walletInitializationFirstBytes)) {
    throw new BuildTransactionError(`Invalid wallet bytecode: ${data}`);
  }

  const dataBuffer = Buffer.from(data.slice(2), 'hex');

  // the last 160 bytes contain the serialized address array
  const serializedSigners = dataBuffer.slice(-160);

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
 * Decode the given ABI-encoded transfer data and return parsed fields
 *
 * @param data The data to decode
 * @returns parsed transfer data
 */
export function decodeTransferData(data: string): TransferData {
  if (data.startsWith(sendMultisigMethodId)) {
    return decodeNativeTransferData(data);
  } else if (data.startsWith(sendMultisigTokenMethodId)) {
    return decodeTokenTransferData(data);
  } else {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }
}

/**
 * Decode the given ABI-encoded transfer data for the sendMultisigToken function and return parsed fields
 *
 * @param data The data to decode
 * @returns parsed token transfer data
 */
export function decodeTokenTransferData(data: string): TokenTransferData {
  if (!data.startsWith(sendMultisigTokenMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [to, amount, tokenContractAddress, expireTime, sequenceId, signature] = getRawDecoded(
    sendMultiSigTokenTypes,
    getBufferedByteCode(sendMultisigTokenMethodId, data),
  );

  return {
    to: addHexPrefix(to),
    amount: new BigNumber(bufferToHex(amount)).toFixed(),
    expireTime: bufferToInt(expireTime),
    sequenceId: bufferToInt(sequenceId),
    signature: bufferToHex(signature),
    tokenContractAddress: addHexPrefix(tokenContractAddress),
  };
}

/**
 * Decode the given ABI-encoded transfer data for the sendMultisig function and return parsed fields
 *
 * @param data The data to decode
 * @returns parsed transfer data
 */
export function decodeNativeTransferData(data: string): NativeTransferData {
  if (!data.startsWith(sendMultisigMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [to, amount, internalData, expireTime, sequenceId, signature] = getRawDecoded(
    sendMultiSigTypes,
    getBufferedByteCode(sendMultisigMethodId, data),
  );

  return {
    to: addHexPrefix(to),
    amount: new BigNumber(bufferToHex(amount)).toFixed(),
    expireTime: bufferToInt(expireTime),
    sequenceId: bufferToInt(sequenceId),
    signature: bufferToHex(signature),
    data: bufferToHex(internalData),
  };
}

/**
 * Decode the given ABI-encoded flush tokens data and return parsed fields
 *
 * @param data The data to decode
 * @returns parsed transfer data
 */
export function decodeFlushTokensData(data: string): FlushTokensData {
  if (!data.startsWith(flushForwarderTokensMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [forwarderAddress, tokenAddress] = getRawDecoded(
    flushTokensTypes,
    getBufferedByteCode(flushForwarderTokensMethodId, data),
  );

  return {
    forwarderAddress: addHexPrefix(forwarderAddress),
    tokenAddress: addHexPrefix(tokenAddress),
  };
}

/**
 * Classify the given transaction data based as a transaction type.
 * ETH transactions are defined by the first 8 bytes of the transaction data, also known as the method id
 *
 * @param {string} data The data to classify the transaction with
 * @returns {TransactionType} The classified transaction type
 */
export function classifyTransaction(data: string): TransactionType {
  if (data.length < 10) {
    // contract calls must have at least 4 bytes (method id) and '0x'
    // if it doesn't have enough data to be a contract call it must be a single sig send
    return TransactionType.SingleSigSend;
  }

  const transactionType = transactionTypesMap[data.slice(0, 10).toLowerCase()];
  if (transactionType === undefined) {
    throw new BuildTransactionError(`Unrecognized transaction type: ${data}`);
  }

  return transactionType;
}

/**
 * A transaction types map according to the starting part of the encoded data
 */
const transactionTypesMap = {
  [walletInitializationFirstBytes]: TransactionType.WalletInitialization,
  [createForwarderMethodId]: TransactionType.AddressInitialization,
  [sendMultisigMethodId]: TransactionType.Send,
  [flushForwarderTokensMethodId]: TransactionType.FlushTokens,
  [sendMultisigTokenMethodId]: TransactionType.Send,
  [LockMethodId]: TransactionType.StakingLock,
  [VoteMethodId]: TransactionType.StakingVote,
  [ActivateMethodId]: TransactionType.StakingActivate,
  [UnvoteMethodId]: TransactionType.StakingUnvote,
  [UnlockMethodId]: TransactionType.StakingUnlock,
  [WithdrawMethodId]: TransactionType.StakingWithdraw,
};

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

/**
 * Get the statics coin object matching a given contract address if it exists
 *
 * @param tokenContractAddress The contract address to match against
 * @returns statics BaseCoin object for the matching token
 */
export function getToken(tokenContractAddress: string): Readonly<BaseCoin> | undefined {
  const tokens = coins.filter(coin => {
    if (coin instanceof ContractAddressDefinedToken) {
      return coin.contractAddress.toLowerCase() === tokenContractAddress.toLowerCase();
    }
    return false;
  });

  // if length of tokens is 1, return the first, else return undefined
  // Can't directly index into tokens, or call `length`, so we use map to get an array
  const tokensArray = tokens.map(token => token);
  if (tokensArray.length >= 1) {
    // there should never be two tokens with the same contract address, so we assert that here
    assert(tokensArray.length === 1);
    return tokensArray[0];
  }
  return undefined;
}
