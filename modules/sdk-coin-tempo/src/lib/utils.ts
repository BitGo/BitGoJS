/**
 * Tempo Utility Functions
 *
 * Since Tempo is EVM-compatible, we can reuse Ethereum utilities
 */

import { bip32 } from '@bitgo/secp256k1';
import { ethers } from 'ethers';
import { AA_TRANSACTION_TYPE, TEMPO_RPC_URLS, TIP20_DECIMALS } from './constants';
import { TIP20_ABI, TIP20_TRANSFER_WITH_MEMO_ABI } from './tip20Abi';

const AA_TX_HEX_REGEX = new RegExp(`^${AA_TRANSACTION_TYPE}[0-9a-f]*$`, 'i');

type Address = string;
type Hex = string;

/**
 * Check if address is valid Ethereum-style address
 * Uses ethers.js isAddress for proper validation including checksum
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') {
    return false;
  }
  return ethers.utils.isAddress(address);
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
    return BigInt(ethers.utils.parseUnits(amount, TIP20_DECIMALS).toString());
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
  return ethers.utils.formatUnits(units.toString(), TIP20_DECIMALS);
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
  const hexString = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(memo));
  return ethers.utils.hexZeroPad(hexString, 32);
}

/**
 * Encode TIP-20 transferWithMemo function call using ethers.js
 * @param to - Recipient address
 * @param amount - Amount in TIP-20 units (bigint)
 * @param memo - Optional memo string
 * @returns Encoded function call data
 */
export function encodeTip20TransferWithMemo(to: Address, amount: bigint, memo?: string): Hex {
  const memoBytes = memo ? stringToBytes32(memo) : ethers.utils.hexZeroPad('0x', 32);

  const iface = new ethers.utils.Interface(TIP20_TRANSFER_WITH_MEMO_ABI);
  return iface.encodeFunctionData('transferWithMemo', [to, amount, memoBytes]);
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
    const parsed = ethers.utils.parseUnits(amount, TIP20_DECIMALS);
    return parsed.gte(0);
  } catch {
    return false;
  }
}

/**
 * Check if a raw transaction string is a Tempo AA transaction (type 0x76)
 */
export function isTip20Transaction(raw: string): boolean {
  return AA_TX_HEX_REGEX.test(raw);
}

/**
 * Validate that a memoId is a valid non-negative integer string
 */
export function isValidMemoId(memoId: string): boolean {
  return typeof memoId === 'string' && /^(0|[1-9]\d*)$/.test(memoId);
}

/**
 * Resolve default Tempo JSON-RPC URL from base chain name.
 */
export function getTempoRpcUrlForBaseChain(baseChain: string): string {
  return baseChain === 'ttempo' ? TEMPO_RPC_URLS.TESTNET : TEMPO_RPC_URLS.MAINNET;
}

/**
 * Query TIP-20 balance via standard `balanceOf` eth_call.
 */
export async function queryTip20TokenBalance(
  rpcUrl: string,
  tokenContractAddress: string,
  walletAddress: string
): Promise<bigint> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const iface = new ethers.utils.Interface(TIP20_ABI);
  const data = iface.encodeFunctionData('balanceOf', [walletAddress]);
  const result = await provider.call({ to: ethers.utils.getAddress(tokenContractAddress), data });
  const [bal] = iface.decodeFunctionResult('balanceOf', result);
  return BigInt(bal.toString());
}

/**
 * Pending nonce for an address (for AA / account tx ordering).
 */
export async function getTempoAddressNonce(rpcUrl: string, address: string): Promise<number> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return provider.getTransactionCount(ethers.utils.getAddress(address), 'pending');
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
  isTip20Transaction,
  isValidMemoId,
  getTempoRpcUrlForBaseChain,
  queryTip20TokenBalance,
  getTempoAddressNonce,
};

export default utils;
