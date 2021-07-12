import BigNumber from 'bignumber.js';
import { bufferToHex, stripHexPrefix } from 'ethereumjs-util';
import {
  AddressHashMode,
  StacksTransaction,
  TransactionVersion,
  addressFromVersionHash,
  addressHashModeToVersion,
  addressToString,
  validateStacksAddress,
  deserializeTransaction,
  BufferReader,
  createMemoString,
  MEMO_MAX_LENGTH_BYTES,
  AddressVersion,
  addressFromPublicKeys,
  createStacksPublicKey,
  signWithKey,
  createStacksPrivateKey,
  PubKeyEncoding,
  publicKeyFromSignature,
  createMessageSignature,
} from '@stacks/transactions';
import { ec } from 'elliptic';
import { StacksNetwork } from '@stacks/network';
import { isEmpty } from 'lodash';
import { isValidXpub, isValidXprv } from '../../utils/crypto';
import { InvalidParameterValueError, SigningError, UtilsError } from '../baseCoin/errors';
import { KeyPair } from '.';

const ContractFunctionNames = [
  'stack-stx',
  'delegate-stx',
  'delegate-stack-stx',
  'stack-aggregation-commit',
  'revoke-delegate-stx',
];
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
  transactionVersion: TransactionVersion,
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
      tx.version,
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
  return maybe.match(/^[0-9a-f]+$/i) !== null;
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
 * @param {StacksNetwork} network - network object
 * @returns {boolean} - the validation result
 */
export function isValidContractAddress(addr: string, network: StacksNetwork): boolean {
  if (network.isMainnet()) {
    return addr === 'SP000000000000000000002Q6VF78';
  } else if (network.version === TransactionVersion.Testnet) {
    return true;
  }
  throw new InvalidParameterValueError('Network should be either Mainnet or Testnet');
}

/**
 * Check if the name is one of valid contract names
 *
 * @param {string} name - function name
 * @returns {boolean} - validation result
 */
export function isValidContractFunctionName(name: string): boolean {
  return ContractFunctionNames.includes(name);
}

/**
 * Pads a memo string with nulls to fill up the length
 *
 * Useful when comparing a memo in a transaction against a string.
 *
 * @param {string} memo - the string to be validated
 * @returns {boolean} - the validation result
 */
export function padMemo(memo: string): string {
  return memo.padEnd(MEMO_MAX_LENGTH_BYTES, '\u0000');
}

/**
 * Generate a multisig address from multiple STX public keys
 *
 * @param {string[]} pubKeys - list of public keys as strings
 * @param {AddressVersion} addressVersion - MainnetMultiSig, TestnetMultiSig
 * @param {AddressHashMode} addressHashMode - SerializeP2SH
 * @returns {address: string, hash160: string} - a multisig address
 */
export function getSTXAddressFromPubKeys(
  pubKeys: string[],
  addressVersion: AddressVersion = AddressVersion.MainnetMultiSig,
  addressHashMode: AddressHashMode = AddressHashMode.SerializeP2SH,
): { address: string; hash160: string } {
  if (pubKeys.length === 0) {
    throw new Error('Invalid number of public keys');
  }
  if (!pubKeys.every(isValidPublicKey)) {
    throw new Error('Invalid public keys');
  }

  const stxPubKeys = pubKeys.map(createStacksPublicKey);
  const address = addressFromPublicKeys(addressVersion, addressHashMode, stxPubKeys.length, stxPubKeys);

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
  if (!this.isValidPublicKey(publicKey)) return false;
  if (signature.length !== 130) return false;
  if (!allHexChars(signature)) throw new UtilsError('Invalid signature input to verifySignature');
  if (isEmpty(message)) throw new UtilsError('Cannot verify empty messages');

  // provided publicKey can be compressed or uncompressed
  const keyEncoding = publicKey.length === 66 ? PubKeyEncoding.Compressed : PubKeyEncoding.Uncompressed;

  const messageSig = createMessageSignature(signature);

  const foundKey = publicKeyFromSignature(message, messageSig, keyEncoding);

  return foundKey === publicKey;
}
