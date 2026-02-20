/**
 * Test resources for Tempo SDK
 */

// ============================================================================
// TIP-20 Token Addresses (Tempo Testnet)
// ============================================================================

export const TESTNET_TOKENS = {
  pathUSD: {
    address: '0x20c0000000000000000000000000000000000000',
    name: 'ttempo:pathusd',
  },
  alphaUSD: {
    address: '0x20c0000000000000000000000000000000000001',
    name: 'ttempo:alphausd',
  },
  betaUSD: {
    address: '0x20c0000000000000000000000000000000000002',
    name: 'ttempo:betausd',
  },
  thetaUSD: {
    address: '0x20c0000000000000000000000000000000000003',
    name: 'ttempo:thetausd',
  },
};

// Valid checksummed test recipient address
export const TEST_RECIPIENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

// ============================================================================
// Transaction Parameters
// ============================================================================

export const TX_PARAMS = {
  defaultGas: BigInt('100000'),
  defaultMaxFeePerGas: BigInt('2000000000'),
  defaultMaxPriorityFeePerGas: BigInt('1000000000'),
};

// ============================================================================
// Signature Test Data
// ============================================================================

export const SIGNATURE_TEST_DATA = {
  validSignature: {
    r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`,
    s: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321' as `0x${string}`,
    yParity: 0,
  },
};

// ============================================================================
// Memo Test Cases
// ============================================================================

export const MEMO_TEST_CASES = {
  valid: [
    { input: '12345', description: 'numeric' },
    { input: 'INV-001', description: 'alphanumeric with dash' },
    { input: 'a'.repeat(32), description: 'max length 32 bytes' },
    { input: '', description: 'empty string' },
  ],
  invalid: [{ input: 'a'.repeat(33), description: '33 bytes - exceeds limit' }],
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  noOperations: /At least one operation is required/,
  missingNonce: /Nonce is required/,
  missingGas: /Gas limit is required/,
  missingMaxFeePerGas: /maxFeePerGas is required/,
  missingMaxPriorityFeePerGas: /maxPriorityFeePerGas is required/,
  memoTooLong: /Memo too long/,
};
