/**
 * Tests for WASM-based TON transaction signing.
 *
 * Validates that getSignablePayload() and applySignature() work correctly
 * on real transaction fixtures.
 */

import should from 'should';
import { getSignablePayload, applySignature } from '../../src/lib/wasmSigner';
import * as testData from '../resources/ton';

describe('WASM transaction signing:', function () {
  describe('getSignablePayload', function () {
    it('should return a 32-byte payload for a signed send transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const payload = getSignablePayload(txBase64);

      payload.should.be.instanceOf(Uint8Array);
      payload.length.should.equal(32);
    });

    it('should return the expected signable payload bytes for a known transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const payload = getSignablePayload(txBase64);

      // The signable field in the fixture is base64-encoded
      const expectedBytes = Buffer.from(testData.signedSendTransaction.signable, 'base64');
      Buffer.from(payload).should.deepEqual(expectedBytes);
    });

    it('should return a 32-byte payload for a single nominator withdraw transaction', function () {
      const txBase64 = testData.signedSingleNominatorWithdrawTransaction.tx;
      const payload = getSignablePayload(txBase64);

      payload.should.be.instanceOf(Uint8Array);
      payload.length.should.equal(32);
    });

    it('should return the expected signable payload for a nominator withdraw', function () {
      const txBase64 = testData.signedSingleNominatorWithdrawTransaction.tx;
      const payload = getSignablePayload(txBase64);

      const expectedBytes = Buffer.from(testData.signedSingleNominatorWithdrawTransaction.signable, 'base64');
      Buffer.from(payload).should.deepEqual(expectedBytes);
    });

    it('should return a 32-byte payload for a ton whales deposit transaction', function () {
      const txBase64 = testData.signedTonWhalesDepositTransaction.tx;
      const payload = getSignablePayload(txBase64);

      payload.should.be.instanceOf(Uint8Array);
      payload.length.should.equal(32);
    });

    it('should throw for an invalid base64 string', function () {
      should.throws(() => {
        getSignablePayload('not-valid!!!');
      });
    });
  });

  describe('applySignature', function () {
    it('should produce a broadcast-ready BOC string', function () {
      // Apply the fixture signature back onto the same signed transaction.
      // wasm-ton round-trips cleanly since the BOC already has a signature slot.
      const signatureHex = testData.signedTonWhalesDepositTransaction.signature;
      const depositTxBase64 = testData.signedTonWhalesDepositTransaction.tx;

      const result = applySignature(depositTxBase64, signatureHex);

      result.should.have.property('broadcastFormat').which.is.a.String();
      result.broadcastFormat.should.not.be.empty();

      // A signed tx has an ID
      result.should.have.property('id');
    });

    it('should produce a base64 broadcast format (not hex)', function () {
      const signatureHex = testData.signedTonWhalesDepositTransaction.signature;
      const txBase64 = testData.signedTonWhalesDepositTransaction.tx;

      const result = applySignature(txBase64, signatureHex);

      // Base64 strings contain only [A-Za-z0-9+/=_-]
      result.broadcastFormat.should.match(/^[A-Za-z0-9+/=_-]+$/);
    });

    it('should throw for an invalid base64 transaction', function () {
      const signatureHex = '00'.repeat(64);
      should.throws(() => {
        applySignature('not-valid-base64!!!', signatureHex);
      });
    });
  });
});
