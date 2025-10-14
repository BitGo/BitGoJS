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
    const { synchronizer, commandId, partyId, validatorPartyId, expectedDsoId, templateId, synchronizerId } =
      OneStepEnablement;
    txBuilder
      .commandId(commandId)
      .templateId(templateId)
      .expectedDso(expectedDsoId)
      .templateId(templateId)
      .providerPartyId(validatorPartyId)
      .receiverPartyId(partyId)
      .synchronizerId(synchronizerId);
    const requestObj: OneStepEnablementRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.synchronizerId, synchronizer);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.commands.length, 1);
    const command = requestObj.commands[0];
    should.exist(command);
    const createCommand = command.CreateCommand;
    should.exist(createCommand);
    assert.equal(createCommand.templateId, templateId);
    const createArguments = createCommand.createArguments;
    should.exist(createArguments);
    assert.equal(createArguments.expectedDso, expectedDsoId);
    assert.equal(createArguments.provider, validatorPartyId);
    assert.equal(createArguments.receiver, partyId);
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
