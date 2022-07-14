import should from 'should';

import * as testData from '../../resources/near';
import { getBuilderFactory } from '../getBuilderFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { validatorContractAddress } from '../../resources/near';

describe('Near Staking Activate Builder', () => {
  const factory = getBuilderFactory('tnear');
  const gas = '125000000000000';
  const amount = '1000000'; // amount to be staked in yoctos

  describe('Succeed', () => {
    it('build a create and delegate staking signed tx', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
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
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: amount,
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: validatorContractAddress,
        value: amount,
        coin: 'tnear',
      });

      should.equal(tx.type, TransactionType.StakingActivate);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingActivate.signed);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('GpiLLaGs2Fk2bd7SQvhkJaZjj74UnPPdF7cUa9pw15je');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'deposit_and_stake',
            args: {},
            gas: '125000000000000',
            deposit: '1000000',
          },
        },
      ]);
    });

    it('build a create and delegate staking unsigned tx', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: amount,
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: validatorContractAddress,
        value: amount,
        coin: 'tnear',
      });

      should.equal(tx.type, TransactionType.StakingActivate);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.rawTx.stakingActivate.unsigned);
    });

    it('should fail to create and delegate staking with missing gas', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('gas is required before building staking activate');
    });

    it('should fail to create and delegate staking with missing amount', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(1);
      await txBuilder.build().should.be.rejectedWith('amount is required before building staking activate');
    });

    it('build from an unsigned staking activate', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingActivate.unsigned);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: '1000000',
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: 'lavenderfive.pool.f863973.m0',
        value: '1000000',
        coin: 'tnear',
      });
      tx.id.should.equal('GpiLLaGs2Fk2bd7SQvhkJaZjj74UnPPdF7cUa9pw15je');
    });

    it('build from an signed staking activate', async () => {
      const txBuilder = factory.from(testData.rawTx.stakingActivate.signed);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: testData.accounts.account1.address,
        value: '1000000',
        coin: 'tnear',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: 'lavenderfive.pool.f863973.m0',
        value: '1000000',
        coin: 'tnear',
      });
      tx.id.should.equal('GpiLLaGs2Fk2bd7SQvhkJaZjj74UnPPdF7cUa9pw15je');
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.id.should.equal('GpiLLaGs2Fk2bd7SQvhkJaZjj74UnPPdF7cUa9pw15je');
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(1);
      txJson.receiverId.should.equal('lavenderfive.pool.f863973.m0');
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'deposit_and_stake',
            args: {},
            gas: '125000000000000',
            deposit: '1000000',
          },
        },
      ]);
    });
  });
});
