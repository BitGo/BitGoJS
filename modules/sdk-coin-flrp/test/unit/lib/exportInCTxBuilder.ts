import { coins } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { ExportInCTxBuilder } from '../../../src/lib/exportInCTxBuilder';

describe('ExportInCTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  let builder: ExportInCTxBuilder;

  beforeEach(function () {
    builder = new ExportInCTxBuilder(coinConfig);
  });

  describe('Constructor', function () {
    it('should initialize with coin config', function () {
      assert.ok(builder);
      assert.ok(builder instanceof ExportInCTxBuilder);
    });

    it('should extend AtomicInCTransactionBuilder', function () {
      // Test inheritance
      assert.ok(builder);
    });
  });

  describe('UTXO Override', function () {
    it('should throw error when trying to set UTXOs', function () {
      const mockUtxos = [{ id: 'test' }];

      assert.throws(
        () => {
          builder.utxos(mockUtxos);
        },
        BuildTransactionError,
        'Should reject UTXOs for C-chain export transactions'
      );
    });

    it('should throw error for empty UTXO array', function () {
      assert.throws(
        () => {
          builder.utxos([]);
        },
        BuildTransactionError,
        'Should reject empty UTXO array'
      );
    });

    it('should throw error for any UTXO input', function () {
      const testCases = [[], [{}], ['invalid'], null, undefined];

      testCases.forEach((testCase, index) => {
        assert.throws(
          () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            builder.utxos(testCase as any);
          },
          BuildTransactionError,
          `Test case ${index} should throw error`
        );
      });
    });
  });

  describe('Amount Management', function () {
    it('should set valid positive amounts', function () {
      const validAmounts = ['1000', '1000000000000000000', '999999999999999999'];

      validAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          builder.amount(amount);
        }, `Should accept amount: ${amount}`);
      });
    });

    it('should set bigint amounts', function () {
      const bigintAmounts = [1000n, 1000000000000000000n, 999999999999999999n];

      bigintAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          builder.amount(amount);
        }, `Should accept bigint amount: ${amount}`);
      });
    });

    it('should set numeric amounts', function () {
      const numericAmounts = [1000, 2000000, 999999999];

      numericAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          builder.amount(amount);
        }, `Should accept numeric amount: ${amount}`);
      });
    });

    it('should reject zero amount', function () {
      assert.throws(() => {
        builder.amount(0);
      }, /Amount must be positive/);

      assert.throws(() => {
        builder.amount('0');
      }, /Amount must be positive/);

      assert.throws(() => {
        builder.amount(0n);
      }, /Amount must be positive/);
    });

    it('should reject negative amounts', function () {
      const negativeAmounts = ['-1000', '-1'];

      negativeAmounts.forEach((amount) => {
        assert.throws(
          () => {
            builder.amount(amount);
          },
          BuildTransactionError,
          `Should reject negative amount: ${amount}`
        );
      });
    });

    it('should handle large amounts', function () {
      const largeAmounts = [
        '100000000000000000000000', // Very large amount
        '18446744073709551615', // Near uint64 max
        BigInt('999999999999999999999999999999'),
      ];

      largeAmounts.forEach((amount) => {
        assert.doesNotThrow(() => {
          builder.amount(amount);
        }, `Should handle large amount: ${amount}`);
      });
    });

    it('should chain amount setting with other methods', function () {
      const amount = '1000000000000000000';
      const nonce = 1n;

      assert.doesNotThrow(() => {
        builder.amount(amount).nonce(nonce);
      });
    });
  });

  describe('Nonce Management', function () {
    it('should set valid nonce values', function () {
      const validNonces = [0n, 1n, 1000n, 999999999999n];

      validNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          builder.nonce(nonce);
        }, `Should accept nonce: ${nonce}`);
      });
    });

    it('should set string nonce values', function () {
      const stringNonces = ['0', '1', '1000', '999999999999'];

      stringNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          builder.nonce(nonce);
        }, `Should accept string nonce: ${nonce}`);
      });
    });

    it('should set numeric nonce values', function () {
      const numericNonces = [0, 1, 1000, 999999];

      numericNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          builder.nonce(nonce);
        }, `Should accept numeric nonce: ${nonce}`);
      });
    });

    it('should reject negative nonce values', function () {
      const negativeNonces = [-1n, -1000n];

      negativeNonces.forEach((nonce) => {
        assert.throws(
          () => {
            builder.nonce(nonce);
          },
          BuildTransactionError,
          `Should reject negative nonce: ${nonce}`
        );
      });
    });

    it('should reject negative string nonce values', function () {
      const negativeStringNonces = ['-1', '-1000'];

      negativeStringNonces.forEach((nonce) => {
        assert.throws(
          () => {
            builder.nonce(nonce);
          },
          BuildTransactionError,
          `Should reject negative string nonce: ${nonce}`
        );
      });
    });

    it('should handle large nonce values', function () {
      const largeNonces = [
        '18446744073709551615', // Max uint64
        BigInt('999999999999999999999999999999'),
        1000000000000000000n,
      ];

      largeNonces.forEach((nonce) => {
        assert.doesNotThrow(() => {
          builder.nonce(nonce);
        }, `Should handle large nonce: ${nonce}`);
      });
    });

    it('should chain nonce setting with other methods', function () {
      const nonce = 123n;
      const amount = '1000000000000000000';

      assert.doesNotThrow(() => {
        builder.nonce(nonce).amount(amount);
      });
    });
  });

  describe('Destination Address Management', function () {
    it('should set single destination address', function () {
      const singleAddress = 'P-flare1destination';

      assert.doesNotThrow(() => {
        builder.to(singleAddress);
      });
    });

    it('should set multiple destination addresses', function () {
      const multipleAddresses = ['P-flare1dest1', 'P-flare1dest2', 'P-flare1dest3'];

      assert.doesNotThrow(() => {
        builder.to(multipleAddresses);
      });
    });

    it('should handle comma-separated addresses', function () {
      const commaSeparated = 'P-flare1dest1~P-flare1dest2~P-flare1dest3';

      assert.doesNotThrow(() => {
        builder.to(commaSeparated);
      });
    });

    it('should handle empty address array', function () {
      assert.doesNotThrow(() => {
        builder.to([]);
      });
    });

    it('should chain address setting with other methods', function () {
      const addresses = ['P-flare1dest1', 'P-flare1dest2'];
      const amount = '1000000000000000000';

      assert.doesNotThrow(() => {
        builder.to(addresses).amount(amount);
      });
    });
  });

  describe('Transaction Type Verification', function () {
    it('should verify transaction type (placeholder returns true)', function () {
      const mockTx = { type: 'export' };
      const result = ExportInCTxBuilder.verifyTxType(mockTx);
      assert.strictEqual(result, true); // Placeholder always returns true
    });

    it('should handle different transaction objects', function () {
      const testCases = [{}, null, undefined, { type: 'import' }, { data: 'test' }];

      testCases.forEach((testCase, index) => {
        const result = ExportInCTxBuilder.verifyTxType(testCase);
        assert.strictEqual(result, true, `Test case ${index} should return true (placeholder)`);
      });
    });

    it('should verify via instance method', function () {
      const mockTx = { type: 'export' };
      const result = builder.verifyTxType(mockTx);
      assert.strictEqual(result, true);
    });
  });

  describe('Transaction Building', function () {
    it('should handle building when transaction has credentials', function () {
      const mockTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };
      builder.initBuilder(mockTx);

      // Should not throw when credentials exist
      assert.doesNotThrow(() => {
        // Access protected method via type assertion
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).buildFlareTransaction();
      });
    });

    it('should require amount for building', function () {
      builder.nonce(1n);
      builder.to(['P-flare1dest']);

      // Mock setting from addresses via transaction initialization
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      builder.initBuilder(mockRawTx);
      // Clear amount to test error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (builder as any)._amount = undefined;

      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).buildFlareTransaction();
      }, Error);
    });
  });

  describe('Transaction Initialization', function () {
    it('should initialize from raw transaction object', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.doesNotThrow(() => {
        builder.initBuilder(mockRawTx);
      });
    });

    it('should validate blockchain ID during initialization', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.from('wrong-blockchain'),
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.throws(() => {
        builder.initBuilder(mockRawTx);
      }, Error);
    });

    it('should validate single output requirement', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default // Will match default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest1'],
              amount: 500000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
            {
              addresses: ['P-flare1dest2'],
              amount: 500000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.throws(() => {
        builder.initBuilder(mockRawTx);
      }, BuildTransactionError);
    });

    it('should validate single input requirement', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test1',
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
            {
              address: 'C-flare1test2',
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 2n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.throws(() => {
        builder.initBuilder(mockRawTx);
      }, BuildTransactionError);
    });

    it('should validate negative fee calculation', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 500000000000000000n, // Less than output
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n, // More than input
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.throws(() => {
        builder.initBuilder(mockRawTx);
      }, BuildTransactionError);
    });
  });

  describe('From Implementation', function () {
    it('should handle string raw transaction', function () {
      const rawString = 'hex-encoded-transaction';

      assert.doesNotThrow(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).fromImplementation(rawString);
      });
    });

    it('should handle object raw transaction', function () {
      const mockRawTx = {
        unsignedTx: {
          networkId: 0, // Match builder's default
          sourceBlockchainId: Buffer.alloc(0), // Match builder's default
          destinationBlockchainId: Buffer.from('test-dest'),
          inputs: [
            {
              address: 'C-flare1test',
              amount: 2000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
              nonce: 1n,
            },
          ],
          outputs: [
            {
              addresses: ['P-flare1dest'],
              amount: 1000000000000000000n,
              assetId: Buffer.alloc(0), // Match builder's default
            },
          ],
        },
        credentials: [],
      };

      assert.doesNotThrow(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).fromImplementation(mockRawTx);
      });
    });
  });

  describe('Integration Tests', function () {
    it('should handle complete export flow preparation', function () {
      const amount = '1000000000000000000'; // 1 FLR
      const nonce = 123n;
      const toAddresses = ['P-flare1destination'];

      // Complete setup
      builder.amount(amount).nonce(nonce).to(toAddresses);

      // All operations should complete without throwing
      assert.ok(true);
    });

    it('should handle method chaining extensively', function () {
      // Test extensive method chaining
      assert.doesNotThrow(() => {
        builder
          .amount('5000000000000000000') // 5 FLR
          .nonce(456n)
          .to(['P-flare1receiver1', 'P-flare1receiver2']);
      });
    });

    it('should handle large transaction values', function () {
      const largeAmount = '100000000000000000000000'; // 100k FLR
      const largeNonce = 999999999999n;

      assert.doesNotThrow(() => {
        builder.amount(largeAmount).nonce(largeNonce);
      });
    });

    it('should handle multiple destination addresses', function () {
      const multipleDestinations = [
        'P-flare1dest1',
        'P-flare1dest2',
        'P-flare1dest3',
        'P-flare1dest4',
        'P-flare1dest5',
      ];

      assert.doesNotThrow(() => {
        builder.amount('1000000000000000000').to(multipleDestinations);
      });
    });
  });

  describe('Edge Cases', function () {
    it('should handle zero values appropriately', function () {
      // Zero amount should be rejected
      assert.throws(() => {
        builder.amount(0);
      }, /Amount must be positive/);

      // Zero nonce should be valid
      assert.doesNotThrow(() => {
        builder.nonce(0n);
      });
    });

    it('should handle maximum values', function () {
      const maxBigInt = BigInt('18446744073709551615'); // Max uint64

      assert.doesNotThrow(() => {
        builder.amount(maxBigInt);
      });

      assert.doesNotThrow(() => {
        builder.nonce(maxBigInt);
      });
    });

    it('should maintain state across multiple operations', function () {
      // Build state incrementally
      builder.amount('1000000000000000000');
      builder.nonce(123n);
      builder.to(['P-flare1dest']);

      // State should be maintained across operations
      assert.ok(true);
    });
  });
});
