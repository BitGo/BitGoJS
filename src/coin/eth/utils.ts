import { Buffer } from 'buffer';
import assert from 'assert';
import { SigningError } from '../baseCoin/errors';
import { FieldData, TxData } from './iface';
import { signTx } from './signature';
import { KeyPair } from './keyPair';
import keccak256 from 'keccak256';
import BN from 'bn.js';
import Web3 from 'web3';
import _ from 'underscore';

export type ByteArray = number[];
const walletSimpleByteCode = '0x1'; //TODO: Replace with the actual bytecode
const walletSimpleAbi = []; // Replace with the actual simple ABI
const web3 = new Web3('https://public-node.testnet.rsk.co'); //TODO: This hardcoded server address will be removed

/**
 * Signs the transaction using the Eth elliptic curve
 *
 * @param transactionData
 * @param keyPair
 */
export async function sign(transactionData: TxData, keyPair: KeyPair): Promise<string> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const chainId = transactionData.chainId != undefined ? bufferToInt(transactionData.chainId as Buffer) : 0;
  console.log('Chain Id is: ', chainId);
  console.log('Private key ', keyPair.getKeys().prv);
  const privateKey = Buffer.from(keyPair.getKeys().prv as string, 'hex');
  return signTx(formatTransaction(transactionData), chainId, privateKey);
}

/**
 * Format transaction to be signed
 *
 * @param transactionData
 */
function formatTransaction(transactionData: TxData): TxData {
  return {
    gasLimit: web3.utils.toHex(transactionData.gasLimit as number),
    gasPrice: web3.utils.toHex(transactionData.gasPrice as number),
    nonce: web3.utils.toHex(transactionData.nonce as number),
    data: transactionData.data,
  };
}

/**
 * Returns the smart contract encoded data
 *
 * @param {string[]} args - the contract signers
 * @returns {string} - the smart contract encoded data
 */
export function getContractData(args: string[]): string {
  const contract = new web3.eth.Contract(walletSimpleAbi);
  const contractToDeploy = contract.deploy({
    data: walletSimpleByteCode,
    arguments: args,
  });

  return contractToDeploy.encodeABI();
}

/**
 * Returns whether or not the string is a valid Eth address
 *
 * @param {string} address - the address to validate
 * @returns {boolean} - the validation result
 */
export function isValidAddress(address: string): boolean {
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
    // If it's ALL lowercase or ALL upppercase
  } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
    return true;
    // Otherwise check each case
  } else {
    return checkAddressChecksum(address);
  }
}

/**
 * Checks if the given string is a checksummed address
 *
 * @function checkAddressChecksum
 * @param {string} address the given HEX address
 * @returns {boolean}
 */
function checkAddressChecksum(address: string): boolean {
  // Check each case
  address = address.replace(/^0x/i, '');
  const addressHash = sha3(address.toLowerCase()).replace(/^0x/i, '');
  for (let i = 0; i < 40; i++) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if (
      (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
      (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])
    ) {
      console.log('Pablo 5');
      return false;
    }
  }
  return true;
}

/**
 * Check if string is HEX, requires a 0x in front
 *
 * @function isHexStrict
 * @param {string} hex to be checked
 * @returns {boolean}
 */
function isHexStrict(hex: any): boolean {
  return (_.isString(hex) || _.isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(hex);
}

/**
 * Hashes values to a sha3 hash using keccak 256
 *
 * To hash a HEX string the hex must have 0x in front.
 *
 * @function sha3
 * @returns {string} the sha3 string
 */
const SHA3_NULL_S = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

/**
 * @param value
 */
function sha3(value: any): string {
  if (BN.isBN(value)) {
    value = value.toString();
  }

  if (isHexStrict(value) && /^0x/i.test(value.toString())) {
    value = hexToBytes(value);
  }

  const returnValue = keccak256(value).toString('hex');

  if (returnValue !== SHA3_NULL_S) {
    return '';
  } else {
    return returnValue;
  }
}

/**
 * Convert a hex string to a byte array
 *
 * Note: Implementation from crypto-js
 *
 * @function hexToBytes
 * @param {string} hex
 * @returns {Array} the byte array
 */
function hexToBytes(hex: any): ByteArray {
  hex = hex.toString(16);

  if (!isHexStrict(hex)) {
    throw new Error('Given value "' + hex + '" is not a valid hex string.');
  }

  hex = hex.replace(/^0x/i, '');
  let bytes: ByteArray = [];
  let c = 0;
  for (bytes = [], c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

/**
 * Returns whether or not the string is a valid Eth block hash
 *
 * @param {string} hash - the tx hash to validate
 * @returns {boolean} - the validation result
 */
export function isValidBlockHash(hash: string): boolean {
  //TODO: implement Eth block hash validation
  console.log(hash);
  return true;
}

/**
 * @param value
 */
export function padToEven(value: any): any {
  var a = value; // eslint-disable-line
  if (a.length % 2) {
    a = `0${a}`;
  }

  return a;
}

/**
 * @param str
 */
export function isHexPrefixed(str: string): boolean {
  return str.slice(0, 2) === '0x';
}

/**
 * @param str
 */
export function stripHexPrefix(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  return isHexPrefixed(str) ? str.slice(2) : str;
}

/**
 * @param a
 */
export function stripZeros(a: any): any {
  a = stripHexPrefix(a);
  let first = a[0];
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1);
    first = a[0];
  }
  return a;
}

/**
 * @param value
 */
export function isHexString(value: any): boolean {
  if (typeof value !== 'string' || !value.match(/^0x[0-9A-Fa-f]*$/)) {
    return false;
  }
  return true;
}

/**
 * @param i
 */
export function intToHex(i: any): string {
  var hex = i.toString(16); // eslint-disable-line
  return '0x' + hex;
}

/**
 * @param i
 */
export function toHex(i: any): string {
  if (isValidAddress(i)) {
    return '0x' + i.toLowerCase().replace(/^0x/i, '');
  }

  if (Buffer.isBuffer(i)) {
    return '0x' + i.toString('hex');
  }

  if (_.isString(i)) {
    if (i.indexOf('0x') === 0 || i.indexOf('0X') === 0) {
      return i;
    }
  }

  return intToHex(i);
}

/**
 * @param i
 */
export function intToBuffer(i: any): Buffer {
  const hex = intToHex(i);
  return new Buffer(padToEven(hex.slice(2)), 'hex');
}

/**
 * @param v
 */
export function toBuffer(v: any): Buffer {
  if (!Buffer.isBuffer(v)) {
    if (typeof v === 'string') {
      if (isHexString(v)) {
        v = Buffer.from(padToEven(stripHexPrefix(v)), 'hex');
      } else {
        v = Buffer.from(v);
      }
    } else if (typeof v === 'number') {
      v = intToBuffer(v);
    } else if (BN.isBN(v)) {
      v = v.toArrayLike(Buffer);
    } else {
      throw new Error('invalid type');
    }
  }
  return v;
}

/**
 * @param buf
 */
export function bufferToInt(buf: Buffer): number {
  return new BN(toBuffer(buf)).toNumber();
}

/**
 * @param v
 * @param field
 */
export function getFieldValue(v: any, field: FieldData): Buffer {
  v = toBuffer(v);

  if (v.toString('hex') === '00' && !field.allowZero) {
    v = Buffer.allocUnsafe(0);
  }

  if (field.allowLess && field.length) {
    v = stripZeros(v);
    assert(field.length >= v.length, 'The field ' + field.name + ' must not have more ' + field.length + ' bytes');
  } else if (!(field.allowZero && v.length === 0) && field.length) {
    assert(field.length === v.length, 'The field ' + field.name + ' must have byte length of ' + field.length);
  }
  return v;
}
