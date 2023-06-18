import { Transaction, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import { rawTx } from '../resources';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

describe('ADA Staking Pledge Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  it('should build a pledge transaction that registers a new staking pool', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(rawTx.unsignedNewPledgeTx);
    const txBuilder = factory.getStakingPledgeBuilder();
    txBuilder.initBuilder(prebuiltTx);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingPledge);
    const txData = tx.toJson();
    txData.inputs.length.should.equal(1);
    txData.outputs.length.should.equal(1);
    txData.certs.length.should.equal(2);
    txData.certs[0].type.should.equal(3);
    txData.certs[1].type.should.equal(1);
    should.exist(txData.certs[1].poolKeyHash);
    txData.certs[0].poolKeyHash!.should.equal('76044d3aa9caafbb213ae45f9a3f5ad3cc6c836f375ebbcfa5c83681');
    txData.withdrawals.length.should.equal(0);
    txData.witnesses.length.should.equal(0);

    const fee = tx.getFee;
    fee.should.equal('185609');
    tx.toBroadcastFormat().should.equal(rawTx.unsignedNewPledgeTx);
    should.equal(tx.id, rawTx.unsignedNewPledgeTxHash);

    const explainedTx = tx.explainTransaction();
    should.equal(explainedTx.type, 'StakingPledge');
  });

  it('should build a pledge transaction that updates existing staking pool', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(rawTx.unsignedUpdatePledgeTx);
    const txBuilder = factory.getStakingPledgeBuilder();
    txBuilder.initBuilder(prebuiltTx);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingPledge);
    const txData = tx.toJson();
    txData.inputs.length.should.equal(1);
    txData.outputs.length.should.equal(1);
    txData.certs.length.should.equal(1);
    txData.certs[0].type.should.equal(3);
    should.exist(txData.certs[0].poolKeyHash);
    txData.certs[0].poolKeyHash!.should.equal('f61c42cbf7c8c53af3f520508212ad3e72f674f957fe23ff0acb4973');
    txData.withdrawals.length.should.equal(0);
    txData.witnesses.length.should.equal(0);

    const fee = tx.getFee;
    fee.should.equal('42');
    tx.toBroadcastFormat().should.equal(rawTx.unsignedUpdatePledgeTx);
    should.equal(tx.id, rawTx.unsignedUpdatePledgeTxHash);

    const explainedTx = tx.explainTransaction();
    should.equal(explainedTx.type, 'StakingPledge');
  });

  it('should add node key witness to unsigned pledge transaction', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(rawTx.unsignedUpdatePledgeTx);
    const txBuilder = factory.getStakingPledgeBuilder();
    txBuilder.initBuilder(prebuiltTx);
    txBuilder.addNodeKeyWitness(rawTx.pledgeNodeKeyPubkey, rawTx.pledgeNodeWitnessSignature);
    const tx = (await txBuilder.build()) as Transaction;
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(1);
  });
});
