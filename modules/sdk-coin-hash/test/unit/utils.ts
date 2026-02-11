import should from 'should';
import { CosmosUtils } from '@bitgo/abstract-cosmos';

import utils from '../../src/lib/utils';
import * as testData from '../resources/hash';
import { blockHash, txIds, TEST_CONTRACT_CALL, TEST_GROUP_VOTE } from '../resources/hash';

describe('utils', () => {
  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.hash1), true);
    should.equal(utils.isValidBlockId(blockHash.hash2), true);
    // param is coming as undefined so it was causing an issue
    should.equal(utils.isValidBlockId(undefined as unknown as string), false);
    should.equal(utils.isValidBlockId(''), false);
  });

  it('should validate invalid block hash correctly', () => {
    should.equal(utils.isValidBlockId(''), false);
    should.equal(utils.isValidBlockId('0xade35465gfvdcsxsz24300'), false);
    should.equal(utils.isValidBlockId(blockHash.hash2 + 'ff'), false);
    should.equal(utils.isValidBlockId('latest'), false);
  });

  it('should validate transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(txIds.hash1), true);
    should.equal(utils.isValidTransactionId(txIds.hash2), true);
    should.equal(utils.isValidTransactionId(txIds.hash3), true);
  });

  it('should validate invalid transaction id correctly', () => {
    should.equal(utils.isValidTransactionId(''), false);
    should.equal(utils.isValidTransactionId(txIds.hash1.slice(3)), false);
    should.equal(utils.isValidTransactionId(txIds.hash3 + '00'), false);
    should.equal(utils.isValidTransactionId('dalij43ta0ga2dadda02'), false);
  });

  it('validateAmount', function () {
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount1]));
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount2]));
    should.doesNotThrow(() => utils.validateAmountData([testData.coinAmounts.amount3]));
    should(() => utils.validateAmountData([testData.coinAmounts.amount4])).throwError(
      'transactionBuilder: validateAmount: Invalid amount: ' + testData.coinAmounts.amount4.amount
    );
    should(() => utils.validateAmountData([testData.coinAmounts.amount5])).throwError(
      'transactionBuilder: validateAmount: Invalid denom: ' + testData.coinAmounts.amount5.denom
    );
  });

  describe('decodeMsg', () => {
    it('should detect valid base64-encoded group proposal', () => {
      const result = CosmosUtils.decodeMsg(TEST_CONTRACT_CALL.encodedProposal);

      should.exist(result.typeUrl);
      if (result.typeUrl) {
        result.typeUrl.should.equal('/cosmos.group.v1.MsgSubmitProposal');
      }
      should.not.exist(result.error);
    });

    it('should reject invalid base64 string', () => {
      const result = CosmosUtils.decodeMsg('not-valid-base64!!!');

      should.not.exist(result.typeUrl);
      should.exist(result.error);
    });

    it('should reject valid base64 but invalid protobuf', () => {
      const result = CosmosUtils.decodeMsg(Buffer.from('random data').toString('base64'));

      should.not.exist(result.typeUrl);
      should.exist(result.error);
    });

    it('should reject hex-encoded contract call data', () => {
      const result = CosmosUtils.decodeMsg('7b22696e6372656d656e74223a7b7d7d');

      should.not.exist(result.typeUrl);
    });

    it('should accept Uint8Array input', () => {
      const bytes = Buffer.from(TEST_CONTRACT_CALL.encodedProposal, 'base64');
      const result = CosmosUtils.decodeMsg(bytes);

      should.exist(result.typeUrl);
      if (result.typeUrl) {
        result.typeUrl.should.equal('/cosmos.group.v1.MsgSubmitProposal');
      }
    });
  });

  describe('decodeMsg - group vote', () => {
    it('should detect valid base64-encoded group vote', () => {
      const result = CosmosUtils.decodeMsg(TEST_GROUP_VOTE.encodedVote);

      should.exist(result.typeUrl);
      if (result.typeUrl) {
        result.typeUrl.should.equal('/cosmos.group.v1.MsgVote');
      }
      should.not.exist(result.error);
    });

    it('should accept Uint8Array input for group vote', () => {
      const bytes = Buffer.from(TEST_GROUP_VOTE.encodedVote, 'base64');
      const result = CosmosUtils.decodeMsg(bytes);

      should.exist(result.typeUrl);
      if (result.typeUrl) {
        result.typeUrl.should.equal('/cosmos.group.v1.MsgVote');
      }
    });
  });

  describe('isGroupVote', () => {
    it('should return true when msg contains a group vote', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvc490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: Buffer.from(TEST_GROUP_VOTE.encodedVote, 'base64'),
      };
      should.equal(CosmosUtils.isGroupVote(message), true);
    });

    it('should return false when msg contains a group proposal', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvc490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: Buffer.from(TEST_CONTRACT_CALL.encodedProposal, 'base64'),
      };
      should.equal(CosmosUtils.isGroupVote(message), false);
    });

    it('should return false when msg is empty', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvc490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: new Uint8Array(0),
      };
      should.equal(CosmosUtils.isGroupVote(message), false);
    });
  });

  describe('isGroupProposal', () => {
    it('should return true when msg contains a group proposal', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvс490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: Buffer.from(TEST_CONTRACT_CALL.encodedProposal, 'base64'),
      };
      should.equal(CosmosUtils.isGroupProposal(message), true);
    });

    it('should return false when msg contains regular contract call data', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvс490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: Buffer.from(JSON.stringify({ increment: {} })),
      };
      should.equal(CosmosUtils.isGroupProposal(message), false);
    });

    it('should return false when msg is empty', () => {
      const message = {
        sender: 'tp1tazefwk2e372fy2jq08w6lztg9yrrvс490r2gp4vt8d0fchlrfqqyahg0u',
        contract: 'tp12nyn83ynewtmpkw32wq6dg83wx8nqpat65gcld',
        msg: new Uint8Array(0),
      };
      should.equal(CosmosUtils.isGroupProposal(message), false);
    });
  });
});
