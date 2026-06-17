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
          const txBuilder = factory.from(rawTx) as UnstakingBuilder;
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

  describe('large amounts exceeding Number.MAX_SAFE_INTEGER', () => {
    // 9007199254740993 = MAX_SAFE_INTEGER + 2. Number() silently rounds this to MAX_SAFE_INTEGER + 1.
    // BigInt() must be used in BCS serialization to preserve the exact value.
    const LARGE_AMOUNT = '9007199254740993';

    it('should build an unstaking tx with amount > Number.MAX_SAFE_INTEGER and preserve precision', async function () {
      const txBuilder = factory.getUnstakingBuilder();
      txBuilder.type(SuiTransactionType.WithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.unstake({ ...testData.requestWithdrawStakedSui, amount: LARGE_AMOUNT });
      txBuilder.gasData(testData.gasData);

      const tx = (await txBuilder.build()) as SuiTransaction<UnstakingProgrammableTransaction>;

      // The output and input values must equal the exact string — Number() would silently round it
      tx.inputs.length.should.equal(1);
      tx.inputs[0].value.should.equal(LARGE_AMOUNT);
      tx.outputs.length.should.equal(1);
      tx.outputs[0].value.should.equal(LARGE_AMOUNT);

      const rawTx = tx.toBroadcastFormat();
      assert.deepStrictEqual(utils.isValidRawTransaction(rawTx), true);

      // Round-trip: rebuild from serialized bytes and verify the amount survives without precision loss
      const rebuilder = factory.from(rawTx) as UnstakingBuilder;
      const rebuiltTx = (await rebuilder.build()) as SuiTransaction<UnstakingProgrammableTransaction>;
      rebuiltTx.inputs[0].value.should.equal(LARGE_AMOUNT);
      rebuiltTx.outputs[0].value.should.equal(LARGE_AMOUNT);
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
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
