import assert from 'assert';
import { explainTonTransaction } from '../../src/lib/explainTransactionWasm';
import * as testData from '../resources/ton';

describe('WASM explainTonTransaction', function () {
  it('should explain a signed send transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedSendTransaction.tx,
    });

    assert.ok(explained.id);
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].amount, testData.signedSendTransaction.recipient.amount);
    assert.strictEqual(explained.outputAmount, testData.signedSendTransaction.recipient.amount);
    assert.deepStrictEqual(explained.changeOutputs, []);
    assert.strictEqual(explained.changeAmount, '0');
    assert.deepStrictEqual(explained.fee, { fee: 'UNKNOWN' });
  });

  it('should explain a bounceable send transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedSendTransaction.txBounceable,
    });

    assert.ok(explained.id);
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].amount, testData.signedSendTransaction.recipientBounceable.amount);
    assert.strictEqual(explained.outputAmount, testData.signedSendTransaction.recipientBounceable.amount);
  });

  it('should explain a single nominator withdraw transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedSingleNominatorWithdrawTransaction.tx,
    });

    assert.ok(explained.id);
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].amount, testData.signedSingleNominatorWithdrawTransaction.recipient.amount);
    assert.strictEqual(explained.outputAmount, testData.signedSingleNominatorWithdrawTransaction.recipient.amount);
  });

  it('should explain a token send transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedTokenSendTransaction.tx,
    });

    assert.ok(explained);
    assert.strictEqual(explained.outputs.length, 1);
  });

  it('should explain a ton whales deposit transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedTonWhalesDepositTransaction.tx,
    });

    assert.ok(explained);
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].amount, testData.signedTonWhalesDepositTransaction.recipient.amount);
  });

  it('should explain a ton whales withdrawal transaction', function () {
    const explained = explainTonTransaction({
      txBase64: testData.signedTonWhalesWithdrawalTransaction.tx,
    });

    assert.ok(explained);
    assert.strictEqual(explained.outputs.length, 1);
    assert.strictEqual(explained.outputs[0].amount, testData.signedTonWhalesWithdrawalTransaction.recipient.amount);
    assert.ok(explained.withdrawAmount);
    assert.strictEqual(explained.withdrawAmount, testData.signedTonWhalesWithdrawalTransaction.withdrawAmount);
  });

  it('should return empty outputs for invalid base64', function () {
    assert.throws(() => {
      explainTonTransaction({ txBase64: 'not-valid-base64!!' });
    });
  });
});
