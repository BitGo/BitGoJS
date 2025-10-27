import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { TransferAcceptanceBuilder, Transaction } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import { TransferAcceptance, TransferAcceptancePrepareResponse } from '../../../resources';

describe('Transfer Acceptance Builder', () => {
  it('should get the transfer acceptance request object', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    const { commandId, contractId, partyId } = TransferAcceptance;
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
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(TransferAcceptancePrepareResponse);
    txBuilder.validateRawTransaction(TransferAcceptancePrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    transferAcceptanceTx.prepareCommand = TransferAcceptancePrepareResponse;
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(TransferAcceptancePrepareResponse);
    txBuilder.validateTransaction(transferAcceptanceTx);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    const invalidPrepareResponse = TransferAcceptancePrepareResponse;
    invalidPrepareResponse.preparedTransactionHash = '+vlIXv6Vgd2ypPXD0mrdn7RlcSH4c2hCRj2/tXqqUVs=';
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });
});
