import * as url from 'url';
import BigNumber from 'bignumber.js';
import { bufferToHex, stripHexPrefix } from 'ethereumjs-util';
import {
  addressFromPublicKeys,
  addressFromVersionHash,
  AddressHashMode,
  addressHashModeToVersion,
  addressToString,
  AddressVersion,
  BufferReader,
  ClarityType,
  ClarityValue,
  createAddress,
  createMemoString,
  createMessageSignature,
  createStacksPrivateKey,
  createStacksPublicKey,
  cvToString,
  cvToValue,
  deserializeTransaction,
  PubKeyEncoding,
  publicKeyFromSignature,
  signWithKey,
  StacksTransaction,
  TransactionVersion,
  validateStacksAddress,
} from '@stacks/transactions';
import { ec } from 'elliptic';
import * as _ from 'lodash';
import { InvalidTransactionError, isValidXprv, isValidXpub, SigningError, UtilsError } from '@bitgo/sdk-core';
import { AddressDetails, SendParams } from './iface';
import { KeyPair } from '.';
import { StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import { VALID_CONTRACT_FUNCTION_NAMES } from './constants';

/**
 * Encodes a buffer as a "0x" prefixed lower-case hex string.
 *
 * @param {Buffer} buff - a buffer with a hexadecimal string
 * @returns {string} - the hexadecimal string prefixed with "0x"
 */
export function bufferToHexPrefixString(buff: Buffer): string {
  return bufferToHex(buff);
}

/**
 * Remove the "0x" prefix from the given string, if present.
 *
 * @param {string} hex - a hexadecimal string
 * @returns {string} - the hexadecimal string without a leading "0x"
 */
export function removeHexPrefix(hex: string): string {
  return stripHexPrefix(hex);
}

/**
 * Get stacks address from public key hash
 *
 * @param {Buffer} publicKeyHash - hash of public key
 * @param {AddressHashMode} hashMode - hash mode
 * @param {TransactionVersion} transactionVersion - tx version
 * @returns {string} stacks address
 */
function getAddressFromPublicKeyHash(
  publicKeyHash: Buffer,
  hashMode: AddressHashMode,
  transactionVersion: TransactionVersion
): string {
  if (publicKeyHash.length !== 20) {
    throw new Error('expected 20-byte pubkeyhash');
  }

  const addrVer = addressHashModeToVersion(hashMode, transactionVersion);
  const addr = addressFromVersionHash(addrVer, publicKeyHash.toString('hex'));
  const addrString = addressToString(addr);
  return addrString;
}

/**
 * @param tx
 */
export function getTxSenderAddress(tx: StacksTransaction): string {
  if (tx.auth.spendingCondition !== null && tx.auth.spendingCondition !== undefined) {
    const spendingCondition = tx.auth.spendingCondition;
    const txSender = getAddressFromPublicKeyHash(
      Buffer.from(spendingCondition.signer, 'hex'),
      spendingCondition.hashMode as number,
      tx.version
    );
    return txSender;
  } else throw new Error('spendingCondition should not be null');
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
 * Returns whether or not the string is a valid protocol address
 *
 * @param {string} address - the address to be validated
 * @returns {boolean} - the validation result
 */
export function isValidAddress(address: string): boolean {
  return validateStacksAddress(address);
}

/**
 * Returns whether or not the string is a valid protocol transaction id or not.
 *
 * A valid transaction id is a SHA-512/256 hash of a serialized transaction; see
 * the txidFromData function in @stacks/transaction:
 * https://github.com/blockstack/stacks.js/blob/master/packages/transactions/src/utils.ts#L97
 *
 * @param {string} txId - the transaction id to be validated
 * @returns {boolean} - the validation result
 */
export function isValidTransactionId(txId: string): boolean {
  if (txId.length !== 64 && txId.length !== 66) return false;
  const noPrefix = removeHexPrefix(txId);
  if (noPrefix.length !== 64) return false;

  return allHexChars(noPrefix);
}

/**
 * Returns whether or not the string is a valid protocol public key or
 * extended public key.
 *
 * The key format is documented at
 * https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md#transaction-authorization
 *
 * @param {string} pub - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(pub: string): boolean {
  if (isValidXpub(pub)) return true;

  if (pub.length !== 66 && pub.length !== 130) return false;

  const firstByte = pub.slice(0, 2);

  // uncompressed public key
  if (pub.length === 130 && firstByte !== '04') return false;

  // compressed public key
  if (pub.length === 66 && firstByte !== '02' && firstByte !== '03') return false;

  if (!allHexChars(pub)) return false;

  // validate the public key
  const secp256k1 = new ec('secp256k1');
  try {
    const keyPair = secp256k1.keyFromPublic(Buffer.from(pub, 'hex'));
    const { result } = keyPair.validate();
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Returns whether or not the string is a valid protocol private key, or extended
 * private key.
 *
 * The protocol key format is described in the @stacks/transactions npm package, in the
 * createStacksPrivateKey function:
 * https://github.com/blockstack/stacks.js/blob/master/packages/transactions/src/keys.ts#L125
 *
 * @param {string} prv - the private key (or extended private key) to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPrivateKey(prv: string): boolean {
  if (isValidXprv(prv)) return true;

  if (prv.length !== 64 && prv.length !== 66) return false;

  if (prv.length === 66 && prv.slice(64) !== '01') return false;

  return allHexChars(prv);
}

/**
 * Returns whether or not the string is a composed of hex chars only
 *
 * @param {string} maybe - the  string to be validated
 * @returns {boolean} - the validation result
 */
function allHexChars(maybe: string): boolean {
  return /^([0-9a-f])+$/i.test(maybe);
}

/**
 * Checks if raw transaction can be deserialized
 *
 * @param {unknown} rawTransaction - transaction in raw hex format
 * @returns {boolean} - the validation result
 */
export function isValidRawTransaction(rawTransaction: unknown): boolean {
  try {
    if (typeof rawTransaction === 'string') {
      deserializeTransaction(BufferReader.fromBuffer(Buffer.from(removeHexPrefix(rawTransaction), 'hex')));
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Returns whether or not the memo string is valid
 *
 * @param {string} memo - the string to be validated
 * @returns {boolean} - the validation result
 */
export function isValidMemo(memo: string): boolean {
  try {
    createMemoString(memo);
  } catch (e) {
    return false;
  }

  return true;
}

/**
 * Checks for valid contract address
 *
 * @param {string} addr - contract deployer address
 * @param {BitgoStacksNetwork} network - network object
 * @returns {boolean} - the validation result
 */
export function isValidContractAddress(addr: string, network: BitgoStacksNetwork): boolean {
  return addr === network.stakingContractAddress || addr === network.sendmanymemoContractAddress;
}

/**
 * Check if the name is one of valid contract names
 *
 * @param {string} name - function name
 * @returns {boolean} - validation result
 */
export function isValidContractFunctionName(name: string): boolean {
  return VALID_CONTRACT_FUNCTION_NAMES.includes(name);
}

/**
 * Unpads a memo string, so it removes nulls.
 *
 * Useful when memo is fill up the length. Result is becomes readable.
 *
 * @param {string} memo - the string to be validated
 * @returns {boolean} - the validation result
 */
export function unpadMemo(memo: string): string {
  const end = memo.indexOf('\u0000');
  if (end < 0) return memo;
  return memo.slice(0, end);
}

/**
 * Generate a multisig address from multiple STX public keys
 *
 * @param {string[]} pubKeys - list of public keys as strings
 * @param {AddressVersion} addressVersion - MainnetMultiSig, TestnetMultiSig
 * @param {AddressHashMode} addressHashMode - SerializeP2SH
 * @param {number} [signaturesRequired] - number of signatures required, default value its 2
 * @returns {address: string, hash160: string} - a multisig address
 */
export function getSTXAddressFromPubKeys(
  pubKeys: string[],
  addressVersion: AddressVersion = AddressVersion.MainnetMultiSig,
  addressHashMode: AddressHashMode = AddressHashMode.SerializeP2SH,
  signaturesRequired = 2
): { address: string; hash160: string } {
  if (pubKeys.length === 0) {
    throw new Error('Invalid number of public keys');
  }
  if (!pubKeys.every(isValidPublicKey)) {
    throw new Error('Invalid public keys');
  }
  if (signaturesRequired > pubKeys.length) {
    throw new Error('Number of signatures required must be lower or equal to the number of Public Keys');
  }

  const stxPubKeys = pubKeys.map(createStacksPublicKey);
  const address = addressFromPublicKeys(addressVersion, addressHashMode, signaturesRequired, stxPubKeys);

  return { address: addressToString(address), hash160: address.hash160 };
}

/**
 * signs a string message
 *
 * @param keyPair
 * @param data  - message to be signed
 * @returns signed message string
 */
export function signMessage(keyPair: KeyPair, data: string): string {
  const prv = keyPair.getKeys().prv;
  if (prv) {
    return signWithKey(createStacksPrivateKey(prv), data).data;
  } else {
    throw new SigningError('Missing private key');
  }
}

/**
 * Verifies a signed message
 *
 * The signature must be 130 bytes long -- see RECOVERABLE_ECDSA_SIG_LENGTH_BYTES
 * in @stacks/transactions/src/constants.ts
 *
 * @param {string} message - message to verify the signature
 * @param {string} signature - signature to verify
 * @param {string} publicKey - public key as hex string used to verify the signature
 * @returns {boolean} - verification result
 */
export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  if (!isValidPublicKey(publicKey)) return false;
  if (signature.length !== 130) return false;
  if (!allHexChars(signature)) throw new UtilsError('Invalid signature input to verifySignature');
  if (_.isEmpty(message)) throw new UtilsError('Cannot verify empty messages');

  // provided publicKey can be compressed or uncompressed
  const keyEncoding = publicKey.length === 66 ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed;

  const messageSig = createMessageSignature(signature);

  const foundKey = publicKeyFromSignature(message, messageSig, keyEncoding);

  return foundKey === publicKey;
}

/**
 * Process address into address and memo id
 *
 * @param {string} address the address to process
 * @returns {Object} object containing address and memo id
 */
export function getAddressDetails(address: string): AddressDetails {
  const addressDetails = url.parse(address);
  const queryDetails = addressDetails.query ? new URLSearchParams(addressDetails.query) : undefined;
  const baseAddress = addressDetails.pathname as string;
  if (!isValidAddress(baseAddress)) {
    throw new UtilsError(`invalid address: ${address}`);
  }
  // address doesn't have a memo id
  if (baseAddress === address) {
    return {
      address: address,
      memoId: undefined,
    };
  }

  if (!queryDetails || _.isNil(queryDetails.get('memoId'))) {
    // if there are more properties, the query details need to contain the memo id property
    throw new UtilsError(`invalid address with memo id: ${address}`);
  }
  const memoId = queryDetails.get('memoId') as string;
  const intMemoId = parseInt(memoId, 10);
  if (isNaN(intMemoId) || intMemoId < 0) {
    throw new Error(`invalid memo id: ${memoId}`);
  }

  return {
    address: baseAddress,
    memoId,
  };
}

/**
 * Validate and return address with appended memo id
 *
 * @param {AddressDetails} addressDetails
 * @returns {string} address with memo id
 */
export function normalizeAddress({ address, memoId }: AddressDetails): string {
  if (!isValidAddress(address)) {
    throw new UtilsError(`invalid address: ${address}`);
  }
  if (!_.isUndefined(memoId)) {
    const intMemoId = parseInt(memoId, 10);
    if (isNaN(intMemoId) || intMemoId < 0) {
      throw new Error(`invalid memo id: ${memoId}`);
    }
    return `${address}?memoId=${memoId}`;
  }
  return address;
}

/**
 * Return boolean indicating whether input is a valid address with memo id
 *
 * @param {string} address address in the form <address>?memoId=<memoId>
 * @returns {boolean} true is input is a valid address
 */
export function isValidAddressWithPaymentId(address: string): boolean {
  try {
    const addressDetails = getAddressDetails(address);
    return address === normalizeAddress(addressDetails);
  } catch (e) {
    return false;
  }
}

/**
 * Return string representation of clarity value input
 *
 * @param {ClarityValue} cv clarity value function argument
 * @returns {String} stringified clarity value
 */
export function stringifyCv(cv: ClarityValue): any {
  switch (cv.type) {
    case ClarityType.Int:
    case ClarityType.UInt:
      return { type: cv.type, value: cv.value.toString() };
    case ClarityType.OptionalSome:
      return { type: cv.type, value: stringifyCv(cv.value) };
    case ClarityType.Tuple:
      return {
        type: cv.type,
        data: _.mapValues(cv.data, (value) => stringifyCv(value)),
      };
    case ClarityType.List:
      return {
        type: cv.type,
        list: cv.list.map(stringifyCv),
      };
    default:
      return cv;
  }
}

/**
 * Parse functionArgs into send params for send-many-memo contract calls
 *
 * @param {ClarityValue[]} args functionArgs from a contract call payload
 * @returns {SendParams[]} An array of sendParams
 */
export function functionArgsToSendParams(args: ClarityValue[]): SendParams[] {
  if (args.length !== 1 || args[0].type !== ClarityType.List) {
    throw new InvalidTransactionError("function args don't match send-many-memo type declaration");
  }
  return args[0].list.map((tuple) => {
    if (
      tuple.type !== ClarityType.Tuple ||
      tuple.data.to?.type !== ClarityType.PrincipalStandard ||
      tuple.data.ustx?.type !== ClarityType.UInt ||
      tuple.data.memo?.type !== ClarityType.Buffer
    ) {
      throw new InvalidTransactionError("function args don't match send-many-memo type declaration");
    }
    return {
      address: cvToString(tuple.data.to),
      amount: cvToValue(tuple.data.ustx, true),
      memo: tuple.data.memo.buffer.toString('ascii'),
    };
  });
}

/**
 * Gets the version of an address
 *
 * @param {String} address the address with or without the memoId
 * @returns {AddressVersion} A number that represent the Address Version
 */
export function getAddressVersion(address: string): AddressVersion {
  const baseAddress = getAddressDetails(address).address;
  return createAddress(baseAddress).version;
}

/**
 * Returns a STX pub key from an xpub
 *
 * @param {String} xpub an xpub
 * @returns {String} a compressed STX pub key
 */
export function xpubToSTXPubkey(xpub: string, compressed = true): string {
  return new KeyPair({ pub: xpub }).getKeys(compressed).pub;
}

/**
 * Returns the base address portion of an address
 *
 * @param {String} address - an address
 * @returns {String} - the base address
 */
export function getBaseAddress(address: string): string {
  const addressDetails = getAddressDetails(address);
  return addressDetails.address;
}

/**
 * Compares an address to the base address to check if matchs.
 *
 * @param {String} address - an address
 * @param {String} baseAddress - a base address
 * @returns {boolean}
 */
export function isSameBaseAddress(address: string, baseAddress: string): boolean {
  if (!isValidAddressWithPaymentId(address)) {
    throw new UtilsError(`invalid address: ${address}`);
  }
  return getBaseAddress(address) === getBaseAddress(baseAddress);
}
