import * as should from 'should';

import * as testData from './resources/avaxp';
import * as errorMessage from './resources/errors';
import { register } from '../src';
import { KeyPair } from '../src/keyPair';
import { TransactionBuilderFactory } from '../src/transactionBuilderFactory';
import assert from 'assert';

describe('AvaxP Validate Tx Builder', () => {
  const factory = register('tavaxp', TransactionBuilderFactory);
  const owner1Address = new KeyPair({ pub: testData.ACCOUNT_1.pubkey }).getAddress();
  // const validator = DELEGATE_VALIDATOR_ACCOUNT;
  const initValidatorTxBuilder = () => {
    return factory.getValidatorBuilder();
  };

  const initUnsignedValidatorTxBuilder = () => {
    const builder = initValidatorTxBuilder();
    // builder = addRewardAddressToBuilder(builder, sender);
    return builder;
  };

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getValidatorBuilder();
    it('should fail nodeID tag incorrect', () => {
      assert.throws(
        () => {
          txBuilder.validateNodeID(testData.INVALID_NODE_ID_MISSING_NODE_ID);
        },
        (e) => e.message === errorMessage.ERROR_NODE_ID
      );
    });
    it('should fail nodeID length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.validateNodeID(testData.INVALID_NODE_ID_LENGTH);
        },
        (e) => e.message === errorMessage.ERROR_NODE_ID_LENGTH
      );
    });
    it('should fail endTime less than 2 weeks', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeDuration(testData.INVALID_START_TIME, testData.END_TIME);
        },
        (e) => e.message === errorMessage.ERROR_STAKE_DURATION_SHORT_TIME
      );
    });
    it('should fail endTime greater than 1 year', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeDuration(testData.START_TIME, testData.INVALID_END_TIME);
        },
        (e) => e.message === errorMessage.ERROR_STAKE_DURATION_LONG_TIME
      );
    });
    it('should fail stake amount less than 2000', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeAmount(testData.INVALID_STAKE_AMOUNT);
        },
        (e) => e.message === errorMessage.ERROR_STAKE_AMOUNT
      );
    });
    it('should fail delegationFeeRate too low', () => {
      assert.throws(
        () => {
          txBuilder.validateDelegationFeeRate(testData.INVALID_DELEGATION_FEE);
        },
        (e) => e.message === errorMessage.ERROR_DELEGATION_FEE
      );
    });
  });

  describe('should build ', () => {
    xit('an init valid validator transaction', async () => {
      const txBuilder = initUnsignedValidatorTxBuilder();
      txBuilder.sign({ key: testData.ACCOUNT_1.privkey });
      txBuilder.sign({ key: testData.ACCOUNT_2.privkey });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      // should.deepEqual(txJson.fee, testData.FEE);
      should.deepEqual(tx.signature.length, 2);
      should.equal(txJson.from, owner1Address);
      // tx.type.should.equal(TransactionType.StakingLock);
    });

    it('Should create AddValidator tx for same values', async () => {
      const txBuilder = factory
        .getValidatorBuilder()
        .threshold(testData.ADDVALIDATOR_SAMPLES.threshold)
        .locktime(testData.ADDVALIDATOR_SAMPLES.locktime)
        .fromPubKey(testData.ADDVALIDATOR_SAMPLES.pAddresses)
        .startTime(testData.ADDVALIDATOR_SAMPLES.startTime)
        .endTime(testData.ADDVALIDATOR_SAMPLES.endTime)
        .stakeAmount(testData.ADDVALIDATOR_SAMPLES.minValidatorStake)
        .delegationFeeRate(testData.ADDVALIDATOR_SAMPLES.delegationFee)
        .nodeID(testData.ADDVALIDATOR_SAMPLES.nodeID)
        .memo(testData.ADDVALIDATOR_SAMPLES.memo)
        .utxos(testData.ADDVALIDATOR_SAMPLES.outputs);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.tx);
    });

    it('Should recover AddValidator tx from raw tx', async () => {
      const txBuilder = factory.from(testData.ADDVALIDATOR_SAMPLES.tx);

      /*    .threshold(testData.ADDVALIDATOR_SAMPLES.threshold)
          .locktime(testData.ADDVALIDATOR_SAMPLES.locktime)
          .fromPubKey(testData.ADDVALIDATOR_SAMPLES.pAddresses)
          .startTime(testData.ADDVALIDATOR_SAMPLES.startTime)
          .endTime(testData.ADDVALIDATOR_SAMPLES.endTime)
          .stakeAmount(testData.ADDVALIDATOR_SAMPLES.minValidatorStake)
          .delegationFeeRate(testData.ADDVALIDATOR_SAMPLES.delegationFee)
          .nodeID(testData.ADDVALIDATOR_SAMPLES.nodeID)
          .memo(testData.ADDVALIDATOR_SAMPLES.memo)
          .utxos(testData.ADDVALIDATOR_SAMPLES.outputs);
*/
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.tx);
    });
  });
});
