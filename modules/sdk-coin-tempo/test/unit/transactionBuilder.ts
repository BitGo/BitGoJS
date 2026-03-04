import assert from 'assert';
import { describe, it, before } from 'mocha';
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
import { Ttempo } from '../../src/ttempo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoBase } from '@bitgo/sdk-core';
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

    it('should throw error for invalid (non-numeric) memo', () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      assert.throws(
        () => builder.addOperation({ token: mockToken, to: mockRecipient, amount: '100', memo: 'INV-001' }),
        /Invalid memo/
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

  describe('Transaction id getter', () => {
    it('unsigned and signed transactions should have different ids', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '10' })
        .nonce(1)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      const unsignedId = tx.id;

      tx.setSignature(SIGNATURE_TEST_DATA.validSignature);
      const signedId = tx.id;

      assert.notStrictEqual(unsignedId, signedId, 'Signed and unsigned tx should have different ids');
    });
  });

  describe('outputs / inputs population', () => {
    it('should expose outputs with base-unit value and token address as coin', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '1.5', memo: '7' })
        .nonce(0)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      assert.strictEqual(tx.outputs.length, 1);
      assert.strictEqual(tx.outputs[0].address, mockRecipient);
      // 1.5 tokens * 10^6 = 1_500_000 base units
      assert.strictEqual(tx.outputs[0].value, '1500000');
      // coin is the token contract address, not the chain name
      assert.strictEqual(tx.outputs[0].coin?.toLowerCase(), mockToken.toLowerCase());
    });

    it('should expose a single input with the total in base units', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '1.5' })
        .addOperation({ token: mockToken, to: mockRecipient, amount: '3.5' })
        .nonce(0)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      assert.strictEqual(tx.inputs.length, 1);
      assert.strictEqual(tx.inputs[0].address, '');
      // (1.5 + 3.5) tokens * 10^6 = 5_000_000 base units
      assert.strictEqual(tx.inputs[0].value, '5000000');
    });
  });

  describe('Round-Trip: Build -> Serialize -> From (deserialization)', () => {
    it('should round-trip a single-operation transaction without a signature', async () => {
      const operation = { token: mockToken, to: mockRecipient, amount: '25.5', memo: '12345' };

      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation(operation)
        .feeToken(mockFeeToken)
        .nonce(7)
        .gas(150000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const originalTx = (await builder.build()) as Tip20Transaction;
      const serialized = await originalTx.serialize();

      // Deserialize via from()
      const builder2 = new Tip20TransactionBuilder(mockCoinConfig);
      builder2.from(serialized);
      const restoredTx = (await builder2.build()) as Tip20Transaction;

      const ops = restoredTx.getOperations();
      assert.strictEqual(ops.length, 1);
      assert.strictEqual(ops[0].token.toLowerCase(), operation.token.toLowerCase());
      assert.strictEqual(ops[0].to.toLowerCase(), operation.to.toLowerCase());
      assert.strictEqual(ops[0].amount, operation.amount);
      assert.strictEqual(ops[0].memo, operation.memo);
      assert.strictEqual(restoredTx.getFeeToken()?.toLowerCase(), mockFeeToken.toLowerCase());
    });

    it('should round-trip a batch transaction', async () => {
      // Use amounts that match tip20UnitsToAmount output: ethers formatUnits always includes decimal
      const operations = [
        { token: TESTNET_TOKENS.alphaUSD.address, to: mockRecipient, amount: '10.0', memo: '1' },
        { token: TESTNET_TOKENS.betaUSD.address, to: mockRecipient, amount: '20.0', memo: '2' },
      ];

      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation(operations[0])
        .addOperation(operations[1])
        .nonce(42)
        .gas(250000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const originalTx = (await builder.build()) as Tip20Transaction;
      const serialized = await originalTx.serialize();

      const builder2 = new Tip20TransactionBuilder(mockCoinConfig);
      builder2.from(serialized);
      const restoredTx = (await builder2.build()) as Tip20Transaction;

      assert.strictEqual(restoredTx.getOperationCount(), 2);
      assert.ok(restoredTx.isBatch());

      const json = restoredTx.toJson();
      assert.strictEqual(json.nonce, 42);
      assert.strictEqual(json.gas, '250000');
      assert.strictEqual(json.maxFeePerGas, TX_PARAMS.defaultMaxFeePerGas.toString());
      assert.strictEqual(json.maxPriorityFeePerGas, TX_PARAMS.defaultMaxPriorityFeePerGas.toString());

      const ops = restoredTx.getOperations();
      for (let i = 0; i < operations.length; i++) {
        assert.strictEqual(ops[i].token.toLowerCase(), operations[i].token.toLowerCase());
        assert.strictEqual(ops[i].to.toLowerCase(), mockRecipient.toLowerCase());
        assert.strictEqual(ops[i].amount, operations[i].amount);
        assert.strictEqual(ops[i].memo, operations[i].memo);
      }
    });

    it('should round-trip a signed transaction and preserve the signature', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '5' })
        .nonce(99)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      tx.setSignature(SIGNATURE_TEST_DATA.validSignature);
      const signedHex = await tx.toBroadcastFormat();

      // Deserialize the signed transaction
      const builder2 = new Tip20TransactionBuilder(mockCoinConfig);
      builder2.from(signedHex);
      const restoredTx = (await builder2.build()) as Tip20Transaction;

      const sig = restoredTx.getSignature();
      assert.ok(sig !== undefined, 'Signature should be preserved');
      assert.strictEqual(sig!.yParity, SIGNATURE_TEST_DATA.validSignature.yParity);
    });

    it('should produce the same tx id after a serialization round-trip', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);
      builder
        .addOperation({ token: mockToken, to: mockRecipient, amount: '100.0', memo: '99' })
        .nonce(3)
        .gas(100000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const originalTx = (await builder.build()) as Tip20Transaction;
      const serialized = await originalTx.serialize();
      const originalId = originalTx.id;

      const builder2 = new Tip20TransactionBuilder(mockCoinConfig);
      builder2.from(serialized);
      const restoredTx = (await builder2.build()) as Tip20Transaction;

      assert.strictEqual(restoredTx.id, originalId);

      const originalJson = originalTx.toJson();
      const restoredJson = restoredTx.toJson();
      assert.strictEqual(restoredJson.nonce, originalJson.nonce);
      assert.strictEqual(restoredJson.gas, originalJson.gas);
      assert.strictEqual(restoredJson.maxFeePerGas, originalJson.maxFeePerGas);
      assert.strictEqual(restoredJson.maxPriorityFeePerGas, originalJson.maxPriorityFeePerGas);
      assert.strictEqual(restoredJson.feeToken, originalJson.feeToken);
      assert.strictEqual(restoredJson.callCount, originalJson.callCount);

      const originalOps = originalTx.getOperations();
      const restoredOps = restoredTx.getOperations();
      assert.strictEqual(restoredOps.length, originalOps.length);
      assert.strictEqual(restoredOps[0].token.toLowerCase(), originalOps[0].token.toLowerCase());
      assert.strictEqual(restoredOps[0].to.toLowerCase(), originalOps[0].to.toLowerCase());
      assert.strictEqual(restoredOps[0].amount, originalOps[0].amount);
      assert.strictEqual(restoredOps[0].memo, originalOps[0].memo);

      const restoredSerialized = await restoredTx.serialize();
      assert.strictEqual(restoredSerialized, serialized);
    });
  });
});

describe('Tempo coin - parseTransaction / verifyTransaction', () => {
  let bitgo: TestBitGoAPI;
  let coin: any;

  const mockToken = ethers.utils.getAddress(TESTNET_TOKENS.alphaUSD.address);
  const mockRecipient = ethers.utils.getAddress(TEST_RECIPIENT_ADDRESS);

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('ttempo', (bg: BitGoBase) => {
      const mockStaticsCoin = {
        name: 'ttempo',
        fullName: 'Testnet Tempo',
        network: { type: 'testnet' },
        features: [],
      } as any;
      return Ttempo.createInstance(bg, mockStaticsCoin);
    });
    bitgo.initializeTestVars();
    coin = bitgo.coin('ttempo');
  });

  async function buildSerializedTx(
    operations: { token: string; to: string; amount: string; memo?: string }[],
    nonce = 0
  ): Promise<string> {
    const builder = new Tip20TransactionBuilder(coins.get('ttempo'));
    for (const op of operations) {
      builder.addOperation(op);
    }
    builder
      .nonce(nonce)
      .gas(100000n)
      .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
      .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);
    const tx = (await builder.build()) as Tip20Transaction;
    return tx.serialize();
  }

  describe('parseTransaction', () => {
    it('should parse a single-operation transaction into outputs', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '50', memo: '1' }]);
      const parsed = await coin.parseTransaction({ txHex });
      assert.ok(Array.isArray(parsed.outputs), 'outputs should be an array');
      assert.strictEqual(parsed.outputs.length, 1);
      assert.strictEqual(parsed.outputs[0].address.toLowerCase(), mockRecipient.toLowerCase());
      // 50 tokens * 10^6 = 50_000_000 base units
      assert.strictEqual(parsed.outputs[0].amount, '50000000');
    });

    it('should return empty object when no txHex is provided', async () => {
      const parsed = await coin.parseTransaction({});
      assert.deepStrictEqual(parsed, {});
    });
  });

  describe('verifyTransaction', () => {
    it('should return true when no recipients are specified', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '10' }]);
      const result = await coin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {},
      });
      assert.strictEqual(result, true);
    });

    it('should return true when recipients match operations', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '100' }]);
      const result = await coin.verifyTransaction({
        txPrebuild: { txHex },
        txParams: {
          recipients: [{ address: mockRecipient, amount: '100000000' }], // 100 * 10^6 base units
        },
      });
      assert.strictEqual(result, true);
    });

    it('should throw when recipient address does not match', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '100' }]);
      const wrongAddress = ethers.utils.getAddress('0x1111111111111111111111111111111111111111');
      await assert.rejects(
        () =>
          coin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: { recipients: [{ address: wrongAddress, amount: '100000000' }] },
          }),
        /recipient mismatch/
      );
    });

    it('should throw when recipient amount does not match', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '100' }]);
      await assert.rejects(
        () =>
          coin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: { recipients: [{ address: mockRecipient, amount: '999' }] },
          }),
        /amount mismatch/
      );
    });

    it('should throw when operation count differs from recipient count', async () => {
      const txHex = await buildSerializedTx([{ token: mockToken, to: mockRecipient, amount: '10' }]);
      await assert.rejects(
        () =>
          coin.verifyTransaction({
            txPrebuild: { txHex },
            txParams: {
              recipients: [
                { address: mockRecipient, amount: '10000000' },
                { address: mockRecipient, amount: '10000000' },
              ],
            },
          }),
        /operation\(s\)/
      );
    });

    it('should return true when no txHex is provided', async () => {
      const result = await coin.verifyTransaction({ txPrebuild: {}, txParams: {} });
      assert.strictEqual(result, true);
    });
  });
});
