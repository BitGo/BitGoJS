import should from 'should';
import assert from 'assert';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/sui';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { Transaction as SuiTransaction } from '../../../src/lib/transaction';
import { SuiTransactionType } from '../../../src/lib/iface';
import { MoveCallTransaction } from '../../../src/lib/mystenlab/builder';
import { AMOUNT_UNKNOWN_TEXT } from '../../../src/lib/constants';

describe('Walrus Withdraw Builder', () => {
  const factory = getBuilderFactory('tsui:wal');

  describe('Succeed', () => {
    async function assertRebuild(rawTx: string) {
      utils.isValidRawTransaction(rawTx).should.be.true();
      const rebuilder = factory.from(rawTx);
      rebuilder.addSignature({ pub: testData.sender.publicKey }, Buffer.from(testData.sender.signatureHex));
      const rebuiltTx = await rebuilder.build();
      rebuiltTx.toBroadcastFormat().should.equal(rawTx);
    }

    it('should build a request withdraw partial tx', async function () {
      const txBuilder = factory.getWalrusRequestWithdrawStakeBuilder();
      txBuilder.type(SuiTransactionType.WalrusRequestWithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.requestWithdrawStake(testData.requestWalrusWithdrawPartial);
      txBuilder.gasData(testData.gasData);

      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingDeactivate);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: '0xee6dfc3da32e21541a2aeadfcd250f8a0a23bb7abda9c8988407fc32068c3746',
        value: testData.STAKING_AMOUNT.toString(),
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(0);

      const rawTx = tx.toBroadcastFormat();
      await assertRebuild(rawTx);

      tx.suiTransaction.gasData.owner.should.equal(testData.gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(testData.gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(testData.gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(testData.gasData.payment.length);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(4); // StakedWal, Amount, Sender Address, WAL Staking Shared Object
      ptb.transactions.length.should.equal(3);
      ptb.transactions[0].kind.should.equal('MoveCall');
      (ptb.transactions[0] as MoveCallTransaction).target.should.endWith('::staked_wal::split');
      ptb.transactions[1].kind.should.equal('MoveCall');
      (ptb.transactions[1] as MoveCallTransaction).target.should.endWith('::staking::request_withdraw_stake');
      ptb.transactions[2].kind.should.equal('TransferObjects');
    });

    it('should build a request withdraw full tx', async function () {
      const txBuilder = factory.getWalrusRequestWithdrawStakeBuilder();
      txBuilder.type(SuiTransactionType.WalrusRequestWithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.requestWithdrawStake(testData.requestWalrusWithdrawFull);
      txBuilder.gasData(testData.gasData);

      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingDeactivate);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: '0xee6dfc3da32e21541a2aeadfcd250f8a0a23bb7abda9c8988407fc32068c3746',
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(0);

      const rawTx = tx.toBroadcastFormat();
      await assertRebuild(rawTx);

      tx.suiTransaction.gasData.owner.should.equal(testData.gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(testData.gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(testData.gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(testData.gasData.payment.length);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(2); // StakedWal, WAL Staking Shared Object
      ptb.transactions.length.should.equal(1);
      ptb.transactions[0].kind.should.equal('MoveCall');
      (ptb.transactions[0] as MoveCallTransaction).target.should.endWith('::staking::request_withdraw_stake');
    });

    it('should build a withdraw tx', async function () {
      const txBuilder = factory.getWalrusRequestWithdrawStakeBuilder();
      txBuilder.type(SuiTransactionType.WalrusWithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.requestWithdrawStake(testData.requestWalrusWithdrawFull);
      txBuilder.gasData(testData.gasData);

      const tx = await txBuilder.build();

      assert(tx instanceof SuiTransaction);
      tx.type.should.equal(TransactionType.StakingWithdraw);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: '0xee6dfc3da32e21541a2aeadfcd250f8a0a23bb7abda9c8988407fc32068c3746',
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui:wal',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: testData.sender.address,
        value: AMOUNT_UNKNOWN_TEXT,
        coin: 'tsui:wal',
      });
      tx.toJson().expiration.should.deepEqual({ None: null });

      const rawTx = tx.toBroadcastFormat();
      await assertRebuild(rawTx);

      const rebuiltForExpiration = await factory.from(rawTx).build();
      rebuiltForExpiration.toJson().expiration.should.deepEqual({ None: null });

      tx.suiTransaction.gasData.owner.should.equal(testData.gasData.owner);
      tx.suiTransaction.gasData.price.should.equal(testData.gasData.price);
      tx.suiTransaction.gasData.budget.should.equal(testData.gasData.budget);
      tx.suiTransaction.gasData.payment.length.should.equal(testData.gasData.payment.length);

      const ptb = tx.suiTransaction.tx;
      ptb.inputs.length.should.equal(3); // StakedWal, Sender Address, WAL Staking Shared Object
      ptb.transactions.length.should.equal(2);
      ptb.transactions[0].kind.should.equal('MoveCall');
      (ptb.transactions[0] as MoveCallTransaction).target.should.endWith('::staking::withdraw_stake');
      ptb.transactions[1].kind.should.equal('TransferObjects');
    });

    it('should round-trip ValidDuring expiration on a request withdraw tx', async function () {
      const GENESIS_CHAIN_ID = 'GAFpCCcRCxTdFfUEMbQbkLBaZy2RNiGAfvFBhMNpq2kT';
      const txBuilder = factory.getWalrusRequestWithdrawStakeBuilder();
      txBuilder.type(SuiTransactionType.WalrusRequestWithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.requestWithdrawStake(testData.requestWalrusWithdrawFull);
      txBuilder.gasData(testData.gasData);
      txBuilder.expiration({
        ValidDuring: {
          minEpoch: { Some: 1156 },
          maxEpoch: { Some: 1157 },
          minTimestamp: { None: null },
          maxTimestamp: { None: null },
          chain: GENESIS_CHAIN_ID,
          nonce: 12345678,
        },
      });

      const tx = await txBuilder.build();
      const validDuring = (tx.toJson().expiration as any)?.ValidDuring;
      should.exist(validDuring, 'ValidDuring expiration must be set when building');
      Number(validDuring.minEpoch.Some).should.equal(1156);
      Number(validDuring.maxEpoch.Some).should.equal(1157);

      const rawTx = tx.toBroadcastFormat();
      await assertRebuild(rawTx);

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltValidDuring = (rebuiltTx.toJson().expiration as any)?.ValidDuring;
      should.exist(rebuiltValidDuring, 'ValidDuring expiration must survive from(raw) restore');
      Number(rebuiltValidDuring.minEpoch.Some).should.equal(1156);
      Number(rebuiltValidDuring.maxEpoch.Some).should.equal(1157);
      rebuiltValidDuring.chain.should.equal(GENESIS_CHAIN_ID);
      Number(rebuiltValidDuring.nonce).should.equal(12345678);
    });

    it('should round-trip ValidDuring expiration on a withdraw tx', async function () {
      const GENESIS_CHAIN_ID = 'GAFpCCcRCxTdFfUEMbQbkLBaZy2RNiGAfvFBhMNpq2kT';
      const txBuilder = factory.getWalrusRequestWithdrawStakeBuilder();
      txBuilder.type(SuiTransactionType.WalrusWithdrawStake);
      txBuilder.sender(testData.sender.address);
      txBuilder.requestWithdrawStake(testData.requestWalrusWithdrawFull);
      txBuilder.gasData(testData.gasData);
      txBuilder.expiration({
        ValidDuring: {
          minEpoch: { Some: 2000 },
          maxEpoch: { Some: 2001 },
          minTimestamp: { None: null },
          maxTimestamp: { None: null },
          chain: GENESIS_CHAIN_ID,
          nonce: 87654321,
        },
      });

      const tx = await txBuilder.build();
      const validDuring = (tx.toJson().expiration as any)?.ValidDuring;
      should.exist(validDuring, 'ValidDuring expiration must be set when building');
      Number(validDuring.minEpoch.Some).should.equal(2000);
      Number(validDuring.maxEpoch.Some).should.equal(2001);

      const rawTx = tx.toBroadcastFormat();
      await assertRebuild(rawTx);

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltValidDuring = (rebuiltTx.toJson().expiration as any)?.ValidDuring;
      should.exist(rebuiltValidDuring, 'ValidDuring expiration must survive from(raw) restore');
      Number(rebuiltValidDuring.minEpoch.Some).should.equal(2000);
      Number(rebuiltValidDuring.maxEpoch.Some).should.equal(2001);
      rebuiltValidDuring.chain.should.equal(GENESIS_CHAIN_ID);
      Number(rebuiltValidDuring.nonce).should.equal(87654321);
    });
  });

  describe('Fail', () => {
    it('should fail for invalid sender', async function () {
      const builder = factory.getWalrusRequestWithdrawStakeBuilder();
      should(() => builder.sender('randomString')).throwError('Invalid or missing sender, got: randomString');
    });

    it('should fail for invalid gasData', function () {
      const builder = factory.getWalrusRequestWithdrawStakeBuilder();
      should(() => builder.gasData(testData.invalidGasOwner)).throwError(
        `Invalid gas address ${testData.invalidGasOwner.owner}`
      );
    });

    it('should fail for invalid gasBudget', function () {
      const builder = factory.getWalrusRequestWithdrawStakeBuilder();
      should(() => builder.gasData(testData.invalidGasBudget)).throwError('Invalid gas budget -1');
    });

    it('should fail for invalid gasPayment', function () {
      const builder = factory.getWalrusRequestWithdrawStakeBuilder();
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
