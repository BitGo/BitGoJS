import assert from 'assert';
import { describe, it } from 'mocha';
import { ethers } from 'ethers';
import { Tip20TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Tip20Transaction } from '../../src/lib/transaction';
import {
  amountToTip20Units,
  tip20UnitsToAmount,
  stringToBytes32,
  encodeTip20TransferWithMemo,
  isValidTip20Amount,
} from '../../src/lib/utils';
import { TIP20_DECIMALS, AA_TRANSACTION_TYPE } from '../../src/lib/constants';
import { coins } from '@bitgo/statics';
import {
  TESTNET_TOKENS,
  TX_PARAMS,
  ERROR_MESSAGES,
  SIGNATURE_TEST_DATA,
  TEST_RECIPIENT_ADDRESS,
} from '../resources/tempo';

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
      assert.strictEqual(tip20UnitsToAmount(100000000n), '100.0');
      assert.strictEqual(tip20UnitsToAmount(1n), '0.000001');
    });
  });

  describe('stringToBytes32', () => {
    it('should convert string to bytes32', () => {
      const result = stringToBytes32('12345');
      assert.strictEqual(result.length, 66);
      assert.ok(result.startsWith('0x'));
    });

    it('should throw error for string longer than 32 bytes', () => {
      assert.throws(() => stringToBytes32('a'.repeat(33)), /Memo too long/);
    });
  });

  describe('encodeTip20TransferWithMemo', () => {
    it('should encode transferWithMemo call', () => {
      const to = ethers.utils.getAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
      const encoded = encodeTip20TransferWithMemo(to, 1500000n, '12345');
      assert.ok(encoded.startsWith('0x'));
      assert.ok(encoded.length > 10);
    });
  });

  describe('isValidTip20Amount', () => {
    it('should validate amounts correctly', () => {
      assert.strictEqual(isValidTip20Amount('1.5'), true);
      assert.strictEqual(isValidTip20Amount('invalid'), false);
      assert.strictEqual(isValidTip20Amount('-5'), false);
    });
  });
});

describe('TIP-20 Transaction Builder', () => {
  const mockToken = ethers.utils.getAddress('0x1234567890123456789012345678901234567890');
  const mockRecipient = ethers.utils.getAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
  const mockFeeToken = ethers.utils.getAddress('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');

  describe('addOperation', () => {
    it('should add operation with and without memo', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.addOperation({ token: mockToken, to: mockRecipient, amount: '100' });
      builder.addOperation({ token: mockToken, to: mockRecipient, amount: '50', memo: '1' });

      const operations = builder.getOperations();
      assert.strictEqual(operations.length, 2);
      assert.strictEqual(operations[0].memo, undefined);
      assert.strictEqual(operations[1].memo, '1');
    });

    it('should throw error for invalid addresses', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(
        () => builder.addOperation({ token: '0xinvalid' as any, to: mockRecipient, amount: '100' }),
        /Invalid token address/
      );
      assert.throws(
        () => builder.addOperation({ token: mockToken, to: '0xinvalid' as any, amount: '100' }),
        /Invalid recipient address/
      );
    });

    it('should throw error for invalid amount', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(
        () => builder.addOperation({ token: mockToken, to: mockRecipient, amount: 'invalid-amount' }),
        /Invalid amount/
      );
    });

    it('should throw error for memo longer than 32 bytes', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(
        () => builder.addOperation({ token: mockToken, to: mockRecipient, amount: '100', memo: 'a'.repeat(33) }),
        /Memo too long/
      );
    });
  });

  describe('feeToken', () => {
    it('should set and get fee token', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.feeToken(mockFeeToken);
      assert.strictEqual(builder.getFeeToken(), mockFeeToken);
    });

    it('should throw error for invalid fee token address', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(() => builder.feeToken('invalid-address'), /Invalid fee token address/);
    });
  });

  describe('Transaction parameters', () => {
    it('should set nonce, gas, maxFeePerGas, and maxPriorityFeePerGas', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.nonce(42).gas(500000n).maxFeePerGas(1000000000n).maxPriorityFeePerGas(500000000n);

      assert.strictEqual((builder as any)._nonce, 42);
      assert.strictEqual((builder as any)._gas, 500000n);
      assert.strictEqual((builder as any)._maxFeePerGas, 1000000000n);
      assert.strictEqual((builder as any)._maxPriorityFeePerGas, 500000000n);
    });

    it('should throw error for invalid nonce and gas', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(() => builder.nonce(-1), /Invalid nonce/);
      assert.throws(() => builder.gas(0n), /Invalid gas limit/);
    });
  });

  describe('Method chaining', () => {
    it('should support fluent interface', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      const result = builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100', memo: '5' })
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

describe('TIP-20 Transaction Build', () => {
  const mockToken = ethers.utils.getAddress(TESTNET_TOKENS.alphaUSD.address);
  const mockRecipient = ethers.utils.getAddress(TEST_RECIPIENT_ADDRESS);
  const mockFeeToken = ethers.utils.getAddress(TESTNET_TOKENS.betaUSD.address);

  describe('Build Transaction', () => {
    it('should build single-operation transaction', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100', memo: '1' })
        .feeToken(mockFeeToken)
        .nonce(0)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.ok(tx instanceof Tip20Transaction);
      assert.strictEqual(tx.getOperationCount(), 1);
      assert.strictEqual(tx.getFeeToken(), mockFeeToken);
    });

    it('should build batch transaction with multiple operations', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: TESTNET_TOKENS.alphaUSD.address, to: mockRecipient, amount: '10', memo: '1' })
        .addOperation({ token: TESTNET_TOKENS.betaUSD.address, to: mockRecipient, amount: '20', memo: '2' })
        .addOperation({ token: TESTNET_TOKENS.thetaUSD.address, to: mockRecipient, amount: '30', memo: '3' })
        .feeToken(mockFeeToken)
        .nonce(42)
        .gas(300000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.ok(tx instanceof Tip20Transaction);
      assert.strictEqual(tx.getOperationCount(), 3);
      assert.strictEqual(tx.isBatch(), true);
    });

    it('should build transaction without fee token', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '50' })
        .nonce(1)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.ok(tx instanceof Tip20Transaction);
      assert.strictEqual(tx.getFeeToken(), undefined);
    });
  });

  describe('Build Validation Errors', () => {
    it('should throw error when no operations added', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder.nonce(0).gas(100000n).maxFeePerGas(1000000000n).maxPriorityFeePerGas(500000000n);
      await assert.rejects(async () => await builder.build(), ERROR_MESSAGES.noOperations);
    });

    it('should throw error when nonce not set', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100' })
        .gas(100000n)
        .maxFeePerGas(1000000000n)
        .maxPriorityFeePerGas(500000000n);
      await assert.rejects(async () => await builder.build(), ERROR_MESSAGES.missingNonce);
    });

    it('should throw error when gas not set', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100' })
        .nonce(0)
        .maxFeePerGas(1000000000n)
        .maxPriorityFeePerGas(500000000n);
      await assert.rejects(async () => await builder.build(), ERROR_MESSAGES.missingGas);
    });

    it('should throw error when maxFeePerGas not set', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100' })
        .nonce(0)
        .gas(100000n)
        .maxPriorityFeePerGas(500000000n);
      await assert.rejects(async () => await builder.build(), ERROR_MESSAGES.missingMaxFeePerGas);
    });

    it('should throw error when maxPriorityFeePerGas not set', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100' })
        .nonce(0)
        .gas(100000n)
        .maxFeePerGas(1000000000n);
      await assert.rejects(async () => await builder.build(), ERROR_MESSAGES.missingMaxPriorityFeePerGas);
    });
  });

  describe('Round-Trip: Build -> Serialize -> Operations Check', () => {
    it('should preserve operation data through build', async () => {
      const operations = [{ token: mockToken, to: mockRecipient, amount: '123', memo: '1' }];

      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation(operations[0])
        .feeToken(mockFeeToken)
        .nonce(10)
        .gas(150000n)
        .maxFeePerGas(2000000000n)
        .maxPriorityFeePerGas(1000000000n);

      const tx = (await builder.build()) as Tip20Transaction;
      const txOps = tx.getOperations();

      assert.strictEqual(txOps.length, 1);
      assert.strictEqual(txOps[0].token, operations[0].token);
      assert.strictEqual(txOps[0].to, operations[0].to);
      assert.strictEqual(txOps[0].amount, operations[0].amount);
      assert.strictEqual(txOps[0].memo, operations[0].memo);
    });
  });

  describe('Build -> Serialize -> Sign Flow', () => {
    it('should produce serializable unsigned transaction', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '50', memo: '2' })
        .feeToken(mockFeeToken)
        .nonce(5)
        .gas(100000n)
        .maxFeePerGas(2000000000n)
        .maxPriorityFeePerGas(1000000000n);

      const tx = (await builder.build()) as Tip20Transaction;
      const unsignedHex = await tx.serialize();

      assert.ok(unsignedHex.startsWith(AA_TRANSACTION_TYPE));
      assert.ok(/^0x[0-9a-f]+$/i.test(unsignedHex));
    });

    it('should support full sign and broadcast flow', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '75', memo: '3' })
        .feeToken(mockFeeToken)
        .nonce(123)
        .gas(120000n)
        .maxFeePerGas(2500000000n)
        .maxPriorityFeePerGas(1200000000n);

      const tx = (await builder.build()) as Tip20Transaction;
      const unsignedHex = await tx.serialize();

      tx.setSignature(SIGNATURE_TEST_DATA.validSignature);

      const broadcastHex = await tx.toBroadcastFormat();
      assert.ok(broadcastHex.startsWith(AA_TRANSACTION_TYPE));
      assert.ok(broadcastHex.length > unsignedHex.length, 'Signed should be longer');
    });
  });

  describe('Transaction JSON Representation', () => {
    it('should produce consistent JSON from built transaction', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100', memo: '4' })
        .feeToken(mockFeeToken)
        .nonce(50)
        .gas(200000n)
        .maxFeePerGas(3000000000n)
        .maxPriorityFeePerGas(1500000000n);

      const tx = (await builder.build()) as Tip20Transaction;
      const json = tx.toJson();

      assert.strictEqual(json.type, AA_TRANSACTION_TYPE);
      assert.strictEqual(json.nonce, 50);
      assert.strictEqual(json.gas, '200000');
      assert.strictEqual(json.maxFeePerGas, '3000000000');
      assert.strictEqual(json.maxPriorityFeePerGas, '1500000000');
      assert.strictEqual(json.callCount, 1);
      assert.strictEqual(json.feeToken, mockFeeToken);
    });
  });
});
