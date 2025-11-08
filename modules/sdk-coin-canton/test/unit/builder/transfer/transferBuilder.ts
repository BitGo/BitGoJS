import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { TransferBuilder, Transaction } from '../../../../src';
import { CantonTransferRequest } from '../../../../src/lib/iface';

import { TransferObj, TrasferPrepareResponse } from '../../../resources';

describe('Transfer Builder', () => {
  it('should get the transfer request object', function () {
    const txBuilder = new TransferBuilder(coins.get('tcanton'));
    const transferTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferTx);
    txBuilder.setTransaction(TrasferPrepareResponse);
    const { commandId, senderPartyId, receiverPartyId, amount, sendOneStep, expiryEpoch } = TransferObj;
    txBuilder
      .commandId(commandId)
      .senderId(senderPartyId)
      .receiverId(receiverPartyId)
      .amount(amount)
      .sendOneStep(sendOneStep)
      .expiryEpoch(expiryEpoch);
    const requestObj: CantonTransferRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.senderPartyId, senderPartyId);
    assert.equal(requestObj.receiverPartyId, receiverPartyId);
    assert.equal(requestObj.amount, amount);
    assert.equal(requestObj.expiryEpoch, expiryEpoch);
  });

  it('should validate raw transaction', function () {
    const txBuilder = new TransferBuilder(coins.get('tcanton'));
    const transferTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferTx);
    txBuilder.setTransaction(TrasferPrepareResponse);
    txBuilder.validateRawTransaction(TrasferPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new TransferBuilder(coins.get('tcanton'));
    const transferTx = new Transaction(coins.get('tcanton'));
    transferTx.prepareCommand = TrasferPrepareResponse;
    txBuilder.initBuilder(transferTx);
    txBuilder.setTransaction(TrasferPrepareResponse);
    txBuilder.validateTransaction(transferTx);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new TransferBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    const invalidPrepareResponse = TrasferPrepareResponse;
    invalidPrepareResponse.preparedTransactionHash = 'y12u05viQ8euhNh9c21KK8lbn/7wM4aeG5U4ouanTWZ=';
    txBuilder.setTransaction(invalidPrepareResponse);
    try {
      txBuilder.validateRawTransaction(invalidPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });
});
