import should from 'should';
import * as testData from '../../resources/near';
import { getBuilderFactory } from '../getBuilderFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { metaPoolContractAddress } from '../../resources/near';

describe('Near Meta Pool Withdraw Builder', () => {
  const factory = getBuilderFactory('tnear');
  const gas = '125000000000000';

  describe('Succeed', () => {
    it('build a meta pool withdraw_all signed tx', async () => {
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      txBuilder.sign({ key: testData.accounts.account1.secretKey });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      const txJson = tx.toJson();
      txJson.should.have.properties(['id', 'signerId', 'publicKey', 'nonce', 'actions', 'signature']);
      txJson.signerId.should.equal(testData.accounts.account1.address);
      txJson.publicKey.should.equal(testData.accounts.account1.publicKeyBase58);
      txJson.nonce.should.equal(BigInt(1));
      txJson.receiverId.should.equal(metaPoolContractAddress);
      txJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw_all',
            args: {},
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
    });

    it('build a meta pool withdraw_all unsigned tx', async () => {
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      const explainTx = tx.explainTransaction();
      explainTx.outputAmount.should.equal('0');
      explainTx.outputs[0].amount.should.equal('0');
      explainTx.outputs[0].address.should.equal(testData.accounts.account1.address);
    });

    it('build from a raw unsigned meta pool withdraw_all tx (round-trip)', async () => {
      // Build the original transaction
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      const originalTx = await txBuilder.build();
      const rawTx = originalTx.toBroadcastFormat();

      // Reconstruct from raw
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltJson = rebuiltTx.toJson();

      rebuiltJson.signerId.should.equal(testData.accounts.account1.address);
      rebuiltJson.receiverId.should.equal(metaPoolContractAddress);
      rebuiltJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw_all',
            args: {},
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
      should.equal(rebuiltTx.type, TransactionType.StakingWithdraw);
      rebuiltTx.id.should.equal(originalTx.id);
    });

    it('build from a raw signed meta pool withdraw_all tx (round-trip)', async () => {
      // Build the original signed transaction
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      txBuilder.sign({ key: testData.accounts.account1.secretKey });
      const originalTx = await txBuilder.build();
      const rawTx = originalTx.toBroadcastFormat();

      // Reconstruct from raw
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltJson = rebuiltTx.toJson();

      rebuiltJson.signerId.should.equal(testData.accounts.account1.address);
      rebuiltJson.receiverId.should.equal(metaPoolContractAddress);
      rebuiltJson.actions.should.deepEqual([
        {
          functionCall: {
            methodName: 'withdraw_all',
            args: {},
            gas: '125000000000000',
            deposit: '0',
          },
        },
      ]);
      should.equal(rebuiltTx.type, TransactionType.StakingWithdraw);
      rebuiltTx.id.should.equal(originalTx.id);
      rebuiltJson.should.have.property('signature');
    });
  });

  describe('Fail', () => {
    it('meta pool withdraw with missing gas', async () => {
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      await txBuilder.build().should.be.rejectedWith('gas is required before building staking withdraw');
    });

    it('meta pool withdraw rejects amount()', () => {
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      should(() => txBuilder.amount('1000000')).throw('amount is not applicable for withdraw_all');
    });
  });

  describe('Routing', () => {
    it('factory.from routes withdraw to StakingWithdrawBuilder', async () => {
      // Build a native withdraw tx
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .amount('1000000')
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(testData.validatorContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Verify from() routes to StakingWithdrawBuilder (not MetaPoolWithdrawBuilder)
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltJson = rebuiltTx.toJson();
      rebuiltJson.actions[0].functionCall!.methodName.should.equal('withdraw');
      should.equal(rebuiltTx.type, TransactionType.StakingWithdraw);
    });

    it('factory.from routes withdraw_all to MetaPoolWithdrawBuilder', async () => {
      // Build a meta pool withdraw_all tx
      const txBuilder = factory.getMetaPoolWithdrawBuilder();
      txBuilder
        .gas(gas)
        .sender(testData.accounts.account1.address, testData.accounts.account1.publicKey)
        .receiverId(metaPoolContractAddress)
        .recentBlockHash(testData.blockHash.block1)
        .nonce(BigInt(1));
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // Verify from() routes to MetaPoolWithdrawBuilder
      const rebuiltBuilder = factory.from(rawTx);
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltJson = rebuiltTx.toJson();
      rebuiltJson.actions[0].functionCall!.methodName.should.equal('withdraw_all');
      should.equal(rebuiltTx.type, TransactionType.StakingWithdraw);
    });
  });
});
