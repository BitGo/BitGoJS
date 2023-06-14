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
        should.equal(utils.isValidRawTransaction(rawTx), true);
        should.equal(
          rawTx,
          amount === undefined ? testData.WITHDRAW_STAKED_SUI : testData.WITHDRAW_STAKED_SUI_WITH_AMOUNT
        );

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
