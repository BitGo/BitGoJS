import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { explainTonTransaction } from '../../src/lib/explainTransactionWasm';
import * as testData from '../resources/ton';

describe('TON WASM Explain Transaction', () => {
  it('should explain a Send transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.signedSendTransaction.tx });
    result.outputs.length.should.equal(1);
    result.outputs[0].address.should.be.a.String();
    result.outputs[0].amount.should.equal(testData.signedSendTransaction.recipient.amount);
    result.changeOutputs.should.deepEqual([]);
    result.changeAmount.should.equal('0');
    result.fee.fee.should.equal('UNKNOWN');
    should.not.exist(result.withdrawAmount);
  });

  it('should explain a SingleNominatorWithdraw transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.signedSingleNominatorWithdrawTransaction.tx });
    result.outputs.length.should.equal(1);
    result.outputs[0].amount.should.equal(testData.signedSingleNominatorWithdrawTransaction.recipient.amount);
  });

  it('should explain a SendToken transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.signedTokenSendTransaction.tx });
    result.outputs.length.should.equal(1);
    result.outputs[0].amount.should.equal(testData.signedTokenSendTransaction.recipient.amount);
  });

  it('should explain a TonWhalesDeposit transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.signedTonWhalesDepositTransaction.tx });
    result.outputs.length.should.equal(1);
    result.outputs[0].amount.should.equal(testData.signedTonWhalesDepositTransaction.recipient.amount);
  });

  it('should explain a TonWhalesWithdrawal transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.signedTonWhalesWithdrawalTransaction.tx });
    result.outputs.length.should.equal(1);
    result.outputs[0].amount.should.equal(testData.signedTonWhalesWithdrawalTransaction.recipient.amount);
    should.exist(result.withdrawAmount);
    result.withdrawAmount!.should.equal(testData.signedTonWhalesWithdrawalTransaction.withdrawAmount);
  });

  it('should explain a v3-compatible (vesting) Send transaction', () => {
    const result = explainTonTransaction({ txBase64: testData.v3CompatibleSignedSendTransaction.txBounceable });
    result.outputs.length.should.equal(1);
    result.outputs[0].amount.should.equal(testData.v3CompatibleSignedSendTransaction.recipient.amount);
  });
});
