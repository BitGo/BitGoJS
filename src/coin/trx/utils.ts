const tronweb = require('tronweb');
const tronproto = require('../../../resources/trx/protobuf/tron_pb');
const contractproto = require('../../../resources/trx/protobuf/Contract_pb');

import * as assert from 'assert';
import { TransferContract, RawTransaction, AccountPermissionUpdateContract, Account, TransactionReceipt } from './iface';
import { ContractType } from './enum';

/**
 * Tron-specific helper functions
 */

export type ByteArray = number[];

export function generateAccount(): Account {
  return tronweb.utils.accounts.generateAccount();
}

export function isBase58Address(address: string): boolean {
  return tronweb.utils.crypto.isAddressValid(address);
}

export function isHexAddress(address: string): boolean {
  return tronweb.isAddress(address);
}

export function getByteArrayFromHexAddress(str: string): ByteArray {
  return tronweb.utils.code.hexStr2byteArray(str);
}

export function getHexAddressFromByteArray(arr: ByteArray): string {
  return tronweb.utils.code.byteArray2hexStr(arr);
}

export function getPubKeyFromPriKey(privateKey: ByteArray | Buffer | Uint8Array | string): ByteArray {
  return tronweb.utils.crypto.getPubKeyFromPriKey(privateKey);
}

export function getAddressFromPriKey(privateKey: ByteArray | Buffer | Uint8Array | string): ByteArray {
  return tronweb.utils.crypto.getAddressFromPriKey(privateKey);
}

export function getBase58AddressFromByteArray(address: ByteArray): string {
  return tronweb.utils.crypto.getBase58CheckAddress(address);
}

export function getBase58AddressFromHex(hex: string): string {
  const arr = getByteArrayFromHexAddress(hex);
  return getBase58AddressFromByteArray(arr);
}

export function signTransaction(privateKey: string | ByteArray, transaction: TransactionReceipt): TransactionReceipt {
  return tronweb.utils.crypto.signTransaction(privateKey, transaction);
}

export function signString(message: string, privateKey: string | ByteArray, useTronHeader: boolean = true): string {
  return tronweb.Trx.signString(message, privateKey, useTronHeader);
}

export function getRawAddressFromPubKey(pubBytes: number[] | string): ByteArray {
  return tronweb.utils.crypto.computeAddress(pubBytes);
}

export function getHexAddressFromBase58Address(base58: string): string {
  // pulled from: https://github.com/TRON-US/tronweb/blob/dcb8efa36a5ebb65c4dab3626e90256a453f3b0d/src/utils/help.js#L17
  // but they don't surface this call in index.js
  const bytes = tronweb.utils.crypto.decodeBase58Address(base58);
  return getHexAddressFromByteArray(bytes);
}

/**
 * Decodes a base64 encoded transaction in its protobuf representation.
 * @param base64EncodedHex
 */
export function decodeTransaction(base64EncodedHex: string): RawTransaction {
  const rawTransaction = this.decodeRawTransaction(base64EncodedHex);

  // there should not be multiple contracts in this data
  assert(rawTransaction.contracts.length === 1);

  let contract: TransferContract | AccountPermissionUpdateContract;
  let contractType: ContractType;
  // ensure the contract type is supported
  switch  (rawTransaction.contracts[0].parameter.typeUrl) {
    case 'type.googleapis.com/protocol.TransferContract':
      contractType = ContractType.Transfer;
      contract = this.decodeTransferContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.AccountPermissionUpdateContract':
      contractType = ContractType.AccountPermissionUpdate;
      contract = this.decodeAccountPermissionUpdateContract(rawTransaction.contracts[0].parameter.value);
      break;
    default:
      throw new Error('Unsupported contract type');
  }

  return {
    contractType,
    contract,
    expiration: rawTransaction.expiration,
    timestamp: rawTransaction.timestamp,
  };
}

/**
 * Decodes a transaction's raw field from a base64 encoded string. This is a protobuf representation.
 * @param base64EncodedHex
 * @example
 * @see {@link }
 */
export function decodeRawTransaction(base64EncodedHex: string): { expiration: number, timestamp: number, contracts: Array<any>  } {
  const bytes = Buffer.from(base64EncodedHex, 'hex');

  let raw;
  try {
    // we need to decode our raw_data_hex field first
    raw = tronproto.Transaction.raw.deserializeBinary(bytes).toObject();
  } catch (e) {
    console.log('There was an error decoding the initial raw_data_hex from the serialized tx.');
    throw e;
  }

  return {
    expiration: raw.expiration,
    timestamp: raw.timestamp,
    contracts: raw.contracts,
  };
}

/**
 * Indicates whether the passed string is a safe hex string for tron's purposes.
 * @param hex A valid hex string must be a string made of numbers and characters and has an even length.
 */
export function isValidHex(hex: string): Boolean {
  if (!hex.match(/^(0x)?[0-9a-fA-F]*$/)) {
    return false;
  }

  if ((hex.length % 2) !== 0) {
    return false;
  }

  return true;
}

/** Deserialize the portion of the txHex which corresponds with the details of the transfer
 * @param transferHex is the value property of the "parameter" field of contractList[0]
 * */
export function decodeTransferContract(transferHex: string): TransferContract {
  const contractBytes = Buffer.from(transferHex, 'base64');
  let transferContract;

  try {
    transferContract = contractproto.TransferContract.deserializeBinary(contractBytes).toObject();
  } catch (e) {
    console.log('There was an error decoding the transfer contract in the transaction.');
    throw e;
  }

  assert(transferContract.ownerAddress);
  assert(transferContract.toAddress);
  assert(transferContract.hasOwnProperty('amount'));

  // deserialize attributes
  const ownerAddress = getBase58AddressFromByteArray(getByteArrayFromHexAddress(Buffer.from(transferContract.ownerAddress, 'base64').toString('hex')));
  const toAddress = getBase58AddressFromByteArray(getByteArrayFromHexAddress(Buffer.from(transferContract.toAddress, 'base64').toString('hex')));
  const amount = transferContract.amount;

  return {
    toAddress,
    ownerAddress,
    amount,
  };
}

export function decodeAccountPermissionUpdateContract(base64: string): AccountPermissionUpdateContract {
  throw new Error();
  // TODO: build
}

