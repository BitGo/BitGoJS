/**
 * Tempo Utility Functions
 *
 * Since Tempo is EVM-compatible, we can reuse Ethereum utilities
 */

import { bip32 } from '@bitgo/secp256k1';
import { parseUnits, formatUnits, encodeFunctionData, pad, toHex, isAddress, type Address, type Hex } from 'viem';
import { TIP20_DECIMALS } from './constants';
import { TIP20_TRANSFER_WITH_MEMO_ABI } from './tip20Abi';

/**
 * Check if address is valid Ethereum-style address
 * Uses viem's isAddress for proper validation including checksum
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  return isAddress(address);
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
    return parseUnits(amount, TIP20_DECIMALS);
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
  return formatUnits(units, TIP20_DECIMALS);
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
  return pad(toHex(memo), { size: 32 });
}

/**
 * Encode TIP-20 transferWithMemo function call using viem
 * @param to - Recipient address
 * @param amount - Amount in TIP-20 units (bigint)
 * @param memo - Optional memo string
 * @returns Encoded function call data
 */
export function encodeTip20TransferWithMemo(to: Address, amount: bigint, memo?: string): Hex {
  const memoBytes = memo ? stringToBytes32(memo) : pad('0x', { size: 32 });

  return encodeFunctionData({
    abi: TIP20_TRANSFER_WITH_MEMO_ABI,
    functionName: 'transferWithMemo',
    args: [to, amount, memoBytes],
  });
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
    const parsed = parseUnits(amount, TIP20_DECIMALS);
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
