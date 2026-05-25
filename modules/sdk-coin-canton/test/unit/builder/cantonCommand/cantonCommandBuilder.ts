import assert from 'assert';
import should from 'should';

import { CantonCreateCommand, CantonExerciseCommand, TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

import { CantonCommandBuilder } from '../../../../src/lib/cantonCommandBuilder';
import { TransactionBuilderFactory } from '../../../../src/lib/transactionBuilderFactory';
import { Transaction } from '../../../../src/lib/transaction/transaction';
import { CantonCommandRequest } from '../../../../src/lib/iface';
import { CantonExerciseCommandPrepareResponse } from '../../../resources';

const PARTY_A = 'RegRegistrar::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5';
const PARTY_B = 'RegProvider::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5';
const TEMPLATE_ID =
  '7a75ef6e69f69395a4e60919e228528bb8f3881150ccfde3f31bcc73864b18ab:Utility.Registry.App.V0.Service.AllocationFactory:AllocationFactory';
const CONTRACT_ID =
  '00f3afdce846a40c6f3f618c4b584b022a0197010057ecd59458200183ab27de0aca1212204aef7ede37a5f41b674a1d95446d42a404461c5558c4e6d1860b65560120ef18';

const sampleExerciseCommand: CantonExerciseCommand = {
  ExerciseCommand: {
    templateId: TEMPLATE_ID,
    contractId: CONTRACT_ID,
    choice: 'AllocationFactory_OfferMint',
    choiceArgument: {
      expectedAdmin: PARTY_A,
      mint: { instrumentId: { admin: PARTY_A, id: 'TESTTOKEN' }, amount: '100', holder: PARTY_A, reference: 'test' },
    },
  },
};

const sampleCreateCommand: CantonCreateCommand = {
  CreateCommand: {
    templateId: TEMPLATE_ID,
    createArguments: { provider: PARTY_B, registrar: PARTY_A, operator: PARTY_B },
  },
};

describe('CantonCommandBuilder', () => {
  describe('commandId()', () => {
    it('should set the command ID and transaction ID', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.commandId('test-cmd-id-123');
      assert.equal(builder['_commandId'], 'test-cmd-id-123');
      assert.equal(builder['transaction'].id, 'test-cmd-id-123');
    });

    it('should throw on empty string', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.throws(() => builder.commandId(''), /commandId must be a non-empty string/);
    });

    it('should throw on whitespace-only string', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.throws(() => builder.commandId('   '), /commandId must be a non-empty string/);
    });
  });

  describe('actAs()', () => {
    it('should set acting parties and update transaction', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.actAs([PARTY_A]);
      assert.deepEqual(builder['_actAs'], [PARTY_A]);
      assert.deepEqual(builder['transaction'].cantonCommandActAsParties, [PARTY_A]);
    });

    it('should throw on empty array', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.throws(() => builder.actAs([]), /actAs must be a non-empty array/);
    });

    it('should throw on array with empty strings', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.throws(() => builder.actAs(['']), /actAs parties must be non-empty strings/);
    });
  });

  describe('readAs()', () => {
    it('should set read-only parties', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.readAs([PARTY_B]);
      assert.deepEqual(builder['_readAs'], [PARTY_B]);
    });

    it('should default to empty array when passed undefined', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.readAs(undefined);
      assert.deepEqual(builder['_readAs'], []);
    });

    it('should default to empty array when passed null', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.readAs(null);
      assert.deepEqual(builder['_readAs'], []);
    });
  });

  describe('command()', () => {
    it('should set an ExerciseCommand', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.command(sampleExerciseCommand);
      assert.deepEqual(builder['_command'], sampleExerciseCommand);
    });

    it('should set a CreateCommand', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.command(sampleCreateCommand);
      assert.deepEqual(builder['_command'], sampleCreateCommand);
    });

    it('should throw on non-object input', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.throws(() => builder.command(null as unknown as CantonExerciseCommand), /command must be a plain object/);
    });
  });

  describe('resolveContracts()', () => {
    it('should set the spec array', function () {
      const spec = [{ templateId: TEMPLATE_ID, actAs: [PARTY_A], injectAs: 'command.ExerciseCommand.contractId' }];
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.resolveContracts(spec);
      assert.deepEqual(builder['_resolveContracts'], spec);
    });
  });

  describe('toRequestObject()', () => {
    it('should return correct object with all required fields', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.commandId('cmd-001').actAs([PARTY_A]).readAs([PARTY_B]).command(sampleExerciseCommand);
      const req: CantonCommandRequest = builder.toRequestObject();
      should.exist(req);
      assert.equal(req.commandId, 'cmd-001');
      assert.deepEqual(req.actAs, [PARTY_A]);
      assert.deepEqual(req.readAs, [PARTY_B]);
      assert.deepEqual(req.command, sampleExerciseCommand);
    });

    it('should throw when commandId is missing', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.actAs([PARTY_A]).command(sampleExerciseCommand);
      assert.throws(() => builder.toRequestObject(), /commandId is missing/);
    });

    it('should throw when actAs is missing', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.commandId('cmd-001').command(sampleExerciseCommand);
      assert.throws(() => builder.toRequestObject(), /actAs is missing/);
    });

    it('should throw when command is missing', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.commandId('cmd-001').actAs([PARTY_A]);
      assert.throws(() => builder.toRequestObject(), /command is missing/);
    });

    it('should throw when command contains invalid key', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder
        .commandId('cmd-001')
        .actAs([PARTY_A])
        .command({ UnknownCommand: {} } as unknown as CantonExerciseCommand);
      assert.throws(() => builder.toRequestObject(), /command must contain exactly one of/);
    });

    it('should include empty resolveContracts by default', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      const tx = new Transaction(coins.get('tcanton'));
      builder.initBuilder(tx);
      builder.commandId('cmd-002').actAs([PARTY_A]).command(sampleCreateCommand);
      const req = builder.toRequestObject();
      assert.deepEqual(req.resolveContracts, []);
    });
  });

  describe('initBuilder()', () => {
    it('should correctly initialize from existing transaction with cantonCommandActAsParties', function () {
      const tx = new Transaction(coins.get('tcanton'));
      tx.transactionType = TransactionType.CantonCommand;
      tx.cantonCommandActAs = [PARTY_A];
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.deepEqual(builder['_actAs'], [PARTY_A]);
    });

    it('should leave _actAs as empty array when transaction has no parties', function () {
      const tx = new Transaction(coins.get('tcanton'));
      tx.transactionType = TransactionType.CantonCommand;
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      builder.initBuilder(tx);
      assert.deepEqual(builder['_actAs'], []);
    });
  });

  describe('transactionType', () => {
    it('should return CantonCommand type', function () {
      const builder = new CantonCommandBuilder(coins.get('tcanton'));
      assert.equal(builder.transactionType, TransactionType.CantonCommand);
    });
  });
});

describe('TransactionBuilderFactory - CantonCommand', () => {
  it('should return a CantonCommandBuilder from getCantonCommandBuilder()', function () {
    const factory = new TransactionBuilderFactory(coins.get('tcanton'));
    const builder = factory.getCantonCommandBuilder();
    should.exist(builder);
    assert.ok(builder instanceof CantonCommandBuilder);
    assert.equal(builder.transactionType, TransactionType.CantonCommand);
  });

  it('should return a CantonCommandBuilder from from() with CantonCommand raw transaction', function () {
    const factory = new TransactionBuilderFactory(coins.get('tcanton'));
    const tx = new Transaction(coins.get('tcanton'));
    tx.transactionType = TransactionType.CantonCommand;
    tx.id = 'test-cmd-001';
    tx.prepareCommand = CantonExerciseCommandPrepareResponse;
    const rawTx = tx.toBroadcastFormat();
    const builder = factory.from(rawTx);
    should.exist(builder);
    assert.ok(builder instanceof CantonCommandBuilder);
  });
});

describe('Transaction toJson and explainTransaction - CantonCommand', () => {
  let tx: Transaction;

  beforeEach(() => {
    tx = new Transaction(coins.get('tcanton'));
    tx.transactionType = TransactionType.CantonCommand;
    tx.id = 'test-cmd-001';
    tx.prepareCommand = CantonExerciseCommandPrepareResponse;
    tx.cantonCommandActAs = [PARTY_A];
  });

  describe('toJson()', () => {
    it('should return cantonCommand summary for CantonCommand transactions', function () {
      const json = tx.toJson();
      should.exist(json);
      should.exist(json.cantonCommand);
    });

    it('should include kind, templateId, and actAs in summary', function () {
      const json = tx.toJson();
      const cc = json.cantonCommand!;
      assert.ok(['ExerciseCommand', 'CreateCommand'].includes(cc.kind));
      assert.ok(cc.templateId.includes(':'));
      assert.deepEqual(cc.actAs, [PARTY_A]);
    });

    it('should include choice for ExerciseCommand', function () {
      const json = tx.toJson();
      const cc = json.cantonCommand!;
      if (cc.kind === 'ExerciseCommand') {
        should.exist(cc.choice);
        assert.equal(cc.choice, 'AllocationFactory_OfferMint');
      }
    });

    it('should include contractId for ExerciseCommand when present', function () {
      const json = tx.toJson();
      const cc = json.cantonCommand!;
      if (cc.kind === 'ExerciseCommand') {
        should.exist(cc.contractId);
      }
    });
  });

  describe('explainTransaction()', () => {
    it('should return explanation with cantonCommand field for CantonCommand type', function () {
      const explanation = tx.explainTransaction();
      should.exist(explanation);
      should.exist(explanation.cantonCommand);
    });

    it('should have correct structure (id, displayOrder, outputs, inputs, fee, type)', function () {
      const explanation = tx.explainTransaction();
      assert.ok('id' in explanation);
      assert.ok('displayOrder' in explanation);
      assert.ok('outputs' in explanation);
      assert.ok('inputs' in explanation);
      assert.ok('fee' in explanation);
      assert.ok('type' in explanation);
    });

    it('should have correct cantonCommand summary fields', function () {
      const explanation = tx.explainTransaction();
      const cc = explanation.cantonCommand!;
      assert.equal(cc.kind, 'ExerciseCommand');
      assert.equal(
        cc.templateId,
        '7a75ef6e69f69395a4e60919e228528bb8f3881150ccfde3f31bcc73864b18ab:Utility.Registry.App.V0.Service.AllocationFactory:AllocationFactory'
      );
      assert.equal(cc.choice, 'AllocationFactory_OfferMint');
      assert.ok(cc.contractId && cc.contractId.length > 0);
      assert.deepEqual(cc.actAs, [PARTY_A]);
    });
  });
});
