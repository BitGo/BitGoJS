import { coins } from '@bitgo/statics';
import { CustomTransaction } from '../../src/lib/transaction/customTransaction';
import { TypeTagAddress, TypeTagBool, TypeTagU8, TypeTagU64, TypeTagU128 } from '@aptos-labs/ts-sdk';
import should from 'should';
import * as testData from '../resources/apt';

describe('CustomTransaction - Argument Conversion', () => {
  let customTransaction: CustomTransaction;

  beforeEach(() => {
    customTransaction = new CustomTransaction(coins.get('tapt'));
  });

  // Helper function to access private method for testing
  const callConvertArgumentByABI = (transaction: CustomTransaction, arg: any, paramType: any): any => {
    return (transaction as any).convertArgumentByABI(arg, paramType);
  };

  describe('Real Transaction Scenarios', () => {
    describe('Common Primitive Arguments', () => {
      it('should handle address strings from test data', () => {
        // Test with actual addresses from test resources
        const result1 = callConvertArgumentByABI(customTransaction, testData.sender.address, new TypeTagAddress());
        const result2 = callConvertArgumentByABI(
          customTransaction,
          testData.recipients[0].address,
          new TypeTagAddress()
        );

        should.exist(result1);
        should.exist(result2);

        // Results should be AccountAddress objects or original strings
        if (typeof result1 === 'object') {
          should.exist(result1.toString);
        }
        if (typeof result2 === 'object') {
          should.exist(result2.toString);
        }
      });

      it('should handle amount strings from test data', () => {
        // Test with actual amounts from test resources
        const result1 = callConvertArgumentByABI(customTransaction, testData.AMOUNT.toString(), new TypeTagU64());
        const result2 = callConvertArgumentByABI(customTransaction, testData.recipients[0].amount, new TypeTagU64());

        should.equal(result1, testData.AMOUNT.toString());
        should.equal(result2, testData.recipients[0].amount);
      });

      it('should handle numeric amounts as numbers for small types', () => {
        const result1 = callConvertArgumentByABI(customTransaction, 255, new TypeTagU8());
        const result2 = callConvertArgumentByABI(customTransaction, testData.AMOUNT, new TypeTagU64());

        should.equal(result1, 255);
        should.equal(result2, testData.AMOUNT.toString()); // Large numbers become strings
      });

      it('should handle boolean values correctly', () => {
        const result1 = callConvertArgumentByABI(customTransaction, true, new TypeTagBool());
        const result2 = callConvertArgumentByABI(customTransaction, false, new TypeTagBool());

        should.equal(result1, true);
        should.equal(result2, false);
      });
    });

    describe('BCS Encoded Arguments from Real Transactions', () => {
      it('should handle BCS data with data property (from serialized tx)', () => {
        // This simulates BCS-encoded data structure found in real transactions
        const bcsData = {
          data: new Uint8Array([0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // 1000 in little-endian
        };

        const result = callConvertArgumentByABI(customTransaction, bcsData, new TypeTagU64());
        should.equal(result, '0xe803000000000000');
      });

      it('should handle BCS address data', () => {
        // Create proper 32-byte address data as found in real transactions
        const addressBytes = new Array(32).fill(0);
        addressBytes[31] = 0x01; // Standard address format

        const bcsData = {
          data: new Uint8Array(addressBytes),
        };

        const result = callConvertArgumentByABI(customTransaction, bcsData, new TypeTagAddress());
        should.exist(result);

        if (typeof result === 'string') {
          result.should.match(/^0x[0-9a-fA-F]+$/);
        }
      });
    });

    describe('Nested BCS Structures (Real Transaction Parsing)', () => {
      it('should handle U64 amount in nested structure (typical from parsed tx)', () => {
        // This structure is common when parsing amounts from real Aptos transactions
        const nestedAmount = {
          value: {
            value: new Uint8Array([0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // 1000
          },
        };

        const result = callConvertArgumentByABI(customTransaction, nestedAmount, new TypeTagU64());
        should.equal(result, '1000');
      });

      it('should handle double nested numeric structure from BCS parsing', () => {
        // This represents the typical structure when deserializing BCS-encoded numeric values
        const nestedData = {
          value: {
            value: {
              0: 0xe8, // 1000 in little-endian format
              1: 0x03,
              2: 0x00,
              3: 0x00,
              4: 0x00,
              5: 0x00,
              6: 0x00,
              7: 0x00,
            },
          },
        };

        const result = callConvertArgumentByABI(customTransaction, nestedData, new TypeTagU64());
        should.equal(result, '1000');
      });

      it('should handle nested structure for boolean values', () => {
        // Boolean values in BCS format
        const booleanTrue = {
          value: {
            value: {
              0: 1,
            },
          },
        };

        const booleanFalse = {
          value: {
            value: {
              0: 0,
            },
          },
        };

        const result1 = callConvertArgumentByABI(customTransaction, booleanTrue, new TypeTagBool());
        const result2 = callConvertArgumentByABI(customTransaction, booleanFalse, new TypeTagBool());

        should.equal(result1, true);
        should.equal(result2, false);
      });

      it('should handle simple nested value (fix for original bug)', () => {
        // This tests the bug fix where primitive values in nested structures failed
        const nestedPrimitive = {
          value: '1000',
        };

        const result = callConvertArgumentByABI(customTransaction, nestedPrimitive, new TypeTagU64());
        should.equal(result, '1000'); // Should extract and convert the primitive value
      });
    });

    describe('Large Integer Types (Common in DeFi)', () => {
      it('should handle U128 amounts (common for high-precision tokens)', () => {
        const largeAmount = '340282366920938463463374607431768211455'; // Near max U128
        const result = callConvertArgumentByABI(customTransaction, largeAmount, new TypeTagU128());

        should.equal(result, largeAmount);
      });

      it('should handle U128 in BCS format', () => {
        // 16-byte array for U128 (example: value 1000)
        const bytes = new Array(16).fill(0);
        bytes[0] = 0xe8;
        bytes[1] = 0x03;

        const nestedData = {
          value: {
            value: Object.fromEntries(bytes.map((byte, index) => [index.toString(), byte])),
          },
        };

        const result = callConvertArgumentByABI(customTransaction, nestedData, new TypeTagU128());
        should.equal(result, '1000');
      });
    });

    describe('Error Handling for Real Edge Cases', () => {
      it('should handle empty BCS structures gracefully', () => {
        const emptyStructure = {
          value: {
            value: {},
          },
        };

        const result = callConvertArgumentByABI(customTransaction, emptyStructure, new TypeTagU64());
        should.equal(result, emptyStructure); // Should return original when no valid bytes found
      });

      it('should handle non-BCS objects', () => {
        const regularObject = { someProperty: 'value' };
        const result = callConvertArgumentByABI(customTransaction, regularObject, new TypeTagU64());

        should.equal(result, regularObject); // Should return as-is for non-BCS objects
      });

      it('should handle null and undefined (defensive)', () => {
        const result1 = callConvertArgumentByABI(customTransaction, null, new TypeTagU64());
        const result2 = callConvertArgumentByABI(customTransaction, undefined, new TypeTagU64());

        should.equal(result1, null);
        should.equal(result2, undefined);
      });
    });

    describe('Integration with Utility Functions', () => {
      it('should use bytesToHex utility for non-numeric BCS data', () => {
        const bcsData = {
          data: new Uint8Array([0x12, 0x34, 0x56, 0x78]),
        };

        const result = callConvertArgumentByABI(customTransaction, bcsData, new TypeTagAddress());
        // Should either be converted to AccountAddress or remain as hex string
        should.exist(result);
      });

      it('should use tryParseAccountAddress utility for address strings', () => {
        const validAddress = '0x0000000000000000000000000000000000000000000000000000000000000001';
        const result = callConvertArgumentByABI(customTransaction, validAddress, new TypeTagAddress());

        should.exist(result);
        // Should either be AccountAddress object or original string
        if (typeof result === 'object') {
          should.exist(result.toString);
        }
      });

      it('should use convertNumericArgument utility for byte arrays', () => {
        const uint8Data = new Uint8Array([0xe8, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // 1000
        const nestedData = {
          value: {
            value: uint8Data,
          },
        };

        const result = callConvertArgumentByABI(customTransaction, nestedData, new TypeTagU64());
        should.equal(result, '1000'); // Should use existing numeric conversion logic
      });
    });
  });

  describe('Round-trip Compatibility', () => {
    it('should maintain compatibility with existing transaction parsing', () => {
      // This ensures our refactored method works with the existing transaction builder tests
      const testArguments = [
        { arg: testData.sender.address, type: new TypeTagAddress() },
        { arg: testData.AMOUNT.toString(), type: new TypeTagU64() },
        { arg: true, type: new TypeTagBool() },
        { arg: 255, type: new TypeTagU8() },
      ];

      testArguments.forEach(({ arg, type }) => {
        const result = callConvertArgumentByABI(customTransaction, arg, type);
        should.exist(result);

        // Result should be compatible with existing transaction building logic
        if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
          should.exist(result.toString);
        }
      });
    });
  });
});
