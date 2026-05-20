import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { AllocationAllocateBuilder, Transaction } from '../../../../src';
import { CantonAllocationAllocateRequest } from '../../../../src/lib/iface';

const commandId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const amount = 100;
const token = 'canton:amulet-usd';
const operatorId = '12205::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';
const contractId =
  '001b549bfa833bab661ab30e4d0a3ab0ec01fcc4a2bef5369795f4928147706353ca1112205a8d0e780cf3b3115cf8be0d6315f4aed6a1c25b67e8c5d64cf9848d0458fd17';
const tradeId = 'trade-9988776655';
const transferLegId = 'trade-9988776655-security-leg';
const allocateBefore = '2026-05-06T16:46:17.184609Z';
const settleBefore = '2026-05-07T16:46:17.184609Z';
const receiverPartyId = '12206::12206a4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';
const senderPartyId = '12207::12207a4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d';
const comment = 'test allocation comment';

// Helper to build with all required fields set
function buildWithAllRequired(txBuilder: AllocationAllocateBuilder): AllocationAllocateBuilder {
  return txBuilder
    .commandId(commandId)
    .amount(amount)
    .token(token)
    .operatorId(operatorId)
    .contractId(contractId)
    .tradeId(tradeId)
    .transferLegId(transferLegId)
    .allocateBefore(allocateBefore)
    .settleBefore(settleBefore)
    .receiverPartyId(receiverPartyId)
    .senderPartyId(senderPartyId);
}

describe('AllocationAllocate Builder', () => {
  it('should build the allocation allocate request object with all fields', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder).comment(comment);
    const requestObj: CantonAllocationAllocateRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.amount, amount);
    assert.equal(requestObj.token, token);
    assert.equal(requestObj.operatorId, operatorId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.tradeId, tradeId);
    assert.equal(requestObj.transferLegId, transferLegId);
    assert.equal(requestObj.allocateBefore, allocateBefore);
    assert.equal(requestObj.settleBefore, settleBefore);
    assert.equal(requestObj.receiverPartyId, receiverPartyId);
    assert.equal(requestObj.senderPartyId, senderPartyId);
    assert.equal(requestObj.comment, comment);
  });

  it('should build the allocation allocate request object without optional comment', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    buildWithAllRequired(txBuilder);
    const requestObj: CantonAllocationAllocateRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.comment, undefined);
  });

  it('should set the transaction id to the commandId', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.commandId(commandId);
    assert.equal(tx.id, commandId);
  });

  it('should throw if commandId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw if amount is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /amount is missing/);
  });

  it('should throw if token is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /token is missing/);
  });

  it('should throw if operatorId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /operatorId is missing/);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if tradeId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /tradeId is missing/);
  });

  it('should throw if transferLegId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /transferLegId is missing/);
  });

  it('should throw if allocateBefore is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /allocateBefore is missing/);
  });

  it('should throw if settleBefore is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .receiverPartyId(receiverPartyId)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /settleBefore is missing/);
  });

  it('should throw if receiverPartyId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .senderPartyId(senderPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /receiverPartyId is missing/);
  });

  it('should throw if senderPartyId is missing', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder
      .commandId(commandId)
      .amount(amount)
      .token(token)
      .operatorId(operatorId)
      .contractId(contractId)
      .tradeId(tradeId)
      .transferLegId(transferLegId)
      .allocateBefore(allocateBefore)
      .settleBefore(settleBefore)
      .receiverPartyId(receiverPartyId);
    assert.throws(() => txBuilder.toRequestObject(), /senderPartyId is missing/);
  });

  it('should throw if commandId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.commandId(''), /commandId must be a non-empty string/);
  });

  it('should throw if token is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.token(''), /token must be a non-empty string/);
  });

  it('should throw if operatorId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.operatorId(''), /operatorId must be a non-empty string/);
  });

  it('should throw if contractId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if tradeId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.tradeId(''), /tradeId must be a non-empty string/);
  });

  it('should throw if transferLegId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.transferLegId(''), /transferLegId must be a non-empty string/);
  });

  it('should throw if allocateBefore is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.allocateBefore(''), /allocateBefore must be a non-empty string/);
  });

  it('should throw if settleBefore is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.settleBefore(''), /settleBefore must be a non-empty string/);
  });

  it('should throw if receiverPartyId is an empty string', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.receiverPartyId(''), /receiverPartyId must be a non-empty string/);
  });

  it('should set the prepareCommand via setTransaction', function () {
    const txBuilder = new AllocationAllocateBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const prepareCommandResponse = {
      preparedTransactionHash: 'abc123',
      hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
    };
    txBuilder.setTransaction(prepareCommandResponse);
    assert.deepEqual(tx.prepareCommand, prepareCommandResponse);
  });
});
