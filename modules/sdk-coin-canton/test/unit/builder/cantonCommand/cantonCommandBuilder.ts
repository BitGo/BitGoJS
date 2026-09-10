import assert from 'assert';
import should from 'should';

import { coins } from '@bitgo/statics';

import { CantonCommandBuilder, Transaction } from '../../../../src';
import { CantonCommandRequest } from '../../../../src/lib/iface';

const CantonCommandPrepareResponse = {
  preparedTransaction: 'dGVzdC1wcmVwYXJlZC10cmFuc2FjdGlvbg==',
  preparedTransactionHash: 'dGVzdC1oYXNo',
  hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
};

const partyId = '12201::1220175583b704cbb493393c1dbe17b9909ee4cf55ef345e8147cd6900c5768f861d';
const commandId = '3935a06d-3b03-41be-99a5-95b2ecaabf7d';

describe('Canton Command Builder', () => {
  it('should get the exercise command request object', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder
      .commandId(commandId)
      .actAs([partyId])
      .command({
        ExerciseCommand: {
          templateId: 'Splice.AmuletRules:TransferPreapproval',
          choice: 'TransferPreapproval_Cancel',
          choiceArgument: { p: partyId },
        },
      })
      .resolveContracts([
        {
          templateId: 'Splice.AmuletRules:TransferPreapproval',
          actAs: [partyId],
          injectAs: 'ExerciseCommand.contractId',
        },
      ]);
    const requestObj: CantonCommandRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.commandId, commandId);
    assert.equal(requestObj.actAs.length, 1);
    assert.equal(requestObj.actAs[0], partyId);
    assert.deepEqual(requestObj.command, {
      ExerciseCommand: {
        templateId: 'Splice.AmuletRules:TransferPreapproval',
        choice: 'TransferPreapproval_Cancel',
        choiceArgument: { p: partyId },
      },
    });
    assert.equal(requestObj.resolveContracts?.length, 1);
    assert.equal(requestObj.resolveContracts?.[0].injectAs, 'ExerciseCommand.contractId');
  });

  it('should get the create command request object without resolveContracts', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder
      .commandId(commandId)
      .actAs([partyId])
      .command({
        CreateCommand: {
          templateId: 'Splice.Wallet.TransferPreapproval:TransferPreapprovalProposal',
          createArguments: { provider: partyId, receiver: partyId },
        },
      });
    const requestObj: CantonCommandRequest = txBuilder.toRequestObject();
    should.exist(requestObj);
    assert.equal(requestObj.resolveContracts, undefined);
  });

  it('should not throw building toJson for a generic command', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder
      .commandId(commandId)
      .actAs([partyId])
      .command({
        ExerciseCommand: {
          templateId: 'Splice.AmuletRules:TransferPreapproval',
          choice: 'TransferPreapproval_Cancel',
          choiceArgument: { p: partyId },
        },
      });
    const txData = txBuilder.transaction.toJson();
    should.exist(txData);
    assert.equal(txData.amount, '0');
  });

  it('should throw if commandId is missing', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder.actAs([partyId]).command({
      ExerciseCommand: {
        templateId: 'Splice.AmuletRules:TransferPreapproval',
        choice: 'TransferPreapproval_Cancel',
      },
    });
    assert.throws(() => txBuilder.toRequestObject(), /commandId is missing/);
  });

  it('should throw if actAs is missing', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder.commandId(commandId).command({
      ExerciseCommand: {
        templateId: 'Splice.AmuletRules:TransferPreapproval',
        choice: 'TransferPreapproval_Cancel',
      },
    });
    assert.throws(() => txBuilder.toRequestObject(), /actAs is missing/);
  });

  it('should throw if command is missing', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    txBuilder.initBuilder(tx);
    txBuilder.setTransaction(CantonCommandPrepareResponse);
    txBuilder.commandId(commandId).actAs([partyId]);
    assert.throws(() => txBuilder.toRequestObject(), /command is missing/);
  });

  it('should throw if actAs is set to an empty array', function () {
    const txBuilder = new CantonCommandBuilder(coins.get('tcanton'));
    assert.throws(() => txBuilder.actAs([]), /actAs must contain at least one party/);
  });
});
