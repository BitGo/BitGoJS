import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { Transaction, TransferOfferWithdrawnBuilder } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import {
  CantonTokenTransferOfferWithdrawnPrepareResponse,
  CantonTransferOfferWithdrawnPrepareResponse,
  TransferAcceptance,
} from '../../../resources';

describe('Transfer Offer Withdrawn Builder', () => {
  it('should get the transfer offer withdrawn request object', function () {
    const txBuilder = new TransferOfferWithdrawnBuilder(coins.get('tcanton'));
    const transferOfferWithdrawnTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferOfferWithdrawnTx);
    txBuilder.setTransaction(CantonTokenTransferOfferWithdrawnPrepareResponse);
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

  it('should validate raw canton transfer offer withdrawn transaction', function () {
    const txBuilder = new TransferOfferWithdrawnBuilder(coins.get('tcanton'));
    const transferOfferWithdrawnTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferOfferWithdrawnTx);
    txBuilder.setTransaction(CantonTransferOfferWithdrawnPrepareResponse);
    txBuilder.validateRawTransaction(CantonTransferOfferWithdrawnPrepareResponse.preparedTransaction);
  });

  it('should validate raw canton token transfer offer withdrawn transaction', function () {
    const txBuilder = new TransferOfferWithdrawnBuilder(coins.get('tcanton'));
    const transferOfferWithdrawnTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferOfferWithdrawnTx);
    txBuilder.setTransaction(CantonTokenTransferOfferWithdrawnPrepareResponse);
    txBuilder.validateRawTransaction(CantonTokenTransferOfferWithdrawnPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new TransferOfferWithdrawnBuilder(coins.get('tcanton'));
    const transferOfferWithdrawnTx = new Transaction(coins.get('tcanton'));
    transferOfferWithdrawnTx.prepareCommand = CantonTransferOfferWithdrawnPrepareResponse;
    txBuilder.initBuilder(transferOfferWithdrawnTx);
    txBuilder.setTransaction(CantonTransferOfferWithdrawnPrepareResponse);
    txBuilder.validateTransaction(transferOfferWithdrawnTx);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new TransferOfferWithdrawnBuilder(coins.get('tcanton'));
    const transferOfferWithdrawnTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferOfferWithdrawnTx);
    const invalidPrepareResponse = CantonTransferOfferWithdrawnPrepareResponse;
    invalidPrepareResponse.preparedTransactionHash = '+vlIXv6Vgd2ypPXD0mrdn7RlcSH4c2hCRj2/tXqqUVs=';
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });
});
