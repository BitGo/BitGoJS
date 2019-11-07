const crypto = require('crypto');
const tronweb = require('tronweb');
import { protocol } from '../../../resources/trx/protobuf/tron';
import { HDNode, ECPair } from 'bitgo-utxo-lib';

import * as assert from 'assert';
import {
  TransferContract,
  RawData,
  AccountPermissionUpdateContract,
  Account,
  TransactionReceipt,
  Permission,
} from './iface';
import { ContractType, PermissionType } from './enum';
import { UtilsError } from '../baseCoin/errors';

/**
 * Tron-specific helper functions
 */
export type TronBinaryLike = ByteArray | Buffer | Uint8Array | string;
export type ByteArray = number[];

/**
 * Generate a Tron account offline using known bitcoin libraries
 * @param seed Optional random seed
 * @return {Account}
 */
export function generateAccount(seed?: Buffer): Account {
  if (!seed) {
    seed = crypto.randomBytes(512 / 8);
  }

  const extendedKey = HDNode.fromSeedBuffer(seed);

  // convert our prv, pub
  const prv = extendedKey.keyPair.getPrivateKeyBuffer().toString('hex').toUpperCase();

  const keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(prv, 'hex'));

  const priKeyBytes = getByteArrayFromHexAddress(keyPair.getPrivateKeyBuffer().toString('hex'));
  const pubKeyBytes = getPubKeyFromPriKey(priKeyBytes);
  const publicKey = getHexAddressFromByteArray(pubKeyBytes);

  // used for meaningful address conversion
  const addressBytes = getAddressFromPriKey(priKeyBytes);

  return {
    privateKey: prv,
    publicKey,
    address: {
      base58: getBase58AddressFromByteArray(addressBytes),
      hex: getHexAddressFromByteArray(addressBytes),
    },
  };
}

export function isBase58Address(address: string): boolean {
  return tronweb.utils.crypto.isAddressValid(address);
}

export function getByteArrayFromHexAddress(str: string): ByteArray {
  return tronweb.utils.code.hexStr2byteArray(str);
}

export function getHexAddressFromByteArray(arr: ByteArray): string {
  return tronweb.utils.code.byteArray2hexStr(arr);
}

export function verifySignature(messageToVerify: string, base58Address: string, sigHex: string, useTronHeader: boolean = true): ByteArray {
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

export function getHexAddressFromBase58Address(base58: string): string {
  // pulled from: https://github.com/TRON-US/tronweb/blob/dcb8efa36a5ebb65c4dab3626e90256a453f3b0d/src/utils/help.js#L17
  // but they don't surface this call in index.js
  const bytes = tronweb.utils.crypto.decodeBase58Address(base58);
  return getHexAddressFromByteArray(bytes);
}

export function getPubKeyFromPriKey(privateKey: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.getPubKeyFromPriKey(privateKey);
}

export function getAddressFromPriKey(privateKey: TronBinaryLike): ByteArray {
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

export function getRawAddressFromPubKey(pubBytes: ByteArray | string): ByteArray {
  return tronweb.utils.crypto.computeAddress(pubBytes);
}

/**
 * Decodes a hex encoded transaction in its protobuf representation.
 * @param hexString raw_data_hex field from tron transactions
 */
export function decodeTransaction(hexString: string): RawData {
  const rawTransaction = decodeRawTransaction(hexString);

  // there should not be multiple contracts in this data
  if (rawTransaction.contracts.length !== 1) {
    throw new UtilsError('Number of contracts is greater than 1.');
  }

  let contract: TransferContract[] | AccountPermissionUpdateContract[];
  let contractType: ContractType;
  // ensure the contract type is supported
  switch  (rawTransaction.contracts[0].parameter.type_url) {
    case 'type.googleapis.com/protocol.TransferContract':
      contractType = ContractType.Transfer;
      contract = this.decodeTransferContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.AccountPermissionUpdateContract':
      contractType = ContractType.AccountPermissionUpdate;
      contract = this.decodeAccountPermissionUpdateContract(rawTransaction.contracts[0].parameter.value);
      break;
    default:
      throw new UtilsError('Unsupported contract type');
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
 * @param hexString this is the raw hexadecimal encoded string. Doc found in the following link.
 * @example
 * @see {@link https://github.com/BitGo/bitgo-account-lib/blob/5f282588701778a4421c75fa61f42713f56e95b9/resources/trx/protobuf/tron.proto#L319}
 */
export function decodeRawTransaction(hexString: string): { expiration: number, timestamp: number, contracts: Array<any>  } {
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
  };
}

/**
 * Indicates whether the passed string is a safe hex string for tron's purposes.
 * @param hex A valid hex string must be a string made of numbers and characters and has an even length.
 */
export function isValidHex(hex: string): Boolean {
  return /^(0x)?([0-9a-f]{2})+$/i.test(hex);
}

/** Deserialize the segment of the txHex which corresponds with the details of the transfer
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
  const owner_address = getBase58AddressFromByteArray(getByteArrayFromHexAddress(Buffer.from(transferContract.ownerAddress, 'base64').toString('hex')));
  const to_address = getBase58AddressFromByteArray(getByteArrayFromHexAddress(Buffer.from(transferContract.toAddress, 'base64').toString('hex')));
  const amount = transferContract.amount;

  return [{
    parameter: {
      value: {
        amount: Number(amount),
        owner_address,
        to_address,
      }
    }
  }];
}

/**
 * Deserialize the segment of the txHex corresponding with the details of the contract which updates
 * account permission
 * @param {string} base64
 * @returns {AccountPermissionUpdateContract}
 */
export function decodeAccountPermissionUpdateContract(base64: string): AccountPermissionUpdateContract {
  const accountUpdateContract = protocol.AccountPermissionUpdateContract.decode(Buffer.from(base64, 'base64')).toJSON();
  assert(accountUpdateContract.ownerAddress);
  assert(accountUpdateContract.owner);
  assert(accountUpdateContract.hasOwnProperty('actives'));

  const ownerAddress = getBase58AddressFromByteArray(getByteArrayFromHexAddress(Buffer.from(accountUpdateContract.ownerAddress, 'base64').toString('hex')));
  const owner: Permission = createPermission((accountUpdateContract.owner));
  let witness: Permission | undefined = undefined;
  if(accountUpdateContract.witness) {
    witness = createPermission(accountUpdateContract.witness);
  }
  const activeList = accountUpdateContract.actives.map((active) => createPermission(active));

  return {
    ownerAddress,
    owner,
    witness,
    actives: activeList,
  }
}

function createPermission(raw: { permissionName: string, threshold: number}): Permission {
  let permissionType: PermissionType;
  const permission = raw.permissionName.toLowerCase().trim();
  if (permission === 'owner') {
    permissionType = PermissionType.Owner;
  }
  else if (permission === "witness") {
    permissionType = PermissionType.Witness;
  } else if (permission.substr(0,6) === "active") {
    permissionType = PermissionType.Active;
  } else {
    throw new UtilsError('Permission type not parseable.');
  }
  return { type: permissionType, threshold: raw.threshold };
}

