/**
 * Kaspa (KAS) Test Fixtures
 *
 * Pre-generated test vectors for unit tests.
 * Keys and addresses are for testing only — do NOT use on mainnet.
 */

export const TEST_ACCOUNT = {
  /** Raw private key hex (32 bytes) */
  privateKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  /** Compressed secp256k1 public key hex (33 bytes) */
  publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  /** Mainnet Kaspa address (bech32m) */
  mainnetAddress: 'kaspa:qpfwafqhhryvz3x960f7qx34rmkxq9yxqzv4mrp9c9l6m99vx4zszvp5l9hs',
};

export const TEST_ACCOUNT_2 = {
  privateKey: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  publicKey: '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5',
  mainnetAddress: 'kaspa:qpjaxqgrwacgsyfgwnzl5ae2kd6cr0e63unp0gsprp2em67sq6y5sz4tln3sd',
};

/** Example UTXO for testing */
export const TEST_UTXO = {
  transactionId: 'aabbccdd00112233445566778899aabbccdd00112233445566778899aabbccdd',
  index: 0,
  amount: BigInt('100000000'), // 1 KAS in sompi
  scriptPublicKey: {
    version: 0,
    script: '20' + 'be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' + 'ac',
  },
  blockDaaScore: BigInt('1000'),
  isCoinbase: false,
};

/** Example transaction parameters */
export const TEST_TX_PARAMS = {
  sender: 'kaspa:qpfwafqhhryvz3x960f7qx34rmkxq9yxqzv4mrp9c9l6m99vx4zszvp5l9hs',
  recipient: 'kaspa:qpjaxqgrwacgsyfgwnzl5ae2kd6cr0e63unp0gsprp2em67sq6y5sz4tln3sd',
  amount: BigInt('50000000'), // 0.5 KAS
  fee: BigInt('10000'), // 0.0001 KAS fee
};
