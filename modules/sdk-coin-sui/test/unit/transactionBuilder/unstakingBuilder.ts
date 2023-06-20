import * as assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import should from 'should';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType, UnstakingProgrammableTransaction } from '../../../src/lib/iface';
import { UnstakingBuilder } from '../../../src';

describe('Sui unstaking Builder', () => {
  const factory = getBuilderFactory('tsui');

  function testUnstakingBuilder(amount: number | undefined) {
    describe(`Success (amount=${amount})`, () => {
      async function assertMatchesFixture(txBuilder: UnstakingBuilder, rebuild = true) {
        const tx = (await txBuilder.build()) as SuiTransaction<UnstakingProgrammableTransaction>;

        tx.suiTransaction.tx.should.eql(
          amount === undefined ? testData.txBlockUnstakeNoAmount : testData.txBlockUnstakeWithAmount,
          JSON.stringify(tx.suiTransaction.tx)
        );
        const rawTx = tx.toBroadcastFormat();
        assert.deepStrictEqual(utils.isValidRawTransaction(rawTx), true);
        assert.deepStrictEqual(
          rawTx,
          amount === undefined ? testData.WITHDRAW_STAKED_SUI : testData.WITHDRAW_STAKED_SUI_WITH_AMOUNT
        );
        assert.deepStrictEqual(tx.inputs, [
          {
            address: '0xee6dfc3da32e21541a2aeadfcd250f8a0a23bb7abda9c8988407fc32068c3746',
            value: amount === undefined ? 'AMOUNT_UNKNOWN' : amount.toString(),
            coin: 'tsui',
          },
        ]);
        assert.deepStrictEqual(tx.outputs, [
          {
            address: '0x9882188ba3e8070a9bb06ae9446cf607914ee8ee58ed8306a3e3afff5a1bbb71',
            value: amount === undefined ? 'AMOUNT_UNKNOWN' : amount.toString(),
            coin: 'tsui',
          },
        ]);

        if (rebuild) {
          const txBuilder = factory.getUnstakingBuilder();
          txBuilder.from(rawTx);
          await assertMatchesFixture(txBuilder, false);
        }
      }

      it(`should build a unstaking tx`, async function () {
        const txBuilder = factory.getUnstakingBuilder();
        txBuilder.type(SuiTransactionType.WithdrawStake);
        txBuilder.sender(testData.sender.address);
        txBuilder.unstake({ ...testData.requestWithdrawStakedSui, amount });
        txBuilder.gasData(testData.gasData);
        await assertMatchesFixture(txBuilder);
      });
    });
  }

  testUnstakingBuilder(undefined);
  testUnstakingBuilder(1e9);

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
