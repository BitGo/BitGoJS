import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { AllocationAllocateWithdrawnBuilder, Transaction } from '../../../../src';
import { CantonAllocationAllocateWithdrawnRequest } from '../../../../src/lib/iface';

import { CantonAllocationWithdrawPrepareResponse, TransferAcceptance } from '../../../resources';

describe('AllocationAllocateWithdrawn Builder', () => {
  it('should get the allocation allocate withdrawn request object', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationWithdrawPrepareResponse);
    const { commandId, contractId, partyId } = TransferAcceptance;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonAllocationAllocateWithdrawnRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    assert.equal(requestObj.actAs[0], partyId);
    assert.equal(requestObj.verboseHashing, false);
    assert.deepEqual(requestObj.readAs, []);
  });

  it('should include tokenName when set', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationWithdrawPrepareResponse);
    const { commandId, contractId, partyId } = TransferAcceptance;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId).tokenName('tcanton:test-token');
    const requestObj: CantonAllocationAllocateWithdrawnRequest = txBuilder.toRequestObject();
    assert.equal(requestObj.tokenName, 'tcanton:test-token');
  });

  it('should set the transaction id to the commandId', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId } = TransferAcceptance;
    txBuilder.commandId(commandId);
    assert.equal(tx.id, commandId);
  });

  it('should validate raw canton allocation allocate withdrawn transaction', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationWithdrawPrepareResponse);
    txBuilder.validateRawTransaction(CantonAllocationWithdrawPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.prepareCommand = CantonAllocationWithdrawPrepareResponse;
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationWithdrawPrepareResponse);
    txBuilder.validateTransaction(tx);
  });

  it('should throw error on invalid raw transaction hash mismatch', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const invalidPrepareResponse = {
      ...CantonAllocationWithdrawPrepareResponse,
      preparedTransactionHash: '+vlIXv6Vgd2ypPXD0mrdn7RlcSH4c2hCRj2/tXqqUVs=',
    };
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });

  it('should throw if commandId is missing', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { contractId, partyId } = TransferAcceptance;
    txBuilder.contractId(contractId).actAs(partyId);
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId, partyId } = TransferAcceptance;
    txBuilder.commandId(commandId).actAs(partyId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if actAs is missing', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId, contractId } = TransferAcceptance;
    txBuilder.commandId(commandId).contractId(contractId);
    assert.throws(() => txBuilder.toRequestObject(), /actAs partyId is missing/);
  });

  it('should throw if commandId is an empty string', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.commandId(''), /commandId must be a non-empty string/);
  });

  it('should throw if contractId is an empty string', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if actAs is an empty string', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.actAs(''), /actAsPartyId must be a non-empty string/);
  });

  it('should throw if tokenName is an empty string', function () {
    const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.tokenName(''), /tokenName must be a non-empty string/);
  });

  describe('Prepared transaction parsing', () => {
    it('should parse the allocation allocate withdrawn prepared transaction', function () {
      const txBuilder = new AllocationAllocateWithdrawnBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      txBuilder.initBuilder(tx);
      txBuilder.commandId(TransferAcceptance.commandId);
      txBuilder.setTransaction(CantonAllocationWithdrawPrepareResponse);
      const txData = txBuilder.transaction.toJson();
      should.exist(txData);
      // owner of the returned Holding = sender = receiver
      assert.equal(
        txData.sender,
        'ravi-2-step-party::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2'
      );
      assert.equal(txData.sender, txData.receiver);
      assert.equal(txData.amount, '50000000000');
    });
  });
});
