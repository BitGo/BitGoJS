import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { OneStepPreApprovalBuilder, Transaction } from '../../../../src';
import { CantonOneStepEnablementRequest } from '../../../../src/lib/iface';

import {
  CantonTokenPreApprovalPrepareResponse,
  InvalidOneStepPreApprovalPrepareResponse,
  OneStepEnablement,
  OneStepPreApprovalPrepareResponse,
} from '../../../resources';

describe('Wallet Pre-approval Enablement Builder', () => {
  it('should get the one step enablement request object', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    const { commandId, partyId } = OneStepEnablement;
    txBuilder.commandId(commandId).receiverPartyId(partyId);
    const requestObj: CantonOneStepEnablementRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.receiverId, partyId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should get the one step enablement request object for token', function () {
    const txBuilder = new OneStepPreApprovalBuilder(coins.get('tcanton'));
    const oneStepEnablementTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(oneStepEnablementTx);
    txBuilder.setTransaction(CantonTokenPreApprovalPrepareResponse);
    const commandId = '7d99789d-2f22-49e1-85cb-79d2ce5a69c1';
    const partyId = 'ravi-2-step-party-new::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2';
    const token = 'tcanton:testcoin1';
    txBuilder.commandId(commandId).receiverPartyId(partyId).tokenName(token);
    const requestObj: CantonOneStepEnablementRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.receiverId, partyId);
    assert.equal(requestObj.tokenName, token);
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
