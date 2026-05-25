import { computeHashOnElements, poseidonHashMany, keccak } from '@scure/starknet';
import {
  FELT_MAX,
  MASK_128,
  OZ_ETH_ACCOUNT_CLASS_HASH,
  ADDR_BOUND,
  CONTRACT_ADDRESS_PREFIX,
  INVOKE_TX_PREFIX,
  TRANSACTION_VERSION_3,
  L1_GAS_NAME,
  L2_GAS_NAME,
  L1_DATA_GAS_NAME,
} from './constants';
import { StarknetTransactionData, StarknetCall, ParsedTransferData, InvokeTransactionHashParams } from './iface';
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

/**
 * Encode an ASCII string (max 31 chars) as a felt252.
 */
export function encodeShortString(str: string): bigint {
  if (str.length > 31) {
    throw new Error(`Short string too long: ${str.length} > 31`);
  }
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 127) {
      throw new Error(`Non-ASCII character at index ${i}: code ${code}`);
    }
  }
  let result = 0n;
  for (let i = 0; i < str.length; i++) {
    result = (result << 8n) | BigInt(str.charCodeAt(i));
  }
  return result;
}

/**
 * Compute the Starknet function selector: keccak256(name) masked to 250 bits.
 * @scure/starknet's keccak() already applies the 250-bit mask.
 */
export function getSelectorFromName(name: string): bigint {
  return keccak(Buffer.from(name, 'ascii'));
}

/**
 * Compile calls into the Cairo 1 multicall __execute__ calldata format.
 * Format: [num_calls, to_0, selector_0, data_len_0, ...data_0, to_1, ...]
 */
export function compileExecuteCalldata(calls: StarknetCall[]): string[] {
  const result: string[] = [];
  result.push('0x' + BigInt(calls.length).toString(16));
  for (const call of calls) {
    result.push(call.contractAddress);
    result.push('0x' + getSelectorFromName(call.entrypoint).toString(16));
    result.push('0x' + BigInt(call.calldata.length).toString(16));
    result.push(...call.calldata);
  }
  return result;
}

function encodeResourceBound(typeName: bigint, maxAmount: string, maxPricePerUnit: string): bigint {
  return (typeName << 192n) | (BigInt(maxAmount) << 128n) | BigInt(maxPricePerUnit);
}

/**
 * Compute the Poseidon V3 INVOKE transaction hash per SNIP-8.
 */
export function calculateInvokeTransactionHash(params: InvokeTransactionHashParams): string {
  const {
    senderAddress,
    compiledCalldata,
    chainId,
    nonce,
    resourceBounds,
    tip = '0x0',
    nonceDataAvailabilityMode = 0,
    feeDataAvailabilityMode = 0,
    paymasterData = [],
    accountDeploymentData = [],
    proofFacts,
  } = params;

  const feeFieldHash = poseidonHashMany([
    BigInt(tip),
    encodeResourceBound(L1_GAS_NAME, resourceBounds.l1_gas.max_amount, resourceBounds.l1_gas.max_price_per_unit),
    encodeResourceBound(L2_GAS_NAME, resourceBounds.l2_gas.max_amount, resourceBounds.l2_gas.max_price_per_unit),
    encodeResourceBound(
      L1_DATA_GAS_NAME,
      resourceBounds.l1_data_gas.max_amount,
      resourceBounds.l1_data_gas.max_price_per_unit
    ),
  ]);

  const daMode = (BigInt(nonceDataAvailabilityMode) << 32n) | BigInt(feeDataAvailabilityMode);

  const hashFields: bigint[] = [
    INVOKE_TX_PREFIX,
    TRANSACTION_VERSION_3,
    BigInt(senderAddress),
    feeFieldHash,
    poseidonHashMany(paymasterData.map(BigInt)),
    BigInt(chainId),
    BigInt(nonce),
    daMode,
    poseidonHashMany(accountDeploymentData.map(BigInt)),
    poseidonHashMany(compiledCalldata.map(BigInt)),
  ];

  if (proofFacts && proofFacts.length > 0) {
    hashFields.push(poseidonHashMany(proofFacts.map(BigInt)));
  }

  const hash = poseidonHashMany(hashFields);
  return '0x' + hash.toString(16);
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
  encodeShortString,
  getSelectorFromName,
  compileExecuteCalldata,
  calculateInvokeTransactionHash,
};
