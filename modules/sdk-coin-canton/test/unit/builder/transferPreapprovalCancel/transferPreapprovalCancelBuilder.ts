import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { Transaction, TransferPreapprovalCancelBuilder } from '../../../../src';
import { CantonTransferPreapprovalCancelRequest } from '../../../../src/lib/iface';

import {
  CantonTokenPreApprovalPrepareResponse,
  InvalidOneStepPreApprovalPrepareResponse,
  OneStepEnablement,
  OneStepPreApprovalPrepareResponse,
} from '../../../resources';

describe('Wallet Pre-approval Cancel Builder', () => {
  it('should get the transfer preapproval cancel request object', function () {
    const txBuilder = new TransferPreapprovalCancelBuilder(coins.get('tcanton'));
    const cancelTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(cancelTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    const { commandId, partyId } = OneStepEnablement;
    txBuilder.commandId(commandId).receiverPartyId(partyId);
    const requestObj: CantonTransferPreapprovalCancelRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.receiverId, partyId);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should get the transfer preapproval cancel request object for token', function () {
    const txBuilder = new TransferPreapprovalCancelBuilder(coins.get('tcanton'));
    const cancelTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(cancelTx);
    txBuilder.setTransaction(CantonTokenPreApprovalPrepareResponse);
    const commandId = '7d99789d-2f22-49e1-85cb-79d2ce5a69c1';
    const partyId = 'ravi-2-step-party-new::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2';
    const token = 'tcanton:testcoin1';
    txBuilder.commandId(commandId).receiverPartyId(partyId).tokenName(token);
    const requestObj: CantonTransferPreapprovalCancelRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.receiverId, partyId);
    assert.equal(requestObj.tokenName, token);
    assert.equal(requestObj.actAs.length, 1);
    const actAs = requestObj.actAs[0];
    assert.equal(actAs, partyId);
  });

  it('should throw when commandId is missing', function () {
    const txBuilder = new TransferPreapprovalCancelBuilder(coins.get('tcanton'));
    const cancelTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(cancelTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    txBuilder.receiverPartyId(OneStepEnablement.partyId);
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw when receiver partyId is missing', function () {
    const txBuilder = new TransferPreapprovalCancelBuilder(coins.get('tcanton'));
    const cancelTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(cancelTx);
    txBuilder.setTransaction(OneStepPreApprovalPrepareResponse);
    txBuilder.commandId(OneStepEnablement.commandId);
    assert.throws(() => txBuilder.toRequestObject(), /receiver partyId is missing/);
  });

  it('should throw error in validating raw transaction', function () {
    const txBuilder = new TransferPreapprovalCancelBuilder(coins.get('tcanton'));
    const cancelTx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(cancelTx);
    txBuilder.setTransaction(InvalidOneStepPreApprovalPrepareResponse);
    try {
      txBuilder.validateRawTransaction(InvalidOneStepPreApprovalPrepareResponse.preparedTransaction);
    } catch (e) {
      assert.equal(e.message, 'invalid raw transaction, hash not matching');
    }
  });
});
