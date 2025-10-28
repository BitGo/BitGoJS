import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { Transaction, TransferRejectionBuilder } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import { TransferRejection, TransferRejectionPrepareResponse } from '../../../resources';

describe('Transfer Rejection Builder', () => {
  it('should get the transfer rejection request object', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const { commandId, contractId, partyId } = TransferRejection;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should validate raw transaction', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(TransferRejectionPrepareResponse);
    txBuilder.validateRawTransaction(TransferRejectionPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.prepareCommand = TransferRejectionPrepareResponse;
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(TransferRejectionPrepareResponse);
    txBuilder.validateTransaction(tx);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    const invalidPrepareResponse = TransferRejectionPrepareResponse;
    invalidPrepareResponse.preparedTransactionHash = 'QFxX1WBdq7lZbSc45iKA3J/oOF9mrVLc3DeKphAjb15=';
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });
});
