/**
 * Tests for WASM-based TON transaction explanation.
 *
 * Validates that explainTonTransaction() produces the correct output for each
 * transaction type supported by the WASM parser.
 */

import should from 'should';
import { explainTonTransaction } from '../../src/lib/explainTransactionWasm';
import * as testData from '../resources/ton';

describe('WASM explainTonTransaction:', function () {
  describe('Send (native TON transfer)', function () {
    it('should explain a signed send transaction', function () {
      const txBase64 = testData.signedSendTransaction.tx;
      const result = explainTonTransaction({ txBase64 });

      result.should.have.property('displayOrder').which.is.an.Array();
      result.displayOrder.should.containEql('id');
      result.displayOrder.should.containEql('outputs');
      result.displayOrder.should.containEql('outputAmount');

      // Should have a transaction ID (transaction is signed)
      result.id.should.be.a.String();
      result.id.should.not.be.empty();

      // Should have one output
      result.outputs.should.be.an.Array();
      result.outputs.length.should.be.greaterThan(0);

      // Amount should match fixture
      result.outputs[0].amount.should.equal(testData.signedSendTransaction.recipient.amount);
      result.outputAmount.should.equal(testData.signedSendTransaction.recipient.amount);

      // Standard shape
      result.changeOutputs.should.deepEqual([]);
      result.changeAmount.should.equal('0');
      result.fee.should.deepEqual({ fee: 'UNKNOWN' });
    });

    it('should explain a signed bounceable send transaction', function () {
      const txBase64 = testData.signedSendTransaction.txBounceable;
      const result = explainTonTransaction({ txBase64 });

      result.outputs.length.should.be.greaterThan(0);
      result.outputs[0].amount.should.equal(testData.signedSendTransaction.recipient.amount);
    });
  });

  describe('SingleNominatorWithdraw', function () {
    it('should explain a signed single nominator withdraw transaction', function () {
      const txBase64 = testData.signedSingleNominatorWithdrawTransaction.tx;
      const result = explainTonTransaction({ txBase64 });

      result.id.should.be.a.String();
      result.id.should.not.be.empty();

      result.outputs.should.be.an.Array();
      result.outputs.length.should.be.greaterThan(0);

      // Amount should match the fixture recipient amount
      result.outputs[0].amount.should.equal(testData.signedSingleNominatorWithdrawTransaction.recipient.amount);
      result.outputAmount.should.equal(testData.signedSingleNominatorWithdrawTransaction.recipient.amount);

      result.changeOutputs.should.deepEqual([]);
      result.changeAmount.should.equal('0');
      result.fee.should.deepEqual({ fee: 'UNKNOWN' });
    });
  });

  describe('TonWhalesDeposit', function () {
    it('should explain a ton whales deposit transaction', function () {
      const txBase64 = testData.signedTonWhalesDepositTransaction.tx;
      const result = explainTonTransaction({ txBase64 });

      result.outputs.should.be.an.Array();
      result.outputs.length.should.be.greaterThan(0);
      // The deposit amount is the outer message value
      result.outputs[0].amount.should.equal(testData.signedTonWhalesDepositTransaction.recipient.amount);
      result.changeOutputs.should.deepEqual([]);
      result.fee.should.deepEqual({ fee: 'UNKNOWN' });
    });
  });

  describe('TonWhalesWithdrawal', function () {
    it('should explain a ton whales withdrawal transaction', function () {
      const txBase64 = testData.signedTonWhalesWithdrawalTransaction.tx;
      const result = explainTonTransaction({ txBase64 });

      result.outputs.should.be.an.Array();
      result.outputs.length.should.be.greaterThan(0);
      // The outer TON amount (gas attachment)
      result.outputs[0].amount.should.equal(testData.signedTonWhalesWithdrawalTransaction.recipient.amount);
      result.changeOutputs.should.deepEqual([]);
      result.fee.should.deepEqual({ fee: 'UNKNOWN' });
    });
  });

  describe('SendToken (Jetton transfer)', function () {
    it('should explain a signed jetton token send transaction', function () {
      const txBase64 = testData.signedTokenSendTransaction.tx;
      const result = explainTonTransaction({ txBase64 });

      result.outputs.should.be.an.Array();
      result.outputs.length.should.be.greaterThan(0);

      // For jetton txs the output address is the jetton destination
      result.outputs[0].address.should.be.a.String();
      result.outputs[0].address.should.not.be.empty();

      result.changeOutputs.should.deepEqual([]);
      result.fee.should.deepEqual({ fee: 'UNKNOWN' });
    });
  });

  describe('Error handling', function () {
    it('should throw for invalid base64', function () {
      should.throws(() => {
        explainTonTransaction({ txBase64: 'not-valid-base64!!!' });
      });
    });

    it('should throw for empty string', function () {
      should.throws(() => {
        explainTonTransaction({ txBase64: '' });
      });
    });
  });
});
