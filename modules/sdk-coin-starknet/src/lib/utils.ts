import { computeHashOnElements } from '@scure/starknet';
import { FELT_MAX, MASK_128, OZ_ETH_ACCOUNT_CLASS_HASH, ADDR_BOUND, CONTRACT_ADDRESS_PREFIX } from './constants';
import { StarknetTransactionData, StarknetCall, ParsedTransferData } from './iface';
import { ecc } from '@bitgo/secp256k1';

/**
 * Normalize a Starknet address to canonical form: 0x + 64 hex chars, zero-padded.
 */
export function normalizeAddress(address: string): string {
  const hex = address.startsWith('0x') ? address.slice(2) : address;
  return '0x' + hex.padStart(64, '0').toLowerCase();
}

/**
 * Starknet addresses are felt252 values represented as 0x-prefixed hex.
 * Valid range: 0 < address < FELT_MAX, with 0x prefix and hex chars.
 */
export function isValidAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  if (!address.match(/^0x[0-9a-fA-F]{1,64}$/)) return false;
  try {
    const val = BigInt(address);
    return val > 0n && val < FELT_MAX;
  } catch {
    return false;
  }
}

/**
 * Validate a secp256k1 public key (compressed 33 bytes or uncompressed 65 bytes).
 */
export function isValidPublicKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  try {
    const buf = Buffer.from(key, 'hex');
    if (buf.length === 33 && (buf[0] === 0x02 || buf[0] === 0x03)) {
      ecc.pointCompress(buf, true);
      return true;
    }
    if (buf.length === 65 && buf[0] === 0x04) {
      ecc.pointCompress(buf, true);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate a secp256k1 private key (32 bytes hex).
 */
export function isValidPrivateKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  return /^[0-9a-fA-F]{64}$/.test(key);
}

/**
 * Get uncompressed public key (x || y, 128 hex chars, no 04 prefix).
 */
export function getUncompressedPublicKey(compressedHex: string): string {
  const buf = Buffer.from(compressedHex, 'hex');
  if (buf.length === 65 && buf[0] === 0x04) {
    return compressedHex.slice(2);
  }
  if (buf.length === 33 && (buf[0] === 0x02 || buf[0] === 0x03)) {
    const uncompressed = Buffer.from(ecc.pointCompress(buf, false));
    return uncompressed.toString('hex').slice(2);
  }
  if (buf.length === 64) {
    return compressedHex;
  }
  throw new Error(`Invalid public key format: ${compressedHex.substring(0, 10)}...`);
}

/**
 * Compile EthAccount constructor calldata from full secp256k1 public key.
 * Returns [x_low, x_high, y_low, y_high] as felt252 strings.
 */
export function compileEthAccountConstructorCalldata(fullPublicKey: string): string[] {
  const pubX = BigInt('0x' + fullPublicKey.slice(0, 64));
  const pubY = BigInt('0x' + fullPublicKey.slice(64));

  return [
    '0x' + (pubX & MASK_128).toString(16),
    '0x' + (pubX >> 128n).toString(16),
    '0x' + (pubY & MASK_128).toString(16),
    '0x' + (pubY >> 128n).toString(16),
  ];
}

/**
 * Compute Starknet contract address from hash components.
 * Replicates starknet.js calculateContractAddressFromHash using @scure/starknet pedersen.
 */
export function calculateContractAddressFromHash(
  salt: string,
  classHash: string,
  constructorCalldata: string[],
  deployerAddress: number | bigint
): string {
  const calldataHash = computeHashOnElements(constructorCalldata.map(BigInt)) as string;
  const rawHash = computeHashOnElements([
    CONTRACT_ADDRESS_PREFIX,
    BigInt(deployerAddress),
    BigInt(salt),
    BigInt(classHash),
    BigInt(calldataHash),
  ]) as string;
  return normalizeAddress('0x' + (BigInt(rawHash) % ADDR_BOUND).toString(16));
}

/**
 * Compute Starknet EthAccount counterfactual address from public key.
 */
export function computeStarknetAddress(fullPublicKey: string): {
  address: string;
  constructorCalldata: string[];
  salt: string;
} {
  const constructorCalldata = compileEthAccountConstructorCalldata(fullPublicKey);

  const pubX = BigInt('0x' + fullPublicKey.slice(0, 64));
  const salt = '0x' + (pubX % FELT_MAX).toString(16);

  const address = calculateContractAddressFromHash(salt, OZ_ETH_ACCOUNT_CLASS_HASH, constructorCalldata, 0);

  return { address, constructorCalldata, salt };
}

/**
 * Derive Starknet EthAccount address from compressed secp256k1 public key.
 */
export function getAddressFromPublicKey(compressedPublicKey: string): string {
  const fullPublicKey = getUncompressedPublicKey(compressedPublicKey);
  const { address } = computeStarknetAddress(fullPublicKey);
  return address;
}

/**
 * Format ECDSA signature for Starknet EthAccount.
 * Returns [r_low, r_high, s_low, s_high, v].
 */
export function formatEthAccountSignature(r: string, s: string, recid: number): string[] {
  const rBig = BigInt('0x' + r);
  const sBig = BigInt('0x' + s);
  const v = BigInt(recid);

  return [
    '0x' + (rBig & MASK_128).toString(16),
    '0x' + (rBig >> 128n).toString(16),
    '0x' + (sBig & MASK_128).toString(16),
    '0x' + (sBig >> 128n).toString(16),
    '0x' + v.toString(16),
  ];
}

/**
 * Extract recipient, amount, and token contract from a transfer call.
 * Reverse of TransferBuilder.compileTransferCalldata: calldata = [recipient, amount_low, amount_high].
 */
export function parseTransferCall(call: StarknetCall): ParsedTransferData | undefined {
  if (call.entrypoint !== 'transfer' || call.calldata.length < 3) {
    return undefined;
  }
  const amountLow = BigInt(call.calldata[1]);
  const amountHigh = BigInt(call.calldata[2]);
  const amount = ((amountHigh << 128n) | amountLow).toString();
  return {
    recipient: call.calldata[0],
    amount,
    tokenContract: call.contractAddress,
  };
}

/**
 * Generate a new secp256k1 key pair.
 */
export function generateKeyPair(seed?: Buffer): { pub: string; prv: string } {
  const { KeyPair: StarknetKeyPair } = require('./keyPair');
  const keyPair = seed ? new StarknetKeyPair({ seed }) : new StarknetKeyPair();
  const { pub, prv } = keyPair.getKeys();
  if (!prv) {
    throw new Error('Private key is missing in the generated key pair.');
  }
  return { pub, prv };
}

/**
 * Validate raw transaction data has required fields.
 */
export function validateRawTransaction(tx: StarknetTransactionData): void {
  if (!tx.senderAddress) {
    throw new Error('Missing sender address');
  }
  if (!isValidAddress(tx.senderAddress)) {
    throw new Error(`Invalid sender address: ${tx.senderAddress}`);
  }
}

export default {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
  getUncompressedPublicKey,
  compileEthAccountConstructorCalldata,
  calculateContractAddressFromHash,
  computeStarknetAddress,
  getAddressFromPublicKey,
  normalizeAddress,
  formatEthAccountSignature,
  parseTransferCall,
  generateKeyPair,
  validateRawTransaction,
};
