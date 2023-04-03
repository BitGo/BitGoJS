import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, UnstakingProgrammableTransaction } from '../../../src/lib/iface';
import { AMOUNT_UNKNOWN_TEXT } from '../../../src/lib/constants';

describe('Sui unstaking Builder', () => {
  const factory = getBuilderFactory('tsui');

  describe('Succeed', () => {
    it('should build a unstaking tx', async function () {
      const txBuilder = factory.getUnstakingBuilder();
      txBuilder.type(SuiTransactionType.WithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.unstake(testData.requestWithdrawStakedSui);
      txBuilder.gasData(testData.gasData);
      const tx = await txBuilder.build();
      should.equal(tx.type, TransactionType.StakingClaim);
      (tx as SuiTransaction<UnstakingProgrammableTransaction>).suiTransaction.gasData.payment!.should.deepEqual(
        testData.coinsGasPayment
      );

      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.requestWithdrawStakedSui.stakedSui.objectId,
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.sender.address,
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.WITHDRAW_STAKED_SUI);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getUnstakingBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getUnstakingBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getUnstakingBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getUnstakingBuilder();
      const invalidGasPayment = {
        ...testData.gasDataWithoutGasPayment,
        payment: [
          {
            objectId: '',
            version: -1,
            digest: '',
          },
        ],
      };
      should(() => builder.gasData(invalidGasPayment)).throwError('Invalid payment, invalid or missing version');
    });
  });
});
