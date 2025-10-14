import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { Transaction } from '../../../../src';
import { OneStepEnablementRequest } from '../../../../src/lib/iface';
import { OneStepPreApprovalBuilder } from '../../../../src/lib/oneStepPreApprovalBuilder';

import {
  InvalidOneStepPreApprovalPrepareResponse,
  OneStepEnablement,
  OneStepPreApprovalPrepareResponse,
} from '../../../resources';

describe('Wallet Pre-approval Enablement Builder', () => {
  it('should get the wallet init request object', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    const { commandId, partyId } = OneStepEnablement;
    txBuilder.commandId(commandId).receiverPartyId(partyId);
    const requestObj: OneStepEnablementRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.receiverId, partyId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should validate raw transaction', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    txBuilder.validateRawTransaction(OneStepPreApprovalPrepareResponse.preparedTransaction);
  });

  it('should validate the transaction', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    oneStepEnablementTx.prepareCommand = OneStepPreApprovalPrepareResponse;
    txBuilder.initBuilder(oneStepEnablementTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    txBuilder.validateTransaction(oneStepEnablementTx);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    txBuilder.setTransaction(InvalidOneStepPreApprovalPrepareResponse);
    try {
      txBuilder.validateRawTransaction(InvalidOneStepPreApprovalPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    oneStepEnablementTx.prepareCommand = InvalidOneStepPreApprovalPrepareResponse;
    try {
      txBuilder.validateTransaction(oneStepEnablementTx);
    } catch (e) {
      assert.equal(e.message, 'invalid transaction');
    }
  });
});
