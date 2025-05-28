import assert from 'assert';
import * as hex from '@stablelib/hex';
import * as tronweb from 'tronweb';
import { protocol } from '../../resources/protobuf/tron';

import { UtilsError } from '@bitgo/sdk-core';
import { TronErc20Coin, coins } from '@bitgo/statics';
import {
  TransferContract,
  RawData,
  AccountPermissionUpdateContract,
  TransactionReceipt,
  Permission,
  TriggerSmartContract,
  FreezeBalanceContractParameter,
  VoteWitnessContractParameter,
  FreezeContractDecoded,
  VoteContractDecoded,
  UnfreezeBalanceContractParameter,
  WithdrawExpireUnfreezeContractParameter,
  UnfreezeContractDecoded,
  WithdrawContractDecoded,
  ResourceManagementContractParameter,
  ResourceManagementContractDecoded,
} from './iface';
import { ContractType, PermissionType, TronResource } from './enum';
import { AbiCoder, hexConcat } from 'ethers/lib/utils';
import { DELEGATION_TYPE_URL } from './constants';

export const TRANSACTION_MAX_EXPIRATION = 86400000; // one day
export const TRANSACTION_DEFAULT_EXPIRATION = 3600000; // one hour
const ADDRESS_PREFIX_REGEX = /^(41)/;
const ADDRESS_PREFIX = '41';

export type BytesLike = number[] | Uint8Array;

const getTronTokens = (network = 'mainnet') => {
  return (
    coins
      .filter((coin) => coin.family === 'trx')
      .filter((trx) => trx.network.type === network && trx.isToken) as unknown as TronErc20Coin[]
  ).map((coins) => coins.contractAddress.toString());
};

export const tokenMainnetContractAddresses = getTronTokens('mainnet');
export const tokenTestnetContractAddresses = getTronTokens('testnet');
/**
 * Tron-specific helper functions
 */
export type ByteArray = number[];
export type TronBinaryLike = ByteArray | Buffer | Uint8Array | string;

export const VALID_RESOURCE_TYPES = ['ENERGY', 'BANDWIDTH'];

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
  // Ensure bytes is a ByteArray (number[])
  if (Array.isArray(bytes)) {
    return getHexAddressFromByteArray(bytes);
  }
  throw new UtilsError('Failed to decode base58 address to byte array');
}
/**
 * @param privateKey
 */
export function getPubKeyFromPriKey(privateKey: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.getPubKeyFromPriKey(privateKey as BytesLike);
}

/**
 * @param privateKey
 */
export function getAddressFromPriKey(privateKey: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.getAddressFromPriKey(privateKey as BytesLike);
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
  return tronweb.utils.crypto.signTransaction(privateKey, transaction) as TransactionReceipt;
}

/**
 * @param message
 * @param privateKey
 * @param useTronHeader
 */
export function signString(message: string, privateKey: string | ByteArray, useTronHeader = true): string {
  return tronweb.Trx.signString(message, privateKey as string, useTronHeader);
}

/**
 * @param pubBytes
 */
export function getRawAddressFromPubKey(pubBytes: TronBinaryLike): ByteArray {
  return tronweb.utils.crypto.computeAddress(pubBytes as BytesLike);
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

  let contract:
    | TransferContract[]
    | AccountPermissionUpdateContract[]
    | TriggerSmartContract[]
    | FreezeBalanceContractParameter[]
    | VoteWitnessContractParameter[]
    | UnfreezeBalanceContractParameter[]
    | WithdrawExpireUnfreezeContractParameter[]
    | ResourceManagementContractParameter[];

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
    case 'type.googleapis.com/protocol.FreezeBalanceV2Contract':
      contractType = ContractType.FreezeBalanceV2;
      contract = decodeFreezeBalanceV2Contract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.VoteWitnessContract':
      contractType = ContractType.VoteWitness;
      contract = decodeVoteWitnessContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.WithdrawExpireUnfreezeContract':
      contract = decodeWithdrawExpireUnfreezeContract(rawTransaction.contracts[0].parameter.value);
      contractType = ContractType.WithdrawExpireUnfreeze;
      break;
    case 'type.googleapis.com/protocol.UnfreezeBalanceV2Contract':
      contract = decodeUnfreezeBalanceV2Contract(rawTransaction.contracts[0].parameter.value);
      contractType = ContractType.UnfreezeBalanceV2;
      break;
    case DELEGATION_TYPE_URL:
      contractType = ContractType.DelegateResourceContract;
      contract = decodeDelegateResourceContract(rawTransaction.contracts[0].parameter.value);
      break;
    case 'type.googleapis.com/protocol.UnDelegateResourceContract':
      contractType = ContractType.UnDelegateResourceContract;
      contract = decodeUnDelegateResourceContract(rawTransaction.contracts[0].parameter.value);
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
 * Deserialize the segment of the txHex corresponding with freeze balance contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {FreezeBalanceContractParameter[]} - Array containing the decoded freeze contract
 */
export function decodeFreezeBalanceV2Contract(base64: string): FreezeBalanceContractParameter[] {
  let freezeContract: FreezeContractDecoded;
  try {
    freezeContract = protocol.FreezeBalanceV2Contract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the freeze contract in the transaction.');
  }

  if (!freezeContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this freeze contract.');
  }

  if (freezeContract.resource === undefined) {
    throw new UtilsError('Resource type does not exist in this freeze contract.');
  }

  if (freezeContract.frozenBalance === undefined) {
    throw new UtilsError('Frozen balance does not exist in this freeze contract.');
  }

  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(freezeContract.ownerAddress, 'base64').toString('hex'))
  );

  const resourceValue = freezeContract.resource === 0 ? TronResource.BANDWIDTH : TronResource.ENERGY;

  return [
    {
      parameter: {
        value: {
          resource: resourceValue,
          frozen_balance: Number(freezeContract.frozenBalance),
          owner_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with vote witness contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {VoteWitnessContractParameter[]} - Array containing the decoded vote witness contract
 */
export function decodeVoteWitnessContract(base64: string): VoteWitnessContractParameter[] {
  let voteContract: VoteContractDecoded;
  try {
    voteContract = protocol.VoteWitnessContract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the vote contract in the transaction.');
  }

  if (!voteContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this vote contract.');
  }

  if (!Array.isArray(voteContract.votes) || voteContract.votes.length === 0) {
    throw new UtilsError('Votes do not exist or are empty in this vote contract.');
  }

  // deserialize attributes
  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(voteContract.ownerAddress, 'base64').toString('hex'))
  );

  interface VoteItem {
    voteAddress?: string;
    voteCount?: string | number;
  }

  const votes = voteContract.votes.map((vote: VoteItem) => {
    if (!vote.voteAddress) {
      throw new UtilsError('Vote address is missing in one of the votes.');
    }

    return {
      vote_address: getBase58AddressFromByteArray(
        getByteArrayFromHexAddress(Buffer.from(vote.voteAddress, 'base64').toString('hex'))
      ),
      vote_count: Number(vote.voteCount || 0),
    };
  });

  return [
    {
      parameter: {
        value: {
          owner_address,
          votes,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with unfreeze balance contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {UnfreezeBalanceContractParameter[]} - Array containing the decoded unfreeze contract
 */
export function decodeUnfreezeBalanceV2Contract(base64: string): UnfreezeBalanceContractParameter[] {
  let unfreezeContract: UnfreezeContractDecoded;
  try {
    unfreezeContract = protocol.UnfreezeBalanceV2Contract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the unfreeze contract in the transaction.');
  }

  if (!unfreezeContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this unfreeze contract.');
  }

  if (unfreezeContract.resource === undefined) {
    throw new UtilsError('Resource type does not exist in this unfreeze contract.');
  }

  if (unfreezeContract.unfreezeBalance === undefined) {
    throw new UtilsError('Unfreeze balance does not exist in this unfreeze contract.');
  }

  // deserialize attributes
  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(unfreezeContract.ownerAddress, 'base64').toString('hex'))
  );

  // Convert ResourceCode enum value to string resource name
  const resourceValue = unfreezeContract.resource;
  const resourceEnum = resourceValue === protocol.ResourceCode.BANDWIDTH ? TronResource.BANDWIDTH : TronResource.ENERGY;

  return [
    {
      parameter: {
        value: {
          resource: resourceEnum,
          unfreeze_balance: Number(unfreezeContract.unfreezeBalance),
          owner_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with withdraw expire unfreeze contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {WithdrawExpireUnfreezeContractParameter[]} - Array containing the decoded withdraw contract
 */
export function decodeWithdrawExpireUnfreezeContract(base64: string): WithdrawExpireUnfreezeContractParameter[] {
  let withdrawContract: WithdrawContractDecoded;
  try {
    withdrawContract = protocol.WithdrawBalanceContract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the withdraw contract in the transaction.');
  }

  if (!withdrawContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this withdraw contract.');
  }

  // deserialize attributes
  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(withdrawContract.ownerAddress, 'base64').toString('hex'))
  );

  return [
    {
      parameter: {
        value: {
          owner_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with delegate resource contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {ResourceManagementContractParameter[]} - Array containing the decoded delegate resource contract
 */
export function decodeDelegateResourceContract(base64: string): ResourceManagementContractParameter[] {
  let delegateResourceContract: ResourceManagementContractDecoded;
  try {
    delegateResourceContract = protocol.DelegateResourceContract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the delegate resource contract in the transaction.');
  }

  if (!delegateResourceContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this delegate resource contract.');
  }

  if (!delegateResourceContract.receiverAddress) {
    throw new UtilsError('Receiver address does not exist in this delegate resource contract.');
  }

  if (delegateResourceContract.resource === undefined) {
    throw new UtilsError('Resource type does not exist in this delegate resource contract.');
  }

  if (delegateResourceContract.balance === undefined) {
    throw new UtilsError('Balance does not exist in this delegate resource contract.');
  }

  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(delegateResourceContract.ownerAddress, 'base64').toString('hex'))
  );

  const receiver_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(delegateResourceContract.receiverAddress, 'base64').toString('hex'))
  );

  const resourceValue = !delegateResourceContract.resource ? TronResource.BANDWIDTH : TronResource.ENERGY;

  return [
    {
      parameter: {
        value: {
          resource: resourceValue,
          balance: Number(delegateResourceContract.balance),
          owner_address,
          receiver_address,
        },
      },
    },
  ];
}

/**
 * Deserialize the segment of the txHex corresponding with undelegate resource contract
 *
 * @param {string} base64 - The base64 encoded contract data
 * @returns {ResourceManagementContractParameter[]} - Array containing the decoded undelegate resource contract
 */
export function decodeUnDelegateResourceContract(base64: string): ResourceManagementContractParameter[] {
  let undelegateResourceContract: ResourceManagementContractDecoded;
  try {
    undelegateResourceContract = protocol.UnDelegateResourceContract.decode(Buffer.from(base64, 'base64')).toJSON();
  } catch (e) {
    throw new UtilsError('There was an error decoding the delegate resource contract in the transaction.');
  }

  if (!undelegateResourceContract.ownerAddress) {
    throw new UtilsError('Owner address does not exist in this delegate resource contract.');
  }

  if (!undelegateResourceContract.receiverAddress) {
    throw new UtilsError('Receiver address does not exist in this delegate resource contract.');
  }

  if (undelegateResourceContract.resource === undefined) {
    throw new UtilsError('Resource type does not exist in this delegate resource contract.');
  }

  if (undelegateResourceContract.balance === undefined) {
    throw new UtilsError('Balance does not exist in this delegate resource contract.');
  }

  const owner_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(undelegateResourceContract.ownerAddress, 'base64').toString('hex'))
  );

  const receiver_address = getBase58AddressFromByteArray(
    getByteArrayFromHexAddress(Buffer.from(undelegateResourceContract.receiverAddress, 'base64').toString('hex'))
  );

  const resourceValue = !undelegateResourceContract.resource ? TronResource.BANDWIDTH : TronResource.ENERGY;

  return [
    {
      parameter: {
        value: {
          resource: resourceValue,
          balance: Number(undelegateResourceContract.balance),
          owner_address,
          receiver_address,
        },
      },
    },
  ];
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
    throw new UtilsError(`There was an error encoding the data params. Error = ${JSON.stringify(e)}`);
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
