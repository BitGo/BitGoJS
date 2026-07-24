import should from 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import {
  buildTransaction,
  parseTransaction,
  Transaction as WasmTonTransaction,
  type BuildContext,
  type PaymentIntent,
  type ParsedTransaction,
} from '@bitgo/wasm-ton';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import * as testData from '../resources/ton';

/**
 * Cross-compatibility tests between WASM (@bitgo/wasm-ton) and legacy
 * (tonweb-based) transaction building/parsing for TON.
 *
 * Direction 1: WASM parses legacy-built transactions (covered by explainTransactionWasm.ts)
 * Direction 2: Legacy parses WASM-built transactions (this file)
 */
describe('TON WASM Cross-Compatibility', function () {
  const coin = coins.get('tton');
  const factory = new TransactionBuilderFactory(coin);

  // Use sender from test fixtures
  const senderAddress = testData.sender.address;
  const senderPublicKey = testData.sender.publicKey;
  const recipientAddress = testData.addresses.validAddresses[0];

  function createWasmContext(overrides: Partial<BuildContext> = {}): BuildContext {
    return {
      sender: senderAddress,
      seqno: 6,
      expireTime: 1695997582n,
      publicKey: senderPublicKey,
      ...overrides,
    };
  }

  // =========================================================================
  // WASM -> Legacy: Legacy can parse WASM-built transactions
  // =========================================================================
  describe('Legacy parses WASM-built transactions', function () {
    it('should parse a WASM-built payment transaction via legacy factory.from()', async function () {
      const amount = 10000000n; // 0.01 TON
      const memo = 'test';

      // Build with WASM
      const wasmTx = buildTransaction(
        {
          type: 'payment',
          to: recipientAddress,
          amount,
          bounceable: false,
          memo,
        } as PaymentIntent,
        createWasmContext()
      );

      // Convert to base64 (the format legacy expects)
      const bocBytes = wasmTx.toBroadcastFormat();
      const base64Tx = Buffer.from(bocBytes).toString('base64');

      // Parse with legacy
      const legacyBuilder = factory.from(base64Tx);
      const legacyTx = await legacyBuilder.build();
      const json = legacyTx.toJson();

      // Verify the legacy builder can extract the correct fields
      legacyTx.type.should.equal(TransactionType.Send);
      json.seqno.should.equal(6);
      json.expirationTime.should.equal(1695997582);
      json.amount.should.equal(amount.toString());
      should.exist(json.sender);
      should.exist(json.destination);
    });

    it('should parse a WASM-built payment without memo via legacy', async function () {
      const amount = 50000000n; // 0.05 TON

      const wasmTx = buildTransaction(
        {
          type: 'payment',
          to: recipientAddress,
          amount,
          bounceable: false,
        } as PaymentIntent,
        createWasmContext({ seqno: 10, expireTime: 1700000000n })
      );

      const base64Tx = Buffer.from(wasmTx.toBroadcastFormat()).toString('base64');

      const legacyBuilder = factory.from(base64Tx);
      const legacyTx = await legacyBuilder.build();
      const json = legacyTx.toJson();

      legacyTx.type.should.equal(TransactionType.Send);
      json.seqno.should.equal(10);
      json.expirationTime.should.equal(1700000000);
      json.amount.should.equal(amount.toString());
    });

    it('should round-trip: WASM build -> legacy parse -> legacy build -> WASM parse', async function () {
      const amount = 123400000n;
      const memo = 'hello';

      const wasmTx = buildTransaction(
        {
          type: 'payment',
          to: recipientAddress,
          amount,
          bounceable: false,
          memo,
        } as PaymentIntent,
        createWasmContext({ seqno: 3, expireTime: 1234567890n })
      );

      const base64Tx = Buffer.from(wasmTx.toBroadcastFormat()).toString('base64');

      // Parse with legacy
      const legacyBuilder = factory.from(base64Tx);
      const legacyTx = await legacyBuilder.build();

      // Rebuild with legacy should produce valid base64
      const rebuiltBase64 = legacyTx.toBroadcastFormat();

      // Parse the rebuilt transaction with WASM to confirm fields match
      const wasmParsed: ParsedTransaction = parseTransaction(
        WasmTonTransaction.fromBytes(Buffer.from(rebuiltBase64, 'base64'))
      );

      wasmParsed.transactionType.should.equal('Transfer');
      wasmParsed.seqno.should.equal(3);
      wasmParsed.sendActions.length.should.be.greaterThan(0);
      String(wasmParsed.sendActions[0].amount).should.equal(amount.toString());
    });

    it('should parse a WASM-built bounceable payment via legacy', async function () {
      const amount = 10000000n;

      const wasmTx = buildTransaction(
        {
          type: 'payment',
          to: recipientAddress,
          amount,
          bounceable: true,
        } as PaymentIntent,
        createWasmContext()
      );

      const base64Tx = Buffer.from(wasmTx.toBroadcastFormat()).toString('base64');

      const legacyBuilder = factory.from(base64Tx);
      const legacyTx = await legacyBuilder.build();
      const json = legacyTx.toJson();

      legacyTx.type.should.equal(TransactionType.Send);
      json.amount.should.equal(amount.toString());
    });
  });

  // =========================================================================
  // Both WASM and legacy agree on signed fixture data
  // =========================================================================
  describe('Both WASM and legacy agree on signed fixture data', function () {
    it('should produce matching fields for signedSendTransaction', async function () {
      const txBase64 = testData.signedSendTransaction.tx;

      // Parse with WASM
      const wasmTx = WasmTonTransaction.fromBytes(Buffer.from(txBase64, 'base64'));
      const wasmParsed: ParsedTransaction = parseTransaction(wasmTx);

      // Parse with legacy
      const legacyBuilder = factory.from(txBase64);
      const legacyTx = await legacyBuilder.build();
      const json = legacyTx.toJson();

      // Both should agree on core fields
      wasmParsed.transactionType.should.equal('Transfer');
      legacyTx.type.should.equal(TransactionType.Send);
      wasmParsed.seqno.should.equal(json.seqno);
      wasmParsed.sendActions.length.should.be.greaterThan(0);
      String(wasmParsed.sendActions[0].amount).should.equal(json.amount);
    });
  });
});
