import assert from 'assert';
import 'should';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/avaxp';
import * as errorMessage from '../../resources/errors';
import { TransactionBuilderFactory, DecodedUtxoObj } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { BN } from 'avalanche';

describe('AvaxP Validate Tx Builder', () => {
  const factory = new TransactionBuilderFactory(coins.get('avaxp'));

  describe('validate txBuilder fields', () => {
    const txBuilder = factory.getValidatorBuilder();
    it('should fail nodeID tag incorrect', () => {
      assert.throws(
        () => {
          txBuilder.validateNodeID(testData.INVALID_NODE_ID_MISSING_NODE_ID);
        },
        (e: any) => e.message === errorMessage.ERROR_NODE_ID
      );
    });
    it('should fail nodeID length incorrect', () => {
      assert.throws(
        () => {
          txBuilder.validateNodeID(testData.INVALID_NODE_ID_LENGTH);
        },
        (e: any) => e.message === errorMessage.ERROR_NODE_ID_LENGTH
      );
    });
    it('should suucess nodeID length incorrect', () => {
      txBuilder.validateNodeID(testData.NODE_ID_2);
    });
    it('should fail endTime less than 2 weeks', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeDuration(testData.START_TIME, testData.START_TIME.add(testData.ONE_WEEK));
        },
        (e: any) => e.message === errorMessage.ERROR_STAKE_DURATION_SHORT_TIME
      );
    });
    it('should fail endTime greater than 1 year', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeDuration(testData.START_TIME, testData.START_TIME.add(testData.TWO_YEAR));
        },
        (e: any) => e.message === errorMessage.ERROR_STAKE_DURATION_LONG_TIME
      );
    });
    it('should fail startTime too soon', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeDuration(new BN(Date.now()), testData.ONE_WEEK);
        },
        (e: any) => e.message === errorMessage.ERROR_STAKE_START_TIME_TOO_SHORT
      );
    });
    it('should fail stake amount less than 2000', () => {
      assert.throws(
        () => {
          txBuilder.validateStakeAmount(testData.INVALID_STAKE_AMOUNT);
        },
        (e: any) => e.message === errorMessage.ERROR_STAKE_AMOUNT
      );
    });
    it('should fail delegationFeeRate too low', () => {
      assert.throws(
        () => {
          txBuilder.validateDelegationFeeRate(testData.INVALID_DELEGATION_FEE);
        },
        (e: any) => e.message === errorMessage.ERROR_DELEGATION_FEE
      );
    });

    it('should fail validate Utxos empty string', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_EMPTY
      );
    });

    it('should fail validate Utxos without amount field', () => {
      assert.throws(
        () => {
          txBuilder.validateUtxos([{ outputID: '' } as any as DecodedUtxoObj]);
        },
        (e: any) => e.message === errorMessage.ERROR_UTXOS_AMOUNT
      );
    });
  });

  describe('Utils tests', () => {
    it('should fail address is invalid', () => {
      utils.isValidAddress(testData.INVALID_ADDRESS).should.be.false();
    });
    it('should fail blockId is invalid', () => {
      utils.isValidBlockId(testData.INVALID_BLOCK_ID).should.be.false();
    });
    it('should fail blockId length is invalid', () => {
      utils.isValidBlockId(testData.INVALID_BLOCK_ID_LENGTH).should.be.false();
    });
    it('should pass blockId is valid', () => {
      utils.isValidBlockId(testData.VALID_BLOCK_ID).should.be.true();
    });
    it('should pass address is valid', () => {
      utils.isValidAddress(testData.VALID_ADDRESS).should.be.true();
    });
  });

  describe('should build ', () => {
    it('Should create AddValidator tx for same values', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
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

    it('Should create AddValidator tx when change amount is 0', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
        .getValidatorBuilder()
        .threshold(testData.ADDVALIDATOR_SAMPLES.threshold)
        .locktime(testData.ADDVALIDATOR_SAMPLES.locktime)
        .fromPubKey(testData.ADDVALIDATOR_SAMPLES.pAddresses)
        .startTime(testData.ADDVALIDATOR_SAMPLES.startTime)
        .endTime(testData.ADDVALIDATOR_SAMPLES.endTime)
        .stakeAmount('24938830298') // stake amount is total amount in outputs
        .delegationFeeRate(testData.ADDVALIDATOR_SAMPLES.delegationFee)
        .nodeID(testData.ADDVALIDATOR_SAMPLES.nodeID)
        .memo(testData.ADDVALIDATOR_SAMPLES.memo)
        .utxos(testData.ADDVALIDATOR_SAMPLES.outputs);

      await txBuilder.build().should.not.throw();
    });

    it('Should recover AddValidator tx from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
    });

    it('Should create half signed AddValidator tx for same values', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
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

    it('Should recover half signed AddValidator from raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should half sign a AddValidator tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should recover half signed AddValidator from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);
    });

    it('Should recover signed AddValidator from signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.fullsigntxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx for same values', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
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
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key for same values', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp'))
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
        .utxos(testData.ADDVALIDATOR_SAMPLES.outputs)
        .recoverMode();

      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    it('Should recover half sign a AddValidator tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex
      );
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key from half signed raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    it('Should full sign a AddValidator tx with recovery key from unsigned raw tx', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryUnsignedTxHex
      );
      // txBuilder.recoverMode()
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv3 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      rawTx.should.equal(testData.ADDVALIDATOR_SAMPLES.recoveryFullsigntxHex);
    });

    xit('Compare size and location of signatures in credentials for halfsign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      // look into credentials make sure that index 0 is signed with user key
    });
    xit('Compare size and location of signatures in credentials for full sign', async () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      // look into credentials make sure that index 0 and 2 is signed
    });
  });
  describe('Key cannot sign the transaction ', () => {
    it('Should full sign a AddValidator tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.unsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    it('Should 2 full sign a AddValidator tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryUnsignedTxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    // HSM expected empty credential, we cannot verify if the next signature is the correct.
    xit('Should full sign a AddValidator tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.halfsigntxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv2 });

      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });

    // HSM expected empty credential, we cannot verify if the next signature is the correct.
    xit('Should full sign a AddValidator tx from unsigned raw tx', () => {
      const txBuilder = new TransactionBuilderFactory(coins.get('tavaxp')).from(
        testData.ADDVALIDATOR_SAMPLES.recoveryHalfsigntxHex
      );
      txBuilder.sign({ key: testData.ADDVALIDATOR_SAMPLES.privKey.prv1 });
      txBuilder
        .build()
        .then(() => assert.fail('it can sign'))
        .catch((err) => {
          err.message.should.be.equal(errorMessage.ERROR_KEY_CANNOT_SIGN);
        });
    });
  });
});
