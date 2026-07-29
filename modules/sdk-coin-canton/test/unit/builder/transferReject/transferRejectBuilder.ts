import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { Transaction, TransferRejectionBuilder } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import {
  CantonTokenRejectPrepareResponse,
  CBTCTokenRejectionPrepareResponse,
  TransferAcceptance,
  TransferRejection,
  TransferRejectionPrepareResponse,
} from '../../../resources';

describe('Transfer Rejection Builder', () => {
  it('should get the transfer rejection request object', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(TransferRejectionPrepareResponse);
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

  it('should get the token transfer rejection request object', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonTokenRejectPrepareResponse);
    const { commandId, contractId, partyId } = TransferRejection;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    txBuilder.transaction.toJson();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should get the transfer acceptance request object for cbtc token', function () {
    const txBuilder = new TransferRejectionBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(CBTCTokenRejectionPrepareResponse);
    const commandId = '3935a06d-3b03-41be-99a5-95b2ecaabf7d';
    const partyId = '12201::1220175583b704cbb493393c1dbe17b9909ee4cf55ef345e8147cd6900c5768f861d';
    const { contractId } = TransferAcceptance;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    const txData = txBuilder.transaction.toJson();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
    should.exist(txData);
    assert.equal(txData.sender, '12203::1220307926a923431f0aed10609fff4519826a7032d26cb9360d4f67b3082d332f93');
    assert.equal(txData.receiver, partyId);
    assert.equal(txData.amount, '1000000');
    assert.equal(txData.token, 'canton:cbtc');
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
