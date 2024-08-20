import { Buffer } from 'buffer';
import request from 'superagent';
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
  generateAddress2,
  padToEven,
} from 'ethereumjs-util';
import { BaseCoin, BaseNetwork, coins, ContractAddressDefinedToken, EthereumNetwork } from '@bitgo/statics';
import EthereumAbi from 'ethereumjs-abi';
import EthereumCommon from '@ethereumjs/common';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  ActivateMethodId,
  BuildTransactionError,
  LockMethodId,
  SigningError,
  TransactionType,
  UnlockMethodId,
  UnvoteMethodId,
  VoteMethodId,
  WithdrawMethodId,
} from '@bitgo/sdk-core';

import {
  ERC1155TransferData,
  ERC721TransferData,
  FlushTokensData,
  NativeTransferData,
  SignatureParts,
  TokenTransferData,
  TransferData,
  TxData,
  WalletInitializationData,
  ForwarderInitializationData,
} from './iface';
import { KeyPair } from './keyPair';
import {
  createForwarderMethodId,
  ERC1155BatchTransferTypeMethodId,
  ERC1155BatchTransferTypes,
  ERC1155SafeTransferTypeMethodId,
  ERC1155SafeTransferTypes,
  ERC721SafeTransferTypeMethodId,
  ERC721SafeTransferTypes,
  flushCoinsMethodId,
  flushCoinsTypes,
  flushForwarderTokensMethodId,
  flushTokensTypes,
  sendMultisigMethodId,
  sendMultisigTokenMethodId,
  sendMultiSigTokenTypes,
  sendMultiSigTypes,
  walletInitializationFirstBytes,
  v1CreateForwarderMethodId,
  walletSimpleConstructor,
  createV1WalletTypes,
  v1CreateWalletMethodId,
  createV1ForwarderTypes,
  recoveryWalletInitializationFirstBytes,
  defaultForwarderVersion,
  createV4ForwarderTypes,
  v4CreateForwarderMethodId,
  flushTokensTypesv4,
  flushForwarderTokensMethodIdV4,
} from './walletUtil';
import { EthTransactionData } from './types';

/**
 * @param network
 */
export function getCommon(network: EthereumNetwork): EthereumCommon {
  return EthereumCommon.forCustomChain(
    // use the mainnet config as a base, override chain ids and network name
    'mainnet',
    {
      name: network.type,
      networkId: network.chainId,
      chainId: network.chainId,
    },
    'london'
  );
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
  customCommon: EthereumCommon
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
  return signInternal(transactionData, keyPair, getCommon(coins.get('teth').network as EthereumNetwork));
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
  signature: string
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
  signature: string
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
export function flushTokensData(forwarderAddress: string, tokenAddress: string, forwarderVersion: number): string {
  let params: string[];
  let method: Uint8Array;
  let args: Uint8Array;

  if (forwarderVersion >= 4) {
    params = [tokenAddress];
    method = EthereumAbi.methodID('flushTokens', flushTokensTypesv4);
    args = EthereumAbi.rawEncode(flushTokensTypesv4, params);
  } else {
    params = [forwarderAddress, tokenAddress];
    method = EthereumAbi.methodID('flushForwarderTokens', flushTokensTypes);
    args = EthereumAbi.rawEncode(flushTokensTypes, params);
  }
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Get the data required to make a flush native coins contract call
 */
export function flushCoinsData(): string {
  const params = [];
  const method = EthereumAbi.methodID('flush', flushCoinsTypes);
  const args = EthereumAbi.rawEncode(flushCoinsTypes, params);
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
export function decodeWalletCreationData(data: string): WalletInitializationData {
  if (!(data.startsWith(walletInitializationFirstBytes) || data.startsWith(v1CreateWalletMethodId))) {
    throw new BuildTransactionError(`Invalid wallet bytecode: ${data}`);
  }

  if (data.startsWith(walletInitializationFirstBytes)) {
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
    const paddedAddresses = addresses.map((address) => stripHexPrefix(address.toString('hex')).padStart(40, '0'));

    return { owners: paddedAddresses.map((address) => addHexPrefix(address)) };
  } else {
    const decodedDataForWalletCreation = getRawDecoded(
      createV1WalletTypes,
      getBufferedByteCode(v1CreateWalletMethodId, data)
    );
    const addresses = decodedDataForWalletCreation[0] as string[];
    const saltBuffer = decodedDataForWalletCreation[1];
    const salt = bufferToHex(saltBuffer as Buffer);
    const paddedAddresses = addresses.map((address) => stripHexPrefix(address.toString()).padStart(40, '0'));
    const owners = paddedAddresses.map((address) => addHexPrefix(address));
    return {
      owners,
      salt,
    };
  }
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
    getBufferedByteCode(sendMultisigTokenMethodId, data)
  );

  return {
    to: addHexPrefix(to as string),
    amount: new BigNumber(bufferToHex(amount as Buffer)).toFixed(),
    expireTime: bufferToInt(expireTime as Buffer),
    sequenceId: bufferToInt(sequenceId as Buffer),
    signature: bufferToHex(signature as Buffer),
    tokenContractAddress: addHexPrefix(tokenContractAddress as string),
  };
}

export function decodeERC721TransferData(data: string): ERC721TransferData {
  if (!data.startsWith(sendMultisigMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [to, amount, internalData, expireTime, sequenceId, signature] = getRawDecoded(
    sendMultiSigTypes,
    getBufferedByteCode(sendMultisigMethodId, data)
  );

  const internalDataHex = bufferToHex(internalData as Buffer);
  if (!internalDataHex.startsWith(ERC721SafeTransferTypeMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [from, receiver, tokenId, userSentData] = getRawDecoded(
    ERC721SafeTransferTypes,
    getBufferedByteCode(ERC721SafeTransferTypeMethodId, internalDataHex)
  );

  return {
    to: addHexPrefix(receiver as string),
    from: addHexPrefix(from as string),
    expireTime: bufferToInt(expireTime as Buffer),
    amount: new BigNumber(bufferToHex(amount as Buffer)).toFixed(),
    tokenId: new BigNumber(bufferToHex(tokenId as Buffer)).toFixed(),
    sequenceId: bufferToInt(sequenceId as Buffer),
    signature: bufferToHex(signature as Buffer),
    tokenContractAddress: addHexPrefix(to as string),
    userData: bufferToHex(userSentData as Buffer),
  };
}

export function decodeERC1155TransferData(data: string): ERC1155TransferData {
  let from, receiver, userSentData;
  let tokenIds: string[];
  let values: string[];

  if (!data.startsWith(sendMultisigMethodId)) {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  const [to, amount, internalData, expireTime, sequenceId, signature] = getRawDecoded(
    sendMultiSigTypes,
    getBufferedByteCode(sendMultisigMethodId, data)
  );

  const internalDataHex = bufferToHex(internalData as Buffer);
  if (internalDataHex.startsWith(ERC1155SafeTransferTypeMethodId)) {
    let tokenId;
    let value;

    [from, receiver, tokenId, value, userSentData] = getRawDecoded(
      ERC1155SafeTransferTypes,
      getBufferedByteCode(ERC1155SafeTransferTypeMethodId, internalDataHex)
    );

    tokenIds = [new BigNumber(bufferToHex(tokenId)).toFixed()];
    values = [new BigNumber(bufferToHex(value)).toFixed()];
  } else if (bufferToHex(internalData as Buffer).startsWith(ERC1155BatchTransferTypeMethodId)) {
    let tempTokenIds, tempValues;
    [from, receiver, tempTokenIds, tempValues, userSentData] = getRawDecoded(
      ERC1155BatchTransferTypes,
      getBufferedByteCode(ERC1155BatchTransferTypeMethodId, internalDataHex)
    );
    tokenIds = tempTokenIds.map((x) => new BigNumber(bufferToHex(x)).toFixed());
    values = tempValues.map((x) => new BigNumber(bufferToHex(x)).toFixed());
  } else {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }

  return {
    to: addHexPrefix(receiver),
    from: addHexPrefix(from),
    expireTime: bufferToInt(expireTime as Buffer),
    amount: new BigNumber(bufferToHex(amount as Buffer)).toFixed(),
    tokenIds,
    values,
    sequenceId: bufferToInt(sequenceId as Buffer),
    signature: bufferToHex(signature as Buffer),
    tokenContractAddress: addHexPrefix(to as string),
    userData: userSentData,
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
    getBufferedByteCode(sendMultisigMethodId, data)
  );

  return {
    to: addHexPrefix(to as string),
    amount: new BigNumber(bufferToHex(amount as Buffer)).toFixed(),
    expireTime: bufferToInt(expireTime as Buffer),
    sequenceId: bufferToInt(sequenceId as Buffer),
    signature: bufferToHex(signature as Buffer),
    data: bufferToHex(internalData as Buffer),
  };
}

/**
 * Decode the given ABI-encoded flush tokens data and return parsed fields
 *
 * @param data The data to decode
 * @param to Optional to parameter of tx
 * @returns parsed transfer data
 */
export function decodeFlushTokensData(data: string, to?: string): FlushTokensData {
  if (data.startsWith(flushForwarderTokensMethodId)) {
    const [forwarderAddress, tokenAddress] = getRawDecoded(
      flushTokensTypes,
      getBufferedByteCode(flushForwarderTokensMethodId, data)
    );
    return {
      forwarderAddress: addHexPrefix(forwarderAddress as string),
      tokenAddress: addHexPrefix(tokenAddress as string),
    };
  } else if (data.startsWith(flushForwarderTokensMethodIdV4)) {
    const [tokenAddress] = getRawDecoded(flushTokensTypesv4, getBufferedByteCode(flushForwarderTokensMethodIdV4, data));
    if (!to) {
      throw new BuildTransactionError(`Missing to address: ${to}`);
    }
    return {
      forwarderAddress: to,
      tokenAddress: addHexPrefix(tokenAddress as string),
      forwarderVersion: 4,
    };
  } else {
    throw new BuildTransactionError(`Invalid transfer bytecode: ${data}`);
  }
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

  // TODO(STLX-1970): validate if we are going to constraint to some methods allowed
  let transactionType = transactionTypesMap[data.slice(0, 10).toLowerCase()];
  if (transactionType === undefined) {
    transactionType = TransactionType.ContractCall;
  }

  return transactionType;
}

/**
 * A transaction types map according to the starting part of the encoded data
 */
const transactionTypesMap = {
  [walletInitializationFirstBytes]: TransactionType.WalletInitialization,
  [recoveryWalletInitializationFirstBytes]: TransactionType.RecoveryWalletDeployment,
  [v1CreateWalletMethodId]: TransactionType.WalletInitialization,
  [createForwarderMethodId]: TransactionType.AddressInitialization,
  [v1CreateForwarderMethodId]: TransactionType.AddressInitialization,
  [v4CreateForwarderMethodId]: TransactionType.AddressInitialization,
  [sendMultisigMethodId]: TransactionType.Send,
  [flushForwarderTokensMethodId]: TransactionType.FlushTokens,
  [flushForwarderTokensMethodIdV4]: TransactionType.FlushTokens,
  [flushCoinsMethodId]: TransactionType.FlushCoins,
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
  const forwarderAddress = generateAddress(
    Buffer.from(stripHexPrefix(contractAddress), 'hex'),
    Buffer.from(padToEven(stripHexPrefix(numberToHexString(contractCounter))), 'hex')
  );
  return addHexPrefix(forwarderAddress.toString('hex'));
}

/**
 * Calculate the forwarder v1 address that will be generated if `creatorAddress` creates it with salt `salt`
 * and initcode `inicode using the create2 opcode
 * @param {string} creatorAddress The address that is sending the tx to create a new address, hex string
 * @param {string} salt The salt to create the address with using create2, hex string
 * @param {string} initcode The initcode that will be deployed to the address, hex string
 * @return {string} The calculated address
 */
export function calculateForwarderV1Address(creatorAddress: string, salt: string, initcode: string): string {
  const forwarderV1Address = generateAddress2(
    Buffer.from(stripHexPrefix(creatorAddress), 'hex'),
    Buffer.from(stripHexPrefix(salt), 'hex'),
    Buffer.from(padToEven(stripHexPrefix(initcode)), 'hex')
  );
  return addHexPrefix(forwarderV1Address.toString('hex'));
}

/**
 * Take the implementation address for the proxy contract, and get the binary initcode for the associated proxy
 * @param {string} implementationAddress The address of the implementation contract for the proxy
 * @return {string} Binary hex string of the proxy
 */
export function getProxyInitcode(implementationAddress: string): string {
  const target = stripHexPrefix(implementationAddress.toLowerCase()).padStart(40, '0');

  // bytecode of the proxy, from:
  // https://github.com/BitGo/eth-multisig-v4/blob/d546a937f90f93e83b3423a5bf933d1d77c677c3/contracts/CloneFactory.sol#L42-L56
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${target}5af43d82803e903d91602b57fd5bf3`;
}

/**
 * Convert the given signature parts to a string representation
 *
 * @param {SignatureParts} sig The signature to convert to string
 * @returns {string} String representation of the signature
 */
export function toStringSig(sig: SignatureParts): string {
  return bufferToHex(
    Buffer.concat([
      setLengthLeft(Buffer.from(stripHexPrefix(sig.r), 'hex'), 32),
      setLengthLeft(Buffer.from(stripHexPrefix(sig.s), 'hex'), 32),
      toBuffer(sig.v),
    ])
  );
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

type RecursiveBufferOrString = string | Buffer | BN | RecursiveBufferOrString[];

/**
 * Get the raw data decoded for some types
 *
 * @param {string[]} types ABI types definition
 * @param {Buffer} serializedArgs encoded args
 * @returns {Buffer[]} the decoded raw
 */
export function getRawDecoded(types: string[], serializedArgs: Buffer): RecursiveBufferOrString[] {
  function normalize(v: unknown, i: number): unknown {
    if (BN.isBN(v)) {
      return v;
    } else if (typeof v === 'string' || Buffer.isBuffer(v)) {
      return v;
    } else if (Array.isArray(v)) {
      return v.map(normalize);
    } else {
      throw new Error(`For ${types}[${i}] got ${typeof v}`);
    }
  }

  return EthereumAbi.rawDecode(types, serializedArgs).map(normalize);
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
  if (splitBytecode[1].length % 2 !== 0) {
    throw new BuildTransactionError(`Invalid send bytecode: ${rawData} (wrong lenght)`);
  }
  return Buffer.from(splitBytecode[1], 'hex');
}

/**
 * Get the statics coin object matching a given contract address if it exists
 *
 * @param tokenContractAddress The contract address to match against
 * @param network - the coin network
 * @param family - the coin family
 * @returns statics BaseCoin object for the matching token
 */
export function getToken(
  tokenContractAddress: string,
  network: BaseNetwork,
  family: string
): Readonly<BaseCoin> | undefined {
  // filter the coins array to find the token with the matching contract address, network and coin family
  // coin family is needed to avoid causing issues when a token has same contract address on two different chains
  const tokens = coins.filter((coin) => {
    if (coin instanceof ContractAddressDefinedToken) {
      return (
        coin.network.type === network.type &&
        coin.family === family &&
        coin.contractAddress.toLowerCase() === tokenContractAddress.toLowerCase()
      );
    }
    return false;
  });

  // if length of tokens is 1, return the first, else return undefined
  // Can't directly index into tokens, or call `length`, so we use map to get an array
  const tokensArray = tokens.map((token) => token);
  if (tokensArray.length >= 1) {
    // there should never be two tokens with the same contract address, so we assert that here
    assert(tokensArray.length === 1);
    return tokensArray[0];
  }
  return undefined;
}

/**
 * Returns the create wallet method calling data for v1 wallets
 *
 * @param {string[]} walletOwners - wallet owner addresses for wallet initialization transactions
 * @param {string} salt - The salt for wallet initialization transactions
 * @returns {string} - the createWallet method encoded
 */
export function getV1WalletInitializationData(walletOwners: string[], salt: string): string {
  const saltBuffer = setLengthLeft(toBuffer(salt), 32);
  const params = [walletOwners, saltBuffer];
  const method = EthereumAbi.methodID('createWallet', createV1WalletTypes);
  const args = EthereumAbi.rawEncode(createV1WalletTypes, params);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Returns the create address method calling data for v1, v2, v4 forwarders
 *
 * @param {string} baseAddress - The address of the wallet contract
 * @param {string} salt - The salt for address initialization transactions
 * @param {string} feeAddress - The fee address for the enterprise
 * @returns {string} - the createForwarder method encoded
 */
export function getV1AddressInitializationData(baseAddress: string, salt: string, feeAddress?: string): string {
  const saltBuffer = setLengthLeft(toBuffer(salt), 32);
  const { createForwarderParams, createForwarderTypes } = getCreateForwarderParamsAndTypes(
    baseAddress,
    saltBuffer,
    feeAddress
  );

  const method = EthereumAbi.methodID('createForwarder', createForwarderTypes);
  const args = EthereumAbi.rawEncode(createForwarderTypes, createForwarderParams);
  return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
}

/**
 * Returns the create address method calling data for all forwarder versions
 *
 * @param {number} forwarderVersion - The version of the forwarder to create
 * @param {string} baseAddress - The address of the wallet contract
 * @param {string} salt - The salt for address initialization transactions
 * @param {string} feeAddress - The fee address for the enterprise
 * @returns {string} - the createForwarder method encoded
 *
 */
export function getAddressInitDataAllForwarderVersions(
  forwarderVersion: number,
  baseAddress: string,
  salt: string,
  feeAddress?: string
): string {
  if (forwarderVersion === defaultForwarderVersion) {
    return getAddressInitializationData();
  } else {
    return getV1AddressInitializationData(baseAddress, salt, feeAddress);
  }
}

/**
 * Returns the createForwarderTypes and createForwarderParams for all forwarder versions
 *
 * @param {string} baseAddress - The address of the wallet contract
 * @param {Buffer} saltBuffer - The salt for address initialization transaction
 * @param {string} feeAddress - The fee address for the enterprise
 * @returns {createForwarderParams: (string | Buffer)[], createForwarderTypes: string[]}
 */
export function getCreateForwarderParamsAndTypes(
  baseAddress: string,
  saltBuffer: Buffer,
  feeAddress?: string
): { createForwarderParams: (string | Buffer)[]; createForwarderTypes: string[] } {
  let createForwarderParams = [baseAddress, saltBuffer];
  let createForwarderTypes = createV1ForwarderTypes;
  if (feeAddress) {
    createForwarderParams = [baseAddress, feeAddress, saltBuffer];
    createForwarderTypes = createV4ForwarderTypes;
  }
  return { createForwarderParams, createForwarderTypes };
}

/**
 * Decode the given ABI-encoded create forwarder data and return parsed fields
 *
 * @param data The data to decode
 * @returns parsed transfer data
 */
export function decodeForwarderCreationData(data: string): ForwarderInitializationData {
  if (
    !(
      data.startsWith(v4CreateForwarderMethodId) ||
      data.startsWith(v1CreateForwarderMethodId) ||
      data.startsWith(createForwarderMethodId)
    )
  ) {
    throw new BuildTransactionError(`Invalid address bytecode: ${data}`);
  }

  if (data.startsWith(createForwarderMethodId)) {
    return {
      baseAddress: undefined,
      addressCreationSalt: undefined,
      feeAddress: undefined,
    };
  } else if (data.startsWith(v1CreateForwarderMethodId)) {
    const [baseAddress, saltBuffer] = getRawDecoded(
      createV1ForwarderTypes,
      getBufferedByteCode(v1CreateForwarderMethodId, data)
    );

    return {
      baseAddress: addHexPrefix(baseAddress as string),
      addressCreationSalt: bufferToHex(saltBuffer as Buffer),
      feeAddress: undefined,
    } as const;
  } else {
    const [baseAddress, feeAddress, saltBuffer] = getRawDecoded(
      createV4ForwarderTypes,
      getBufferedByteCode(v4CreateForwarderMethodId, data)
    );

    return {
      baseAddress: addHexPrefix(baseAddress as string),
      addressCreationSalt: bufferToHex(saltBuffer as Buffer),
      feeAddress: addHexPrefix(feeAddress as string),
    } as const;
  }
}

/**
 * Make a query to explorer for information such as balance, token balance, solidity calls
 * @param {Object} query key-value pairs of parameters to append after /api
 * @param {string} token the API token to use for the request
 * @param {string} explorerUrl the URL of the explorer
 * @returns {Promise<Object>} response from explorer
 */
export async function recoveryBlockchainExplorerQuery(
  query: Record<string, string>,
  explorerUrl: string,
  token?: string
): Promise<Record<string, unknown>> {
  if (token) {
    query.apikey = token;
  }
  const response = await request.get(`${explorerUrl}/api`).query(query);

  if (!response.ok) {
    throw new Error('could not reach explorer');
  }

  if (response.body.status === '0' && response.body.message === 'NOTOK') {
    throw new Error('Explorer rate limit reached');
  }
  return response.body;
}

/**
 * Default expire time for a contract call (1 week)
 * @returns {number} Time in seconds
 */
export function getDefaultExpireTime(): number {
  return Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;
}
