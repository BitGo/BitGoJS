/**
 * Tests for WasmTransaction - the clean WASM-only Transaction implementation.
 *
 * These tests verify that WasmTransaction produces identical results to the
 * legacy Transaction class, validating the refactor.
 */
import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction, WasmTransaction } from '../../src/lib';
import * as testData from '../resources/sol';

describe('WasmTransaction', () => {
  const coin = coins.get('tsol');

  describe('basic parsing', () => {
    it('should parse unsigned transfer with memo and durable nonce', () => {
      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      wasmTx.signature.should.be.empty();
      const txJson = wasmTx.toJson();

      txJson.should.have.properties(['id', 'feePayer', 'nonce', 'numSignatures', 'instructionsData']);
      should.not.exist(txJson.id);
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
      txJson.numSignatures.should.equal(0);
      txJson.instructionsData.length.should.equal(3);
    });

    it('should parse multi transfer signed tx', () => {
      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.MULTI_TRANSFER_SIGNED);

      const txJson = wasmTx.toJson();
      txJson.id?.should.equal(
        'TPVcc18CYxPnM3eRgQhdb6V6ZLa34Dv3dU7MtvKPuy5ZPKLM1uZPFFEmF2m184PTWKRZ1Uq6NKFZWwr2krKk63f'
      );
      wasmTx.signature.should.deepEqual([
        'TPVcc18CYxPnM3eRgQhdb6V6ZLa34Dv3dU7MtvKPuy5ZPKLM1uZPFFEmF2m184PTWKRZ1Uq6NKFZWwr2krKk63f',
      ]);
      txJson.feePayer?.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
      txJson.numSignatures.should.equal(1);
    });
  });

  describe('parity with legacy Transaction', () => {
    it('should produce same toJson() for transfer tx', () => {
      const legacyTx = new Transaction(coin);
      legacyTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      const legacyJson = legacyTx.toJson();
      const wasmJson = wasmTx.toJson();

      // Core fields should match
      wasmJson.feePayer?.should.equal(legacyJson.feePayer);
      wasmJson.nonce.should.equal(legacyJson.nonce);
      wasmJson.numSignatures.should.equal(legacyJson.numSignatures);
      wasmJson.instructionsData.length.should.equal(legacyJson.instructionsData.length);

      // Instructions should match
      wasmJson.instructionsData.should.deepEqual(legacyJson.instructionsData);
    });

    it('should produce same toJson() for staking tx', () => {
      const legacyTx = new Transaction(coin);
      legacyTx.fromRawTransaction(testData.STAKING_ACTIVATE_SIGNED_TX);

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.STAKING_ACTIVATE_SIGNED_TX);

      const legacyJson = legacyTx.toJson();
      const wasmJson = wasmTx.toJson();

      wasmJson.feePayer?.should.equal(legacyJson.feePayer);
      wasmJson.nonce.should.equal(legacyJson.nonce);
      wasmJson.instructionsData.length.should.equal(legacyJson.instructionsData.length);
      wasmJson.instructionsData.should.deepEqual(legacyJson.instructionsData);
    });

    it('should produce same toBroadcastFormat()', () => {
      const legacyTx = new Transaction(coin);
      legacyTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      wasmTx.toBroadcastFormat().should.equal(legacyTx.toBroadcastFormat());
    });

    it('should produce same signablePayload', () => {
      const legacyTx = new Transaction(coin);
      legacyTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      wasmTx.signablePayload.should.deepEqual(legacyTx.signablePayload);
    });

    it('should produce same inputs/outputs for transfer', () => {
      const legacyTx = new Transaction(coin);
      legacyTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);

      wasmTx.inputs.should.deepEqual(legacyTx.inputs);
      wasmTx.outputs.should.deepEqual(legacyTx.outputs);
    });
  });

  describe('Jito staking', () => {
    it('should parse Jito DepositSol transaction', () => {
      // From jitoWasmVerification.ts
      const JITO_TX_BASE64 =
        'AdOUrFCk9yyhi1iB1EfOOXHOeiaZGQnLRwnypt+be8r9lrYMx8w7/QTnithrqcuBApg1ctJAlJMxNZ925vMP2Q0BAAQKReV5vPklPPaLR9/x+zo6XCwhusWyPAmuEqbgVWvwi0Ecg6pe+BOG2OETfAVS9ftz6va1oE4onLBolJ2N+ZOOhJ6naP7fZEyKrpuOIYit0GvFUPv3Fsgiuc5jx3g9lS4fCeaj/uz5kDLhwd9rlyLcs2NOe440QJNrw0sMwcjrUh/80UHpgyyvEK2RdJXKDycbWyk81HAn6nNwB+1A6zmgvQSKPgjDtJW+F/RUJ9ib7FuAx+JpXBhk12dD2zm+00bWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABU5Z4kwFGooUp7HpeX8OEs36dJAhZlMZWmpRKm8WZgKwaBTtTK9ooXRnL9rIYDGmPoTqFe+h1EtyKT9tvbABZQBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKnjMtr5L6vs6LY/96RABeX9/Zr6FYdWthxalfkEs7jQgQEICgUHAgABAwEEBgkJDuCTBAAAAAAA';

      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(JITO_TX_BASE64);

      const txJson = wasmTx.toJson();
      txJson.instructionsData.should.have.length(1);
      txJson.instructionsData[0].type.should.equal('Activate'); // StakingActivate
    });
  });

  describe('error handling', () => {
    it('should throw for uninitialized toJson()', () => {
      const wasmTx = new WasmTransaction(coin);
      assert.throws(() => wasmTx.toJson(), /Transaction not initialized/);
    });

    it('should throw for uninitialized toBroadcastFormat()', () => {
      const wasmTx = new WasmTransaction(coin);
      assert.throws(() => wasmTx.toBroadcastFormat(), /Transaction not initialized/);
    });

    it('should throw for invalid transaction bytes', () => {
      const wasmTx = new WasmTransaction(coin);
      assert.throws(() => wasmTx.fromRawTransaction('invalidbase64!!!'), /Failed to parse transaction/);
    });
  });

  describe('canSign', () => {
    it('should return true (matches legacy behavior)', () => {
      const wasmTx = new WasmTransaction(coin);
      wasmTx.fromRawTransaction(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      wasmTx.canSign().should.equal(true);
    });
  });
});
