import assert from 'assert';
import * as hex from '@stablelib/hex';
import * as tronweb from 'tronweb';
import { protocol } from '../../resources/protobuf/tron';

import { UtilsError } from '@bitgo/sdk-core';
import {
  TransferContract,
  RawData,
  AccountPermissionUpdateContract,
  TransactionReceipt,
  Permission,
  TriggerSmartContract,
} from './iface';
import { ContractType, PermissionType } from './enum';
import { AbiCoder, hexConcat } from 'ethers/lib/utils';

const ADDRESS_PREFIX_REGEX = /^(41)/;
const ADDRESS_PREFIX = '41';

export const tokenMainnetContractAddresses = [
  'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
];
export const tokenTestnetContractAddresses = [
  'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id',
  'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
];

/**
 * Tron-specific helper functions
 */
export type TronBinaryLike = ByteArray | Buffer | Uint8Array | string;
export type ByteArray = number[];

/**
 * @param address
 */
export function isBase58Address(address: string): boolean {
  return tronweb.utils.crypto.isAddressValid(address);
}

/**
 * @param str
 */
export function getByteArrayFromHexAddress(str: string): ByteArray {
  return tronweb.utils.code.hexStr2byteArray(str.replace('0x', ''));
}

/**
 * @param arr
 */
export function getHexAddressFromByteArray(arr: ByteArray): string {
  return tronweb.utils.code.byteArray2hexStr(arr);
}

/**
 * @param messageToVerify
 * @param base58Address
 * @param sigHex
 * @param useTronHeader
 */
export function verifySignature(
  messageToVerify: string,
  base58Address: string,
  sigHex: string,
  useTronHeader = true
): boolean {
  if (!isValidHex(sigHex)) {
    throw new UtilsError('signature is not in a valid format, needs to be hexadecimal');
  }

  if (!isValidHex(messageToVerify)) {
    throw new UtilsError('message is not in a valid format, needs to be hexadecimal');
  }

  if (!isBase58Address(base58Address)) {
    throw new UtilsError('address needs to be base58 encoded');
  }

  return tronweb.Trx.verifySignature(messageToVerify, base58Address, sigHex, useTronHeader);
}

/**
 * @param base58
 */
export function getHexAddressFromBase58Address(base58: string): string {
  // pulled from: https://github.com/TRON-US/tronweb/blob/dcb8efa36a5ebb65c4dab3626e90256a453f3b0d/src/utils/help.js#L17
  // but they don't surface this call in index.js
  const bytes = tronweb.utils.crypto.decodeBase58Address(base58);
  return getHexAddressFromByteArray(bytes);
}

/**
 * @param privateKey
 */
export function getPubKeyFromPriKey(privateKey: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.getPubKeyFromPriKey(privateKey);
}

/**
 * @param privateKey
 */
export function getAddressFromPriKey(privateKey: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.getAddressFromPriKey(privateKey);
}

/**
 * @param address
 */
export function getBase58AddressFromByteArray(address: ByteArray): string {
  return tronweb.utils.crypto.getBase58CheckAddress(address);
}

/**
 * @param hex
 */
export function getBase58AddressFromHex(hex: string): string {
  const arr = getByteArrayFromHexAddress(hex);
  return getBase58AddressFromByteArray(arr);
}

/**
 * @param privateKey
 * @param transaction
 */
export function signTransaction(privateKey: string | ByteArray, transaction: TransactionReceipt): TransactionReceipt {
  return tronweb.utils.crypto.signTransaction(privateKey, transaction);
}

/**
 * @param message
 * @param privateKey
 * @param useTronHeader
 */
export function signString(message: string, privateKey: string | ByteArray, useTronHeader = true): string {
  return tronweb.Trx.signString(message, privateKey, useTronHeader);
}

/**
 * @param pubBytes
 */
export function getRawAddressFromPubKey(pubBytes: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.computeAddress(pubBytes);
}

/**
 * Decodes a hex encoded transaction in its protobuf representation.
 *
 * @param hexString raw_data_hex field from tron transactions
 */
export function decodeTransaction(hexString: string): RawData {
  const rawTransaction = decodeRawTransaction(hexString);

  // there should not be multiple contracts in this data
  if (rawTransaction.contracts.length !== 1) {
    throw new UtilsError('Number of contracts is greater than 1.');
  }

  let contract: TransferContract[] | AccountPermissionUpdateContract[] | TriggerSmartContract[];
  let contractType: ContractType;
  // ensure the contract type is supported
  switch (rawTransaction.contracts[0].parameter.type_url) {
    case 'type.googleapis.com/protocol.TransferContract':
      contractType = ContractType.Transfer;
      contract = exports.decodeTransferContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.AccountPermissionUpdateContract':
      contractType = ContractType.AccountPermissionUpdate;
      contract = exports.decodeAccountPermissionUpdateContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.TriggerSmartContract':
      contractType = ContractType.TriggerSmartContract;
      contract = exports.decodeTriggerSmartContract(rawTransaction.contracts[0].parameter.value);
      break;
    default:
      throw new UtilsError('Unsupported contract type');
  }

  return {
    contractType,
    contract,
    expiration: rawTransaction.expiration,
    timestamp: rawTransaction.timestamp,
    ref_block_bytes: rawTransaction.blockBytes,
    ref_block_hash: rawTransaction.blockHash,
    fee_limit: +rawTransaction.feeLimit,
  };
}

/**
 * Decodes a transaction's raw field from a base64 encoded string. This is a protobuf representation.
 *
 * @param hexString this is the raw hexadecimal encoded string. Doc found in the following link.
 * @example
 * @see {@link https://github.com/BitGo/bitgo-account-lib/blob/5f282588701778a4421c75fa61f42713f56e95b9/resources/protobuf/tron.proto#L319}
 */
export function decodeRawTransaction(hexString: string): {
  expiration: number;
  timestamp: number;
  contracts: Array<any>;
  blockBytes: string;
  blockHash: string;
  feeLimit: string;
} {
  const bytes = Buffer.from(hexString, 'hex');

  let raw;
  try {
    // we need to decode our raw_data_hex field first
    raw = protocol.Transaction.raw.decode(bytes);
  } catch (e) {
    throw new UtilsError('There was an error decoding the initial raw_data_hex from the serialized tx.');
  }

  return {
    expiration: Number(raw.expiration),
    timestamp: Number(raw.timestamp),
    contracts: raw.contract,
    blockBytes: toHex(raw.refBlockBytes),
    feeLimit: raw.feeLimit,
    blockHash: toHex(raw.refBlockHash),
  };
}

/**
 * Indicates whether the passed string is a safe hex string for tron's purposes.
 *
 * @param hex A valid hex string must be a string made of numbers and characters and has an even length.
 */
export function isValidHex(hex: string): boolean {
  return /^(0x)?([0-9a-f]{2})+$/i.test(hex);
}

/** Deserialize the segment of the txHex which corresponds with the details of the transfer
 *
 * @param transferHex is the value property of the "parameter" field of contractList[0]
 * */
export function decodeTransferContract(transferHex: string): TransferContract[] {
  const contractBytes = Buffer.from(transferHex, 'base64');
  let transferContract;

  try {
    transferContract = protocol.TransferContract.decode(contractBytes);
  } catch (e) {
    throw new UtilsError('There was an error decoding the transfer contract in the transaction.');
  }

  if (!transferContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this transfer contract.');
  }

  if (!transferContract.toAddress) {
    throw new UtilsError('Destination address does not exist in this transfer contract.');
  }

  if (!transferContract.hasOwnProperty('amount')) {
    throw new UtilsError('Amount does not exist in this transfer contract.');
  }

  // deserialize attributes
  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(transferContract.ownerAddress, 'base64').toString('hex'))
  );
  const to_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(transferContract.toAddress, 'base64').toString('hex'))
  );
  const amount = transferContract.amount;

  return [
    {
      parameter: {
        value: {
          amount: Number(amount),
          owner_address,
          to_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with trigger smart contract
 *
 * @param {string} base64
 * @returns {AccountPermissionUpdateContract}
 */
export function decodeTriggerSmartContract(base64: string): TriggerSmartContract[] {
  let contractCallDecoded;
  try {
    contractCallDecoded = protocol.TriggerSmartContract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the contract call in the transaction.');
  }

  if (!contractCallDecoded.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this contract call.');
  }

  if (!contractCallDecoded.contractAddress) {
    throw new UtilsError('Destination contract address does not exist in this contract call.');
  }

  if (!contractCallDecoded.data) {
    throw new UtilsError('Data does not exist in this contract call.');
  }

  // deserialize attributes
  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(contractCallDecoded.ownerAddress, 'base64').toString('hex'))
  );
  const contract_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(contractCallDecoded.contractAddress, 'base64').toString('hex'))
  );
  const data = contractCallDecoded.data;
  return [
    {
      parameter: {
        value: {
          data: data,
          owner_address,
          contract_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with the details of the contract which updates
 * account permission
 *
 * @param {string} base64
 * @returns {AccountPermissionUpdateContract}
 */
export function decodeAccountPermissionUpdateContract(base64: string): AccountPermissionUpdateContract {
  const accountUpdateContract = protocol.AccountPermissionUpdateContract.decode(Buffer.from(base64, 'base64')).toJSON();
  assert(accountUpdateContract.ownerAddress);
  assert(accountUpdateContract.owner);
  assert(accountUpdateContract.hasOwnProperty('actives'));

  const ownerAddress = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(accountUpdateContract.ownerAddress, 'base64').toString('hex'))
  );
  const owner: Permission = createPermission(accountUpdateContract.owner);
  let witness: Permission | undefined = undefined;
  if (accountUpdateContract.witness) {
    witness = createPermission(accountUpdateContract.witness);
  }
  const activeList = accountUpdateContract.actives.map((active) => createPermission(active));

  return {
    ownerAddress,
    owner,
    witness,
    actives: activeList,
  };
}

/**
 * @param raw
 */
function createPermission(raw: { permissionName: string; threshold: number }): Permission {
  let permissionType: PermissionType;
  const permission = raw.permissionName.toLowerCase().trim();
  if (permission === 'owner') {
    permissionType = PermissionType.Owner;
  } else if (permission === 'witness') {
    permissionType = PermissionType.Witness;
  } else if (permission.substr(0, 6) === 'active') {
    permissionType = PermissionType.Active;
  } else {
    throw new UtilsError('Permission type not parseable.');
  }
  return { type: permissionType, threshold: raw.threshold };
}

/**
 * @param rawTransaction
 */
export function isValidTxJsonString(rawTransaction: string): boolean {
  const transaction = JSON.parse(rawTransaction);
  return transaction.hasOwnProperty('txID');
}

/**
 * Returns whether the provided raw transaction accommodates to bitgo's preferred format
 *
 * @param {any} rawTransaction - The raw transaction to be checked
 * @returns {boolean} the validation result
 */
export function isValidRawTransactionFormat(rawTransaction: any): boolean {
  if (typeof rawTransaction === 'string' && (isValidHex(rawTransaction) || isValidTxJsonString(rawTransaction))) {
    return true;
  }
  return false;
}

/**
 * Returns an hex string of the given buffer
 *
 * @param {Buffer | Uint8Array} buffer - the buffer to be converted to hex
 * @returns {string} - the hex value
 */
export function toHex(buffer: Buffer | Uint8Array): string {
  return hex.encode(buffer, true);
}

/**
 * Returns a Keccak-256 encoded string of the parameters
 *
 * @param types - strings describing the types of the values
 * @param values - value to encode
 * @param methodId - the first 4 bytes of the function selector
 */
export function encodeDataParams(types: string[], values: any[], methodId?: string): string {
  types.forEach((type, index) => {
    if (type == 'address') {
      values[index] = values[index].replace(ADDRESS_PREFIX_REGEX, '0x');
    }
  });

  const abiCoder = new AbiCoder();
  let data;
  try {
    data = abiCoder.encode(types, values);
  } catch (e) {
    throw new UtilsError('There was an error encoding the data params.');
  }
  if (methodId) {
    return hexConcat([methodId, data]).replace(/^(0x)/, '');
  } else {
    return data.replace(/^(0x)/, '');
  }
}

/**
 * Returns the decoded values according to the array of types
 *
 * @param types - strings describing the types of the values
 * @param data - encoded string
 */
export function decodeDataParams(types: string[], data: string): any[] {
  const abiCoder = new AbiCoder();
  data = '0x' + data.substring(8);
  return abiCoder.decode(types, data).reduce((obj, arg, index) => {
    if (types[index] == 'address') arg = ADDRESS_PREFIX + arg.substr(2).toLowerCase();
    obj.push(arg);
    return obj;
  }, []);
}
