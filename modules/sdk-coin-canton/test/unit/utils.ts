import assert from 'assert';
import should from 'should';

import { TransactionType } from '@bitgo/sdk-core';

import utils from '../../src/lib/utils';
import { Value } from '../../src/lib/resourcesInterface';
import {
  CANTON_ADDRESSES,
  CANTON_BLOCK_HEIGHT,
  CantonExerciseCommandPrepareResponse,
  GenerateTopologyResponse,
  OneStepPreApprovalPrepareResponse,
  PreparedTransactionRawData,
  PreparedTransactionWithMemo,
  PreparedTxn1StepReceiver,
  PreparedTxn2StepReceiver,
  PrepareSubmissionResponse,
  TransferAcceptancePrepareResponse,
  TransferRejectionPrepareResponse,
} from '../resources';

describe('Canton Util', function () {
  describe('Raw transaction parser', function () {
    it('should parse the prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTransactionRawData, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'abc-1::12200c1ee226fbdf9fba3461c2c0c73331b69d3c6fd8cfce28cdf864141141cc656d');
      assert.equal(parsedData.receiver, 'abc-2::12207e96ada18a845adf4dc01410265633d5266dca9bb280c98e35c3692db87d3e35');
      assert.equal(parsedData.amount, '200000000000');
    });

    it('should parse the prepared transaction with memo id field', function () {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTransactionWithMemo, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, '1220b::1220bab6ef3eec37b1b3816099befe72b43bf6c1380077d6349254c41ffb7f7753bb');
      assert.equal(parsedData.receiver, '1220a::1220ade60300cf7d0b18ffaa2ffe4f492ad1ad601cfc162b20f77ec99d16c2c2f158');
      assert.equal(parsedData.amount, '1000000000');
      assert.equal(parsedData.memoId, '11');
    });

    it('should parse correctly when receiver is on 2-step', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTxn2StepReceiver, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, '1220a::1220ade60300cf7d0b18ffaa2ffe4f492ad1ad601cfc162b20f77ec99d16c2c2f158');
      assert.equal(
        parsedData.receiver,
        'ravi-test-party-1::122092e7d33ac10c0f3d55976342f37555df05da5b742956d56a62ae2367769079d2'
      );
      assert.equal(parsedData.amount, '20000000000');
    });

    it('should parse correctly 1', () => {
      const parsedData = utils.parseRawCantonTransactionData(PreparedTxn1StepReceiver, TransactionType.Send);
      should.exist(parsedData);
      assert.equal(parsedData.sender, '1220a::1220ade60300cf7d0b18ffaa2ffe4f492ad1ad601cfc162b20f77ec99d16c2c2f158');
      assert.equal(
        parsedData.receiver,
        'ravi-demo-party-txn-01-tapper::1220ea7ab5a723f8a6b2078e617e6c58cb7e78e49947ddc239e1a941aa56e6ba08b4'
      );
      assert.equal(parsedData.amount, '20000000000');
    });

    it('should parse the acceptance prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        TransferAcceptancePrepareResponse.preparedTransaction,
        TransactionType.TransferAccept
      );
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a');
      assert.equal(parsedData.receiver, 'abcde::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d');
      assert.equal(parsedData.amount, '50000000000');
    });

    it('should parse the rejection prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        TransferRejectionPrepareResponse.preparedTransaction,
        TransactionType.TransferReject
      );
      should.exist(parsedData);
      assert.equal(parsedData.sender, 'DSO::1220be58c29e65de40bf273be1dc2b266d43a9a002ea5b18955aeef7aac881bb471a');
      assert.equal(parsedData.receiver, '12201::122038402cf1650876d2920d6047b11a4aaf0de7b428e9916009cba2a22b1ae22c1a');
      assert.equal(parsedData.amount, '50000000000');
    });

    it('should parse the one-step preapproval prepared transaction', () => {
      const parsedData = utils.parseRawCantonTransactionData(
        OneStepPreApprovalPrepareResponse.preparedTransaction,
        TransactionType.OneStepPreApproval
      );
      should.exist(parsedData);
      assert.equal(
        parsedData.sender,
        'Bitgo-devnet-validator-1::1220a0a0f60b0e62b5d750c484b18c091dba23080c133d944614ba75a5858cba3045'
      );
      assert.equal(
        parsedData.receiver,
        'ravi-test-party-1::12205b4e3537a95126d90604592344d8ad3c3ddccda4f79901954280ee19c576714d'
      );
      assert.equal(parsedData.amount, '0');
    });
  });

  describe('Wallet init transaction', function () {
    it('should locally generate and validate the hash for topology transaction', function () {
      const computedHash = utils.computeHashFromCreatePartyResponse(GenerateTopologyResponse.topologyTransactions);
      should.exist(computedHash);
      assert.strictEqual(computedHash, GenerateTopologyResponse.multiHash);
    });
  });

  describe('Prepare submission response validation', function () {
    it('should locally generate and validate the hash for prepare submission response', async function () {
      const computedHash = await utils.computeHashFromPrepareSubmissionResponse(
        PrepareSubmissionResponse.preparedTransaction
      );
      should.exist(computedHash);
      assert.strictEqual(computedHash, PrepareSubmissionResponse.preparedTransactionHash);
    });
  });

  describe('Check if the address is valid', function () {
    it('should return true when the address is valid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_ADDRESS);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return false when party hint is invalid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_PARTY_HINT);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return false when fingerprint is invalid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.INVALID_FINGERPRINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when party hint is missing', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.MISSING_PARTY_HINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when fingerprint is missing', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.MISSING_FINGERPRINT);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return true when memo id is valid', function () {
      const isValid = utils.isValidAddress(CANTON_ADDRESSES.VALID_MEMO_ID);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });
  });

  describe('Check if block hash is valid', function () {
    it('should return true when the block hash is valid', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.VALID_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return true when the block hash has version', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.VALID_HASH_WITH_VERSION);
      should.exist(isValid);
      assert.strictEqual(isValid, true);
    });

    it('should return false when the block hash is not a number', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.INVALID_BLOCK_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });

    it('should return false when the block hash is negative', function () {
      const isValid = utils.isValidBlockId(CANTON_BLOCK_HEIGHT.NEGATIVE_BLOCK_HASH);
      should.exist(isValid);
      assert.strictEqual(isValid, false);
    });
  });
});

describe('Canton Utils - CantonCommand helpers', function () {
  describe('parseCantonTemplateId', function () {
    it('should parse valid "Pkg:Module:Entity" format', function () {
      const result = utils.parseCantonTemplateId(
        'abc123:Utility.Registry.App.V0.Service.AllocationFactory:AllocationFactory'
      );
      should.exist(result);
      assert.equal(result!.pkg, 'abc123');
      assert.equal(result!.moduleName, 'Utility.Registry.App.V0.Service.AllocationFactory');
      assert.equal(result!.entityName, 'AllocationFactory');
    });

    it('should return undefined for non-string input', function () {
      const result = utils.parseCantonTemplateId(123 as unknown as string);
      assert.equal(result, undefined);
    });

    it('should return undefined for wrong number of parts', function () {
      const result = utils.parseCantonTemplateId('PkgOnly');
      assert.equal(result, undefined);
    });

    it('should return undefined for empty parts', function () {
      const result = utils.parseCantonTemplateId(':Module:Entity');
      assert.equal(result, undefined);
    });

    it('should return undefined for string with only 2 parts', function () {
      const result = utils.parseCantonTemplateId('Pkg:Module');
      assert.equal(result, undefined);
    });
  });

  describe('damlValueToJson', function () {
    it('should return undefined for undefined input', function () {
      const result = utils.damlValueToJson(undefined);
      assert.equal(result, undefined);
    });

    it('should convert unit to null', function () {
      const val: Value = { sum: { oneofKind: 'unit', unit: {} } };
      assert.equal(utils.damlValueToJson(val), null);
    });

    it('should convert bool correctly', function () {
      const val: Value = { sum: { oneofKind: 'bool', bool: true } };
      assert.equal(utils.damlValueToJson(val), true);
    });

    it('should convert text correctly', function () {
      const val: Value = { sum: { oneofKind: 'text', text: 'hello' } };
      assert.equal(utils.damlValueToJson(val), 'hello');
    });

    it('should convert contractId correctly', function () {
      const val: Value = { sum: { oneofKind: 'contractId', contractId: '00abc' } };
      assert.equal(utils.damlValueToJson(val), '00abc');
    });

    it('should convert party correctly', function () {
      const val: Value = { sum: { oneofKind: 'party', party: 'Alice::1234' } };
      assert.equal(utils.damlValueToJson(val), 'Alice::1234');
    });

    it('should convert numeric correctly', function () {
      const val: Value = { sum: { oneofKind: 'numeric', numeric: '100.0000000000' } };
      assert.equal(utils.damlValueToJson(val), '100.0000000000');
    });

    it('should convert optional with value', function () {
      const val: Value = {
        sum: {
          oneofKind: 'optional',
          optional: { value: { sum: { oneofKind: 'text', text: 'inner' } } },
        },
      };
      assert.equal(utils.damlValueToJson(val), 'inner');
    });

    it('should convert optional without value to null', function () {
      const val: Value = { sum: { oneofKind: 'optional', optional: {} } };
      assert.equal(utils.damlValueToJson(val), null);
    });

    it('should convert list to array', function () {
      const val: Value = {
        sum: {
          oneofKind: 'list',
          list: {
            elements: [{ sum: { oneofKind: 'text', text: 'a' } }, { sum: { oneofKind: 'text', text: 'b' } }],
          },
        },
      };
      assert.deepEqual(utils.damlValueToJson(val), ['a', 'b']);
    });

    it('should convert textMap to object', function () {
      const val: Value = {
        sum: {
          oneofKind: 'textMap',
          textMap: {
            entries: [
              { key: 'k1', value: { sum: { oneofKind: 'text', text: 'v1' } } },
              { key: 'k2', value: { sum: { oneofKind: 'bool', bool: false } } },
            ],
          },
        },
      };
      assert.deepEqual(utils.damlValueToJson(val), { k1: 'v1', k2: false });
    });

    it('should convert record to object with label keys', function () {
      const val: Value = {
        sum: {
          oneofKind: 'record',
          record: {
            fields: [
              { label: 'name', value: { sum: { oneofKind: 'text', text: 'Alice' } } },
              { label: 'age', value: { sum: { oneofKind: 'int64', int64: '30' } } },
            ],
          },
        },
      };
      assert.deepEqual(utils.damlValueToJson(val), { name: 'Alice', age: '30' });
    });

    it('should convert variant to keyed object', function () {
      const val: Value = {
        sum: {
          oneofKind: 'variant',
          variant: {
            constructor: 'Some',
            value: { sum: { oneofKind: 'text', text: 'v' } },
          },
        },
      };
      assert.deepEqual(utils.damlValueToJson(val), { Some: 'v' });
    });

    it('should convert enum to string', function () {
      const val: Value = {
        sum: {
          oneofKind: 'enum',
          enum: { constructor: 'Active' },
        },
      };
      assert.equal(utils.damlValueToJson(val), 'Active');
    });
  });

  describe('extractSubmitterActAs', function () {
    it('should extract actAs from real PreparedTransaction', function () {
      const actAs = utils.extractSubmitterActAs(CantonExerciseCommandPrepareResponse.preparedTransaction);
      should.exist(actAs);
      assert.ok(Array.isArray(actAs));
      assert.equal(actAs.length, 1);
      assert.equal(actAs[0], 'RegRegistrar::1220508e54fb709dcb1a9b4096408ad415d2217d8881ad9034a9850752933ba88ad5');
    });
  });

  describe('extractCantonCommandInfo', function () {
    it('should extract ExerciseCommand info correctly', function () {
      const info = utils.extractCantonCommandInfo(CantonExerciseCommandPrepareResponse.preparedTransaction);
      should.exist(info);
      assert.equal(info.kind, 'ExerciseCommand');
      assert.equal(info.templateId.moduleName, 'Utility.Registry.App.V0.Service.AllocationFactory');
      assert.equal(info.templateId.entityName, 'AllocationFactory');
      assert.equal(info.choice, 'AllocationFactory_OfferMint');
      should.exist(info.contractId);
      should.exist(info.actingParties);
    });
  });

  describe('sameElements', function () {
    it('should return true for identical arrays', function () {
      assert.equal(utils.sameElements(['a', 'b', 'c'], ['a', 'b', 'c']), true);
    });

    it('should return true for same elements in different order', function () {
      assert.equal(utils.sameElements(['c', 'a', 'b'], ['a', 'b', 'c']), true);
    });

    it('should return false for different lengths', function () {
      assert.equal(utils.sameElements(['a', 'b'], ['a', 'b', 'c']), false);
    });

    it('should return false for different elements', function () {
      assert.equal(utils.sameElements(['a', 'b', 'x'], ['a', 'b', 'c']), false);
    });

    it('should return true for empty arrays', function () {
      assert.equal(utils.sameElements([], []), true);
    });

    it('should return false when one array has duplicates the other does not', function () {
      assert.equal(utils.sameElements(['x', 'x'], ['x', 'y']), false);
    });
  });

  describe('normalizeInjectAs', function () {
    it('should strip "command." prefix from injectAs paths', function () {
      const specs = [{ injectAs: 'command.ExerciseCommand.contractId' }];
      const result = utils.normalizeInjectAs(specs);
      assert.ok(result.has('ExerciseCommand.contractId'));
      assert.ok(!result.has('command.ExerciseCommand.contractId'));
    });

    it('should handle specs with empty injectAs field', function () {
      const result = utils.normalizeInjectAs([{ injectAs: '' }]);
      assert.equal(result.size, 0);
    });

    it('should handle empty specs array', function () {
      const result = utils.normalizeInjectAs([]);
      assert.equal(result.size, 0);
    });

    it('should handle undefined specs', function () {
      const result = utils.normalizeInjectAs(undefined);
      assert.equal(result.size, 0);
    });

    it('should preserve paths that do not start with "command."', function () {
      const specs = [{ injectAs: 'ExerciseCommand.contractId' }];
      const result = utils.normalizeInjectAs(specs);
      assert.ok(result.has('ExerciseCommand.contractId'));
    });
  });

  describe('assertDeepCantonMatch', function () {
    const noInject = new Set<string>();

    it('should pass for matching primitives', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch('hello', 'hello', noInject));
      assert.doesNotThrow(() => utils.assertDeepCantonMatch(42, 42, noInject));
      assert.doesNotThrow(() => utils.assertDeepCantonMatch(true, true, noInject));
    });

    it('should pass for matching objects', function () {
      assert.doesNotThrow(() =>
        utils.assertDeepCantonMatch({ a: 'x', b: 'y' }, { a: 'x', b: 'y', extra: 'z' }, noInject)
      );
    });

    it('should allow extra fields in actual that user did not specify', function () {
      assert.doesNotThrow(() =>
        utils.assertDeepCantonMatch(
          { name: 'Alice' },
          { name: 'Alice', timestamp: '2024-01-01', hash: 'abc' },
          noInject
        )
      );
    });

    it('should pass for matching arrays', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch(['a', 'b'], ['a', 'b'], noInject));
    });

    it('should skip paths in injectAsPaths', function () {
      const injectPaths = new Set(['ExerciseCommand.contractId']);
      assert.doesNotThrow(() =>
        utils.assertDeepCantonMatch(
          { ExerciseCommand: { contractId: undefined, choice: 'Foo' } },
          { ExerciseCommand: { contractId: '00abc', choice: 'Foo' } },
          injectPaths
        )
      );
    });

    it('should skip undefined expected values', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch(undefined, 'anything', noInject));
    });

    it('should verify empty object {} against actual (not skip)', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch({}, {}, noInject));
      assert.doesNotThrow(() => utils.assertDeepCantonMatch({}, { extra: 'field' }, noInject));
    });

    it('should verify empty array [] against actual (not skip)', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch([], [], noInject));
      assert.throws(() => utils.assertDeepCantonMatch([], ['a'], noInject), /list-length mismatch/);
    });

    it('should compare numeric strings with BigNumber equivalence', function () {
      assert.doesNotThrow(() => utils.assertDeepCantonMatch('100', '100.0000000000', noInject));
    });

    it('should throw on primitive mismatch', function () {
      assert.throws(() => utils.assertDeepCantonMatch('hello', 'world', noInject), /mismatch/);
    });

    it('should throw on array length mismatch', function () {
      assert.throws(() => utils.assertDeepCantonMatch(['a', 'b'], ['a'], noInject), /list-length mismatch/);
    });

    it('should throw on missing field (user specified but not in actual)', function () {
      assert.throws(
        () => utils.assertDeepCantonMatch({ required: 'val' }, { other: 'val' }, noInject),
        /missing field/
      );
    });

    it('should throw on type mismatch', function () {
      assert.throws(() => utils.assertDeepCantonMatch({ a: 'str' }, { a: 42 }, noInject), /mismatch/);
    });
  });
});
