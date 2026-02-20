/**
 * TIP-20 Integration Tests
 *
 * End-to-end flows for TIP-20 token transactions on Tempo using testnet token addresses.
 */

import assert from 'assert';
import { describe, it } from 'mocha';
import { ethers } from 'ethers';
import { coins } from '@bitgo/statics';
import { Tip20TransactionBuilder } from '../../src/lib/transactionBuilder';
import { Tip20Transaction } from '../../src/lib/transaction';
import { Address } from '../../src/lib/types';
import { AA_TRANSACTION_TYPE, TEMPO_CHAIN_IDS } from '../../src/lib/constants';
import { TESTNET_TOKENS, TX_PARAMS, SIGNATURE_TEST_DATA, TEST_RECIPIENT_ADDRESS } from '../resources/tempo';

const mockCoinConfig = coins.get('ttempo');

const ALPHA_USD_TOKEN = TESTNET_TOKENS.alphaUSD.address as Address;
const BETA_USD_TOKEN = TESTNET_TOKENS.betaUSD.address as Address;
const THETA_USD_TOKEN = TESTNET_TOKENS.thetaUSD.address as Address;
const RECEIVER_ADDRESS = TEST_RECIPIENT_ADDRESS as Address;

describe('TIP-20 Integration Tests', () => {
  describe('Single Transfer', () => {
    it('should build and serialize single TIP-20 transfer', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({
          token: ALPHA_USD_TOKEN,
          to: RECEIVER_ADDRESS,
          amount: '1',
          memo: '1',
        })
        .feeToken(ALPHA_USD_TOKEN)
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.ok(tx instanceof Tip20Transaction);
      assert.strictEqual(tx.getOperationCount(), 1);
      assert.strictEqual(tx.isBatch(), false);
      assert.strictEqual(tx.getOperations()[0].memo, '1');

      const serialized = await tx.serialize();
      assert.ok(serialized.startsWith(AA_TRANSACTION_TYPE));
    });
  });

  describe('Batch Transfer', () => {
    it('should build multi-token batch transfer', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '15', memo: '1' })
        .addOperation({ token: BETA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '20', memo: '2' })
        .addOperation({ token: THETA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '7', memo: '3' })
        .feeToken(BETA_USD_TOKEN)
        .nonce(10)
        .gas(400000n)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.strictEqual(tx.getOperationCount(), 3);
      assert.strictEqual(tx.isBatch(), true);
      assert.strictEqual(tx.getFeeToken(), BETA_USD_TOKEN);

      const operations = tx.getOperations();
      assert.strictEqual(operations[0].token, ALPHA_USD_TOKEN);
      assert.strictEqual(operations[1].token, BETA_USD_TOKEN);
      assert.strictEqual(operations[2].token, THETA_USD_TOKEN);
    });
  });

  describe('Transaction Signing', () => {
    it('should produce unsigned transaction with correct RLP structure', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '1' })
        .feeToken(ALPHA_USD_TOKEN)
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      const unsignedHex = await tx.serialize();

      assert.ok(unsignedHex.startsWith(AA_TRANSACTION_TYPE));
      assert.strictEqual(tx.getSignature(), undefined);

      // Verify RLP structure (13 fields for unsigned)
      const rlpPart = '0x' + unsignedHex.slice(4);
      const decoded = ethers.utils.RLP.decode(rlpPart);
      assert.strictEqual(decoded.length, 13);
    });

    it('should apply signature and produce broadcast format', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '1' })
        .feeToken(ALPHA_USD_TOKEN)
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      tx.setSignature(SIGNATURE_TEST_DATA.validSignature);

      const signedHex = await tx.toBroadcastFormat();

      // Verify it includes signature (14 fields)
      assert.ok(signedHex.startsWith(AA_TRANSACTION_TYPE));
      const rlpPart = '0x' + signedHex.slice(4);
      const decoded = ethers.utils.RLP.decode(rlpPart);
      assert.strictEqual(decoded.length, 14);

      const storedSig = tx.getSignature();
      assert.ok(storedSig);
      assert.strictEqual(storedSig?.r, SIGNATURE_TEST_DATA.validSignature.r);
    });
  });

  describe('Fee Token Selection', () => {
    it('should pay fees with different token than transfer', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '1' })
        .feeToken(BETA_USD_TOKEN)
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.strictEqual(tx.getOperations()[0].token, ALPHA_USD_TOKEN);
      assert.strictEqual(tx.getFeeToken(), BETA_USD_TOKEN);
    });

    it('should build transaction without explicit fee token', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '1' })
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;

      assert.strictEqual(tx.getFeeToken(), undefined);
      const serialized = await tx.serialize();
      assert.ok(serialized.startsWith(AA_TRANSACTION_TYPE));
    });
  });

  describe('Transaction JSON', () => {
    it('should produce complete JSON representation', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '123456', memo: '5' })
        .feeToken(BETA_USD_TOKEN)
        .nonce(42)
        .gas(150000n)
        .maxFeePerGas(3000000000n)
        .maxPriorityFeePerGas(1500000000n);

      const tx = (await builder.build()) as Tip20Transaction;
      const json = tx.toJson();

      assert.strictEqual(json.type, AA_TRANSACTION_TYPE);
      assert.strictEqual(json.chainId, TEMPO_CHAIN_IDS.TESTNET);
      assert.strictEqual(json.nonce, 42);
      assert.strictEqual(json.gas, '150000');
      assert.strictEqual(json.feeToken, BETA_USD_TOKEN);

      const ops = json.operations as any[];
      assert.strictEqual(ops[0].token, ALPHA_USD_TOKEN);
      assert.strictEqual(ops[0].amount, '123456');
      assert.strictEqual(ops[0].memo, '5');
    });
  });

  describe('canBroadcast Check', () => {
    it('should return true for valid transaction', async () => {
      const builder = new Tip20TransactionBuilder(mockCoinConfig);

      builder
        .addOperation({ token: ALPHA_USD_TOKEN, to: RECEIVER_ADDRESS, amount: '1' })
        .feeToken(ALPHA_USD_TOKEN)
        .nonce(0)
        .gas(TX_PARAMS.defaultGas)
        .maxFeePerGas(TX_PARAMS.defaultMaxFeePerGas)
        .maxPriorityFeePerGas(TX_PARAMS.defaultMaxPriorityFeePerGas);

      const tx = (await builder.build()) as Tip20Transaction;
      assert.strictEqual(tx.canBroadcast(), true);
    });
  });
});
