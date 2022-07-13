import should from 'should';
import * as testData from '../../resources/near';
import { getBuilderFactory } from '../getBuilderFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { validatorContractAddress } from '../../resources/near';

describe('Near Staking withdraw Builder', () => {
  const factory = getBuilderFactory('tnear');
  const gas = '125000000000000';
  const amount = '1000000'; // amount to withdraw in yoctos

  describe('Succeed', () => {
    it('build a staking withdraw signed tx', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      txBuilder.sign({ key: testData.accounts.account1.secretKey });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingWithdraw.signed);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('52ZX8MUwmYc6WQ67riUBpmntkcSxxT5aKkJYt5CtCZub');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });

    it('build a staking withdraw unsigned tx', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingWithdraw.unsigned);
      const explainTx = tx.explainTransaction();
      explainTx.outputAmount.should.equal('1000000');
      explainTx.outputs[0].amount.should.equal('1000000');
      explainTx.outputs[0].address.should.equal(testData.accounts.account1.address);
    });

    it('build from an unsigned staking withdraw tx', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingWithdraw.unsigned);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('52ZX8MUwmYc6WQ67riUBpmntkcSxxT5aKkJYt5CtCZub');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });

    it('build from a signed staking withdraw tx', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingWithdraw.signed);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('52ZX8MUwmYc6WQ67riUBpmntkcSxxT5aKkJYt5CtCZub');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });
  });

  describe('Fail', () => {
    it('staking withdraw with missing gas', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .amount(amount)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('gas is required before building staking withdraw');
    });

    it('staking withdraw with missing amount', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('amount is required before building staking withdraw');
    });
  });
});
