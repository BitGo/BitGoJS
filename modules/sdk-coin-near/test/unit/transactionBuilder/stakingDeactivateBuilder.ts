import should from 'should';
import * as testData from '../../resources/near';
import { getBuilderFactory } from '../getBuilderFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { validatorContractAddress } from '../../resources/near';

describe('Near Staking Deactivate Builder', () => {
  const factory = getBuilderFactory('tnear');
  const gas = '125000000000000';
  const amount = '1000000'; // amount to be deactivate in yoctos

  describe('Succeed', () => {
    it('build a staking deactivate signed tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      txBuilder.sign({ key: testData.accounts.account1.secretKey });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      should.equal(tx.type, TransactionType.StakingDeactivate);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingDeactivate.signed);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('CDxPRP3DgHN8gYmRDagk5TRuX7fsCRYHcuqoNULyQPUW');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'unstake',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });

    it('build a staking deactivate unsigned tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      should.equal(tx.type, TransactionType.StakingDeactivate);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingDeactivate.unsigned);
    });

    it('should fail to staking deactivate with missing gas', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder
        .amount(amount)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('gas is required before building staking deactivate');
    });

    it('should fail to staking deactivate with missing amount', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('amount is required before building staking deactivate');
    });

    it('build from an unsigned staking deactivate', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingDeactivate.unsigned);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('CDxPRP3DgHN8gYmRDagk5TRuX7fsCRYHcuqoNULyQPUW');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'unstake',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });

    it('build from an signed staking deactivate', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingDeactivate.signed);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('CDxPRP3DgHN8gYmRDagk5TRuX7fsCRYHcuqoNULyQPUW');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'unstake',
            args: { amount: amount },
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });
  });
});
