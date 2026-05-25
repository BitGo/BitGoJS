import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { AllocationRequestBuilder, Transaction } from '../../../../src';
import { AllocationRequest } from '../../../../src/lib/iface';

const updateId = '12205b0b024b6f72c5484696271e8e87d7c1e0cc7bed5e9c901088b41ebe97a09a43';
const operatorId = 'treasury-tokenization-1::1220906cb6b369890324880c977a44d10e91b70b4cc9abe62d031bdafcf5dabecf89';
const contractId =
  '0020108b7aee0e0215538668a7ebb00e7e811135ff2ebf23137760056e077b9347ca121220dfa25cd905caba01345b515d1002af94b0ba2a9c2e9a6751c07ed28795454a9e';
const tradeId = 'CASH-TRADE-662AA1BA';
const transferLegId = 'CASH-TRADE-662AA1BA-security-leg';
const senderPartyId = 'ravi-2-step-party-new::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2';
const receiverPartyId = 'ravi-2-step-party::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2';
const amount = 70;
const token = 'tcanton:testtoken';
const receiveToken = 'tcanton:testcoin1';
const receiveAmount = 80;
const allocateBefore = '2026-05-06T16:46:17.184609Z';
const settleBefore = '2026-05-07T16:46:17.184609Z';
const comment = 'security leg allocation';

// Helper to set all required fields on a builder
function buildWithAllRequired(txBuilder: AllocationRequestBuilder): AllocationRequestBuilder {
  return txBuilder
    .updateId(updateId)
    .operatorId(operatorId)
    .contractId(contractId)
    .tradeId(tradeId)
    .transferLegId(transferLegId)
    .senderPartyId(senderPartyId)
    .receiverPartyId(receiverPartyId)
    .amount(amount)
    .token(token)
    .receiveToken(receiveToken)
    .receiveAmount(receiveAmount)
    .allocateBefore(allocateBefore)
    .settleBefore(settleBefore);
}

describe('AllocationRequest Builder', () => {
  it('should build the allocation request object with all fields', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder).comment(comment);
    const requestObj: AllocationRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.updateId, updateId);
    assert.equal(requestObj.operatorId, operatorId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.tradeId, tradeId);
    assert.equal(requestObj.transferLegId, transferLegId);
    assert.equal(requestObj.senderPartyId, senderPartyId);
    assert.equal(requestObj.receiverPartyId, receiverPartyId);
    assert.equal(requestObj.amount, amount);
    assert.equal(requestObj.token, token);
    assert.equal(requestObj.receiveToken, receiveToken);
    assert.equal(requestObj.receiveAmount, receiveAmount);
    assert.equal(requestObj.allocateBefore, allocateBefore);
    assert.equal(requestObj.settleBefore, settleBefore);
    assert.equal(requestObj.comment, comment);
  });

  it('should build the allocation request object without optional comment', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder);
    const requestObj: AllocationRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.comment, undefined);
  });

  it('should set the transaction id to the updateId', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.updateId(updateId);
    assert.equal(tx.id, updateId);
  });

  // --- missing required field tests ---

  it('should throw if updateId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /updateId is missing/);
  });

  it('should throw if operatorId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /operatorId is missing/);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if tradeId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /tradeId is missing/);
  });

  it('should throw if transferLegId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /transferLegId is missing/);
  });

  it('should throw if senderPartyId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /senderPartyId is missing/);
  });

  it('should throw if receiverPartyId is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /receiverPartyId is missing/);
  });

  it('should throw if token is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /token is missing/);
  });

  it('should throw if receiveToken is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /receiveToken is missing/);
  });

  it('should throw if amount was never set', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /amount is missing/);
  });

  it('should throw if receiveAmount was never set', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /receiveAmount is missing/);
  });

  it('should throw if allocateBefore is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .settleBefore(settleBefore);
    assert.throws(() => txBuilder.toRequestObject(), /allocateBefore is missing/);
  });

  it('should throw if settleBefore is missing', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    txBuilder.initBuilder(new Transaction(coins.get('tcanton')));
    txBuilder
      .updateId(updateId)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .senderPartyId(senderPartyId)
      .receiverPartyId(receiverPartyId)
      .amount(amount)
      .token(token)
      .receiveToken(receiveToken)
      .receiveAmount(receiveAmount)
      .allocateBefore(allocateBefore);
    assert.throws(() => txBuilder.toRequestObject(), /settleBefore is missing/);
  });

  // --- invalid setter argument tests ---

  it('should throw if updateId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.updateId(''), /updateId must be a non-empty string/);
  });

  it('should throw if operatorId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.operatorId(''), /operatorId must be a non-empty string/);
  });

  it('should throw if contractId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if tradeId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.tradeId(''), /tradeId must be a non-empty string/);
  });

  it('should throw if transferLegId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.transferLegId(''), /transferLegId must be a non-empty string/);
  });

  it('should throw if senderPartyId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.senderPartyId(''), /senderPartyId must be a non-empty string/);
  });

  it('should throw if receiverPartyId is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.receiverPartyId(''), /receiverPartyId must be a non-empty string/);
  });

  it('should throw if amount is zero', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.amount(0), /amount must be a positive number/);
  });

  it('should throw if amount is negative', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.amount(-5), /amount must be a positive number/);
  });

  it('should throw if token is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.token(''), /token must be a non-empty string/);
  });

  it('should throw if receiveToken is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.receiveToken(''), /receiveToken must be a non-empty string/);
  });

  it('should throw if receiveAmount is zero', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.receiveAmount(0), /receiveAmount must be a positive number/);
  });

  it('should throw if receiveAmount is negative', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.receiveAmount(-1), /receiveAmount must be a positive number/);
  });

  it('should throw if allocateBefore is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.allocateBefore(''), /allocateBefore must be a non-empty string/);
  });

  it('should throw if settleBefore is an empty string', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.settleBefore(''), /settleBefore must be a non-empty string/);
  });

  // --- not-implemented methods ---

  it('should throw on setTransaction', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.setTransaction({} as any), /Not implemented/);
  });

  it('should throw on addSignature', function () {
    const txBuilder = new AllocationRequestBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.addSignature({} as any, Buffer.from('')), /Not implemented/);
  });
});
