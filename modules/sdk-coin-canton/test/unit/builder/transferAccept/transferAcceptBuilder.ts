import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { TransferAcceptanceBuilder, Transaction } from '../../../../src';
import { CantonTransferAcceptRejectRequest } from '../../../../src/lib/iface';

import {
  CantonTokenAcceptPrepareResponse,
  CBTCTokenAcceptancePrepareResponse,
  TransferAcceptance,
  TransferAcceptancePrepareResponse,
} from '../../../resources';

describe('Transfer Acceptance Builder', () => {
  it('should get the transfer acceptance request object', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(TransferAcceptancePrepareResponse);
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

  it('should get the token transfer acceptance request object', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(CantonTokenAcceptPrepareResponse);
    const commandId = '3935a06d-3b03-41be-99a5-95b2ecaabf7d';
    const partyId = 'ravi-2-step-party::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2';
    const { contractId } = TransferAcceptance;
    txBuilder.commandId(commandId).contractId(contractId).actAs(partyId);
    const requestObj: CantonTransferAcceptRejectRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.contractId, contractId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should get the transfer acceptance request object for cbtc token', function () {
    const txBuilder = new TransferAcceptanceBuilder(coins.get('tcanton'));
    const transferAcceptanceTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(transferAcceptanceTx);
    txBuilder.setTransaction(CBTCTokenAcceptancePrepareResponse);
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
