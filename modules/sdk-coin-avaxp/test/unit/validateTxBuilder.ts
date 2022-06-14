import assert from 'assert';
import * as testData from '../resources/avaxp';
import * as errorMessage from '../resources/errors';
import { register } from '../../src';
import { TransactionBuilderFactory } from '../../src/transactionBuilderFactory';
import { DecodedUtxoObj } from '../../src/iface';

describe('AvaxP Validate Tx Builder', () => {
  const factory = register('avaxp', TransactionBuilderFactory);

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

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  describe('should build ', () => {
    it('Should create AddValidator tx for same values', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory)
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
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
    });

    it('Should create AddValidator tx from raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
    });

    it('Should create half signed AddValidator tx for same values', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory)
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

      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should create half signed AddValidator from raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should half sign a AddValidator tx from unsigned raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should create half signed AddValidator from half signed raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should create signed AddValidator from signed raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx for same values', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory)
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

      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx from half signed raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx from unsigned raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key for same values', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory)
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

      txBuilder.recoverMode().sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    it('Should create half sign a AddValidator tx with recovery key from half signed raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key from half signed raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key from unsigned raw tx', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      // txBuilder.recoverMode()
      txBuilder.recoverMode().sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    xit('Compare size and location of signatures in credentials for halfsign', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      // look into credentials make sure that index 0 is signed with user key
    });
    xit('Compare size and location of signatures in credentials for full sign', async () => {
      const txBuilder = register('tavaxp', TransactionBuilderFactory).from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      // look into credentials make sure that index 0 and 2 is signed
    });
  });
});
