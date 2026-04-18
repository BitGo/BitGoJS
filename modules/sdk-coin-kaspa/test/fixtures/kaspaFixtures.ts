/**
 * Kaspa test fixtures.
 * These are synthetic test vectors for unit testing the SDK module.
 */

import { KaspaTransactionData } from '../../src/lib/iface';

// Test key vectors (secp256k1)
export const testKeyData = {
  prv: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  pub: '03d6bfe100d1600c0d8f769501676fc74c3809500bd131c8a549f88cf616c21f35',
  mainnetAddress: '', // will be computed in tests
  testnetAddress: '', // will be computed in tests
};

// Test UTXO
export const testUtxo = {
  txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  outputIndex: 0,
  address: '', // will be set in tests based on derived address
  amount: '200000000', // 2 KASPA in sompi
  scriptPublicKey: '21' + '03d6bfe100d1600c0d8f769501676fc74c3809500bd131c8a549f88cf616c21f35' + 'ac',
};

// Test transaction data
export const testTransactionData: KaspaTransactionData = {
  version: 0,
  inputs: [
    {
      transactionId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      transactionIndex: 0,
      amount: '200000000',
      scriptPublicKey: '2103d6bfe100d1600c0d8f769501676fc74c3809500bd131c8a549f88cf616c21f35ac',
      signatureScript: '',
      sequence: '18446744073709551615',
      sigOpCount: 1,
    },
  ],
  outputs: [
    {
      address: '',
      amount: '100000000', // 1 KASPA
      scriptPublicKey: '2103d6bfe100d1600c0d8f769501676fc74c3809500bd131c8a549f88cf616c21f35ac',
    },
  ],
  lockTime: '0',
  subnetworkId: '0000000000000000000000000000000000000000',
  payload: '',
};

// Hex-serialized test transaction
export const testTransactionHex = Buffer.from(JSON.stringify(testTransactionData)).toString('hex');
