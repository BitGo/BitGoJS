import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { AllocationRejectBuilder, Transaction } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import { AllocationRejection, CantonAllocationRejectPrepareResponse } from '../../../resources';

describe('AllocationReject Builder', () => {
  it('should get the allocation reject request object', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationRejectPrepareResponse);
    const { commandId, contractId, partyId } = AllocationRejection;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    assert.equal(requestObj.actAs[0], partyId);
    assert.equal(requestObj.verboseHashing, false);
    assert.deepEqual(requestObj.readAs, []);
  });

  it('should set the transaction id to the commandId', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId } = AllocationRejection;
    txBuilder.commandId(commandId);
    assert.equal(tx.id, commandId);
  });

  it('should validate raw canton allocation reject transaction', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationRejectPrepareResponse);
    txBuilder.validateRawTransaction(CantonAllocationRejectPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.prepareCommand = CantonAllocationRejectPrepareResponse;
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonAllocationRejectPrepareResponse);
    txBuilder.validateTransaction(tx);
  });

  it('should throw error on invalid raw transaction hash mismatch', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const invalidPrepareResponse = {
      ...CantonAllocationRejectPrepareResponse,
      preparedTransactionHash: 'L1KfrA5exnpsOqtXODGj2gNF+y/dv/onPtVvGJ5km7d=',
    };
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });

  it('should throw if commandId is missing', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { contractId, partyId } = AllocationRejection;
    txBuilder.contractId(contractId).actAs(partyId);
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw if contractId is missing', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId, partyId } = AllocationRejection;
    txBuilder.commandId(commandId).actAs(partyId);
    assert.throws(() => txBuilder.toRequestObject(), /contractId is missing/);
  });

  it('should throw if actAs is missing', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId, contractId } = AllocationRejection;
    txBuilder.commandId(commandId).contractId(contractId);
    assert.throws(() => txBuilder.toRequestObject(), /actAs partyId is missing/);
  });

  it('should throw if commandId is an empty string', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.commandId(''), /commandId must be a non-empty string/);
  });

  it('should throw if contractId is an empty string', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.contractId(''), /contractId must be a non-empty string/);
  });

  it('should throw if actAs is an empty string', function () {
    const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.actAs(''), /actAsPartyId must be a non-empty string/);
  });

  describe('Prepared transaction parsing', () => {
    it('should parse the allocation reject prepared transaction', function () {
      const txBuilder = new AllocationRejectBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      txBuilder.initBuilder(tx);
      txBuilder.commandId(AllocationRejection.commandId);
      txBuilder.setTransaction(CantonAllocationRejectPrepareResponse);
      const txData = txBuilder.transaction.toJson();
      should.exist(txData);
      // seller = rejecting party (sender)
      assert.equal(
        txData.sender,
        'ravi-2-step-party::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2'
      );
      // buyer = counterparty (receiver)
      assert.equal(txData.receiver, '12208::122083082e9af156feaeb7afd363a0ee5ffa1fd160947b647a139a7e0c2ed78f5dc7');
      // amount from dvp.terms.deliveries[0] (converted to lowest unit: 2.0 * 10^10 = 20000000000)
      assert.equal(txData.amount, '20000000000');
    });
  });
});
