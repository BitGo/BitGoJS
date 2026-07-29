import assert from 'assert';
import should from 'should';
import { MessageStandardType } from '@bitgo/sdk-core';
import { detectCantonSigningPayloadType, decodePreparedTransaction } from '../../../src/lib/clearSigning';
import { PreparedTransactionRawData, GenerateTopologyResponse } from '../../resources';

// A single topology transaction byte string — not a PreparedTransaction proto
const TOPOLOGY_TX = GenerateTopologyResponse.topologyTransactions[0];

describe('Canton clearSigning', function () {
  describe('detectCantonSigningPayloadType', function () {
    it('should detect a Daml prepared transaction as CANTON_SIGN_TRANSACTION', function () {
      const type = detectCantonSigningPayloadType(PreparedTransactionRawData);
      type.should.equal(MessageStandardType.CANTON_SIGN_TRANSACTION);
    });

    it('should detect a topology transaction as CANTON_SIGN_TOPOLOGY', function () {
      const type = detectCantonSigningPayloadType(TOPOLOGY_TX);
      type.should.equal(MessageStandardType.CANTON_SIGN_TOPOLOGY);
    });

    it('should return CANTON_SIGN_TOPOLOGY for bytes that fail proto parsing', function () {
      // Random base64 that is not a valid PreparedTransaction proto
      const randomBytes = Buffer.from('not-a-valid-proto-payload').toString('base64');
      const type = detectCantonSigningPayloadType(randomBytes);
      type.should.equal(MessageStandardType.CANTON_SIGN_TOPOLOGY);
    });

    it('should return CANTON_SIGN_TOPOLOGY for empty bytes', function () {
      const type = detectCantonSigningPayloadType(Buffer.alloc(0).toString('base64'));
      type.should.equal(MessageStandardType.CANTON_SIGN_TOPOLOGY);
    });
  });

  describe('decodePreparedTransaction — invalid input', function () {
    it('should throw a descriptive error when called with topology bytes', function () {
      should.throws(
        () => decodePreparedTransaction(TOPOLOGY_TX),
        /not a Daml PreparedTransaction.*detectCantonSigningPayloadType/
      );
    });

    it('should throw a descriptive error when called with random bytes', function () {
      const randomBytes = Buffer.from('not-a-valid-proto-payload').toString('base64');
      should.throws(
        () => decodePreparedTransaction(randomBytes),
        /not a Daml PreparedTransaction.*detectCantonSigningPayloadType/
      );
    });
  });

  describe('decodePreparedTransaction', function () {
    it('should decode a prepared transaction and return structured command info', function () {
      const decoded = decodePreparedTransaction(PreparedTransactionRawData);
      should.exist(decoded);
      should.exist(decoded.kind);
      should.exist(decoded.templateId);
      should.exist(decoded.templateId.moduleName);
      should.exist(decoded.templateId.entityName);
      should.exist(decoded.argument);
    });

    it('decoded templateId should have module and entity name fields', function () {
      const decoded = decodePreparedTransaction(PreparedTransactionRawData);
      decoded.templateId.moduleName.should.be.a.String().and.not.empty();
      decoded.templateId.entityName.should.be.a.String().and.not.empty();
    });

    it('decoded kind should be CreateCommand or ExerciseCommand', function () {
      const decoded = decodePreparedTransaction(PreparedTransactionRawData);
      assert.ok(
        decoded.kind === 'CreateCommand' || decoded.kind === 'ExerciseCommand',
        `expected CreateCommand or ExerciseCommand, got: ${decoded.kind}`
      );
    });

    it('ExerciseCommand should include choice and actingParties', function () {
      const decoded = decodePreparedTransaction(PreparedTransactionRawData);
      if (decoded.kind === 'ExerciseCommand') {
        should.exist(decoded.choice);
        should.exist(decoded.actingParties);
        decoded.actingParties!.should.be.an.Array();
      }
    });
  });
});
