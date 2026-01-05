/**
 * Tempo Utility Functions
 *
 * Since Tempo is EVM-compatible, we can reuse Ethereum utilities
 */

import { bip32 } from '@bitgo/secp256k1';
import { isValidAddress as isValidEthAddress, bufferToHex, setLengthRight } from 'ethereumjs-util';
import EthereumAbi from 'ethereumjs-abi';
import BigNumber from 'bignumber.js';
import { TIP20_DECIMALS } from './constants';
import type { Address, Hex } from './types';

/**
 * Check if address is valid Ethereum-style address
 * Uses ethereumjs-util's isValidAddress for proper validation including checksum
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  return isValidEthAddress(address);
}

/**
 * Check if public key is valid (BIP32 xpub format)
 * TODO: Replace with ETH utils when implementing
 */
export function isValidPublicKey(publicKey: string): boolean {
  if (typeof publicKey !== 'string') {
    return false;
  }
  try {
    const hdNode = bip32.fromBase58(publicKey);
    return hdNode.isNeutered();
  } catch (e) {
    return false;
  }
}

/**
 * Check if private key is valid (BIP32 xprv format)
 * TODO: Replace with ETH utils when implementing
 */
export function isValidPrivateKey(privateKey: string): boolean {
  if (typeof privateKey !== 'string') {
    return false;
  }
  try {
    const hdNode = bip32.fromBase58(privateKey);
    return !hdNode.isNeutered();
  } catch (e) {
    return false;
  }
}

/**
 * TIP-20 Utility Functions
 */

/**
 * Convert human-readable amount to TIP-20 units (6 decimals)
 * @param amount - Human-readable amount (e.g., "1.5")
 * @returns Amount in TIP-20 smallest units as bigint
 * @example amountToTip20Units("1.5") => 1500000n
 */
export function amountToTip20Units(amount: string): bigint {
  try {
    const bn = new BigNumber(amount);
    if (bn.isNaN() || !bn.isFinite()) {
      throw new Error('Invalid number');
    }
    // Multiply by 10^decimals to convert to units
    const units = bn.multipliedBy(new BigNumber(10).pow(TIP20_DECIMALS));
    // Check if result has decimal places (not valid for units)
    if (!units.isInteger()) {
      throw new Error('Amount has too many decimal places');
    }
    return BigInt(units.toFixed(0));
  } catch (error) {
    throw new Error(`Invalid amount format: ${amount}. Expected decimal string.`);
  }
}

/**
 * Convert TIP-20 units (6 decimals) to human-readable amount
 * @param units - Amount in TIP-20 smallest units
 * @returns Human-readable amount string
 * @example tip20UnitsToAmount(1500000n) => "1.5"
 */
export function tip20UnitsToAmount(units: bigint): string {
  const bn = new BigNumber(units.toString());
  const divisor = new BigNumber(10).pow(TIP20_DECIMALS);
  return bn.dividedBy(divisor).toFixed();
}

/**
 * Convert string to bytes32 for memo field
 * @param memo - Memo string to encode
 * @returns Hex-encoded bytes32 value
 * @example stringToBytes32("INVOICE-001") => "0x494e564f4943452d30303100..."
 */
export function stringToBytes32(memo: string): Hex {
  const memoByteLength = new TextEncoder().encode(memo).length;
  if (memoByteLength > 32) {
    throw new Error(`Memo too long: ${memoByteLength} bytes. Maximum 32 bytes.`);
  }

  // Convert string to buffer and pad to 32 bytes (left-aligned, right-padded with zeros)
  const memoBuffer = Buffer.from(memo, 'utf8');
  const paddedBuffer = setLengthRight(memoBuffer, 32);
  return bufferToHex(paddedBuffer) as Hex;
}

/**
 * Encode TIP-20 transferWithMemo function call using ethereumjs-abi
 * @param to - Recipient address
 * @param amount - Amount in TIP-20 units (bigint)
 * @param memo - Optional memo string
 * @returns Encoded function call data
 */
export function encodeTip20TransferWithMemo(to: Address, amount: bigint, memo?: string): Hex {
  const memoBytes = memo ? stringToBytes32(memo) : bufferToHex(setLengthRight(Buffer.from(''), 32));

  // Get the method ID for transferWithMemo
  const types = ['address', 'uint256', 'bytes32'];
  const methodId = EthereumAbi.methodID('transferWithMemo', types);

  // Encode the arguments - convert bigint to hex string for ABI encoding
  const amountHex = '0x' + amount.toString(16);
  const args = EthereumAbi.rawEncode(types, [to, amountHex, memoBytes]);

  // Combine method ID and encoded arguments
  return bufferToHex(Buffer.concat([methodId, args])) as Hex;
}

/**
 * Validate TIP-20 amount format
 * @param amount - Amount string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTip20Amount(amount: string): boolean {
  if (typeof amount !== 'string' || amount.trim() === '') {
    return false;
  }
  // Check for negative amounts before parsing
  if (amount.startsWith('-')) {
    return false;
  }
  try {
    const parsed = amountToTip20Units(amount);
    return parsed >= 0n;
  } catch {
    return false;
  }
}

const utils = {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
  amountToTip20Units,
  tip20UnitsToAmount,
  stringToBytes32,
  encodeTip20TransferWithMemo,
  isValidTip20Amount,
};

export default utils;
