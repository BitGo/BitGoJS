import assert from 'assert';
import { describe, it } from 'mocha';
import { toChecksumAddress } from 'ethereumjs-util';
import { Tip20TransactionBuilder } from '../../src/lib/transactionBuilder';
import {
  amountToTip20Units,
  tip20UnitsToAmount,
  stringToBytes32,
  encodeTip20TransferWithMemo,
  isValidTip20Amount,
} from '../../src/lib/utils';
import { TIP20_DECIMALS } from '../../src/lib/constants';
import { coins } from '@bitgo/statics';

const mockCoinConfig = coins.get('ttempo');

describe('TIP-20 Utilities', () => {
  describe('amountToTip20Units', () => {
    it('should convert decimal amount to 6-decimal units', () => {
      assert.strictEqual(amountToTip20Units('1.5'), 1500000n);
      assert.strictEqual(amountToTip20Units('100'), 100000000n);
      assert.strictEqual(amountToTip20Units('0.000001'), 1n);
    });

    it('should throw error for invalid amount', () => {
      assert.throws(() => amountToTip20Units('invalid'), /Invalid amount format/);
    });
  });

  describe('tip20UnitsToAmount', () => {
    it('should convert 6-decimal units to human-readable amount', () => {
      assert.strictEqual(tip20UnitsToAmount(1500000n), '1.5');
      assert.strictEqual(tip20UnitsToAmount(100000000n), '100');
      assert.strictEqual(tip20UnitsToAmount(1n), '0.000001');
    });
  });

  describe('stringToBytes32', () => {
    it('should convert string to bytes32', () => {
      const result = stringToBytes32('12345');
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result.length, 66);
      assert.ok(result.startsWith('0x'));
    });

    it('should throw error for string longer than 32 bytes', () => {
      const longString = 'a'.repeat(33);
      assert.throws(() => stringToBytes32(longString), /Memo too long/);
    });
  });

  describe('encodeTip20TransferWithMemo', () => {
    it('should encode transferWithMemo call', () => {
      const to = toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
      const amount = 1500000n;
      const memo = '12345';

      const encoded = encodeTip20TransferWithMemo(to, amount, memo);
      assert.strictEqual(typeof encoded, 'string');
      assert.ok(encoded.startsWith('0x'));
      assert.ok(encoded.length > 10);
    });

    it('should encode transferWithMemo without memo', () => {
      const to = toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
      const amount = 1500000n;

      const encoded = encodeTip20TransferWithMemo(to, amount);
      assert.strictEqual(typeof encoded, 'string');
      assert.ok(encoded.startsWith('0x'));
    });
  });

  describe('isValidTip20Amount', () => {
    it('should validate correct amounts', () => {
      assert.strictEqual(isValidTip20Amount('1.5'), true);
      assert.strictEqual(isValidTip20Amount('100'), true);
      assert.strictEqual(isValidTip20Amount('0.000001'), true);
    });

    it('should invalidate incorrect amounts', () => {
      assert.strictEqual(isValidTip20Amount('invalid'), false);
      assert.strictEqual(isValidTip20Amount(''), false);
      assert.strictEqual(isValidTip20Amount('-5'), false);
    });
  });
});

describe('TIP-20 Transaction Builder', () => {
  const mockToken = toChecksumAddress('0x1234567890123456789012345678901234567890');
  const mockRecipient = toChecksumAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
  const mockFeeToken = toChecksumAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

  describe('addOperation', () => {
    it('should add a single operation without memo', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder.addOperation({
        token: mockToken,
        to: mockRecipient,
        amount: '100.5',
      });

      const operations = builder.getOperations();
      assert.strictEqual(operations.length, 1);
      assert.strictEqual(operations[0].token, mockToken);
      assert.strictEqual(operations[0].to, mockRecipient);
      assert.strictEqual(operations[0].amount, '100.5');
      assert.strictEqual(operations[0].memo, undefined);
    });

    it('should add a single operation with memo', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder.addOperation({
        token: mockToken,
        to: mockRecipient,
        amount: '100.5',
        memo: '202501',
      });

      const operations = builder.getOperations();
      assert.strictEqual(operations.length, 1);
      assert.strictEqual(operations[0].memo, '202501');
    });

    it('should add multiple operations (batch)', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: '50.0',
          memo: '1001',
        })
        .addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: '30.0',
          memo: '1002',
        })
        .addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: '20.0',
          memo: '1003',
        });

      const operations = builder.getOperations();
      assert.strictEqual(operations.length, 3);
      assert.strictEqual(operations[0].memo, '1001');
      assert.strictEqual(operations[1].memo, '1002');
      assert.strictEqual(operations[2].memo, '1003');
    });

    it('should throw error for invalid token address', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      assert.throws(() => {
        builder.addOperation({
          token: '0xinvalid' as any,
          to: mockRecipient,
          amount: '100',
        });
      }, /Invalid token address/);
    });

    it('should throw error for invalid recipient address', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      assert.throws(() => {
        builder.addOperation({
          token: mockToken,
          to: '0xinvalid' as any,
          amount: '100',
        });
      }, /Invalid recipient address/);
    });

    it('should throw error for invalid amount', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      assert.throws(() => {
        builder.addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: 'invalid-amount',
        });
      }, /Invalid amount/);
    });

    it('should throw error for memo longer than 32 bytes', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      const longMemo = 'a'.repeat(33);

      assert.throws(() => {
        builder.addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: '100',
          memo: longMemo,
        });
      }, /Memo too long/);
    });
  });

  describe('feeToken', () => {
    it('should set fee token', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder.feeToken(mockFeeToken);

      assert.strictEqual(builder.getFeeToken(), mockFeeToken);
    });

    it('should throw error for invalid fee token address', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      assert.throws(() => {
        builder.feeToken('invalid-address');
      }, /Invalid fee token address/);
    });
  });

  describe('Transaction parameters', () => {
    it('should set nonce', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.nonce(42);
      assert.strictEqual((builder as any)._nonce, 42);
    });

    it('should throw error for negative nonce', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(() => {
        builder.nonce(-1);
      }, /Invalid nonce/);
    });

    it('should set gas limit', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.gas(500000n);
      assert.strictEqual((builder as any)._gas, 500000n);
    });

    it('should set gas limit from string', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.gas('500000');
      assert.strictEqual((builder as any)._gas, 500000n);
    });

    it('should throw error for invalid gas limit', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(() => {
        builder.gas(0n);
      }, /Invalid gas limit/);
    });

    it('should set maxFeePerGas', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.maxFeePerGas(1000000000n);
      assert.strictEqual((builder as any)._maxFeePerGas, 1000000000n);
    });

    it('should set maxPriorityFeePerGas', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.maxPriorityFeePerGas(500000000n);
      assert.strictEqual((builder as any)._maxPriorityFeePerGas, 500000000n);
    });
  });

  describe('Method chaining', () => {
    it('should support fluent interface', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      const result = builder
        .addOperation({
          token: mockToken,
          to: mockRecipient,
          amount: '100',
          memo: '9999',
        })
        .feeToken(mockFeeToken)
        .nonce(10)
        .gas(400000n)
        .maxFeePerGas(2000000000n)
        .maxPriorityFeePerGas(1000000000n);

      assert.strictEqual(result, builder);
    });
  });
});

describe('TIP-20 Constants', () => {
  it('should have correct decimal places', () => {
    assert.strictEqual(TIP20_DECIMALS, 6);
  });
});
