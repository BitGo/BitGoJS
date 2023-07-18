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
    txData.inputs.length.should.equal(2);
    txData.outputs.length.should.equal(1);
    txData.certs.length.should.equal(2);
    txData.certs[0].type.should.equal(3);
    txData.certs[1].type.should.equal(1);
    should.exist(txData.certs[1].poolKeyHash);
    txData.certs[0].poolKeyHash!.should.equal('10324dc34187735de46f6260d94620cdcc819f7ed1f93e3fc58d06a0');
    txData.withdrawals.length.should.equal(0);
    txData.witnesses.length.should.equal(0);
    should.exist(txData.pledgeDetails);
    should.not.exist(txData.pledgeDetails!.stakeKeyRegistration);
    should.exist(txData.pledgeDetails!.stakeKeyDelegation);
    should.exist(txData.pledgeDetails!.stakePoolRegistration);
    should.equal(
      txData.pledgeDetails!.stakeKeyDelegation!.poolKeyHash,
      txData.pledgeDetails!.stakePoolRegistration!.poolKeyHash
    );
    txData.pledgeDetails!.stakePoolRegistration!.pledge.should.equal('100000000');
    txData.pledgeDetails!.stakePoolRegistration!.cost.should.equal('500000000');
    txData.pledgeDetails!.stakePoolRegistration!.marginNumerator.should.equal('3');
    txData.pledgeDetails!.stakePoolRegistration!.marginDenominator.should.equal('20');
    txData.pledgeDetails!.stakePoolRegistration!.rewardAccount.should.equal(
      txData.pledgeDetails!.stakePoolRegistration!.poolOwners[0]
    );

    const fee = tx.getFee;
    fee.should.equal('1000000');
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
    txData.inputs.length.should.equal(2);
    txData.outputs.length.should.equal(1);
    txData.certs.length.should.equal(1);
    txData.certs[0].type.should.equal(3);
    should.exist(txData.certs[0].poolKeyHash);
    txData.certs[0].poolKeyHash!.should.equal('10324dc34187735de46f6260d94620cdcc819f7ed1f93e3fc58d06a0');
    txData.withdrawals.length.should.equal(0);
    txData.witnesses.length.should.equal(0);
    should.exist(txData.pledgeDetails);
    should.not.exist(txData.pledgeDetails!.stakeKeyRegistration);
    should.not.exist(txData.pledgeDetails!.stakeKeyDelegation);
    should.exist(txData.pledgeDetails!.stakePoolRegistration);
    txData.pledgeDetails!.stakePoolRegistration!.pledge.should.equal('100000000');
    txData.pledgeDetails!.stakePoolRegistration!.cost.should.equal('500000000');
    txData.pledgeDetails!.stakePoolRegistration!.marginNumerator.should.equal('3');
    txData.pledgeDetails!.stakePoolRegistration!.marginDenominator.should.equal('20');
    txData.pledgeDetails!.stakePoolRegistration!.rewardAccount.should.equal(
      txData.pledgeDetails!.stakePoolRegistration!.poolOwners[0]
    );

    const fee = tx.getFee;
    fee.should.equal('1000000');
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
    tx.signature.length.should.equal(1);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(1);
    should.exist(txData.pledgeDetails);
    should.not.exist(txData.pledgeDetails!.stakeKeyRegistration);
    should.not.exist(txData.pledgeDetails!.stakeKeyDelegation);
    should.exist(txData.pledgeDetails!.stakePoolRegistration);
    txData.pledgeDetails!.stakePoolRegistration!.pledge.should.equal('100000000');
    txData.pledgeDetails!.stakePoolRegistration!.cost.should.equal('500000000');
    txData.pledgeDetails!.stakePoolRegistration!.marginNumerator.should.equal('3');
    txData.pledgeDetails!.stakePoolRegistration!.marginDenominator.should.equal('20');
    txData.pledgeDetails!.stakePoolRegistration!.rewardAccount.should.equal(
      txData.pledgeDetails!.stakePoolRegistration!.poolOwners[0]
    );

    const rebuiltTx = new Transaction(coins.get('tada'));
    rebuiltTx.fromRawTransaction(tx.toBroadcastFormat());
    rebuiltTx.signature.length.should.equal(1);
    rebuiltTx.toBroadcastFormat().should.equal(tx.toBroadcastFormat());
    rebuiltTx.toBroadcastFormat().should.not.equal(rawTx.unsignedUpdatePledgeTx);
  });

  it('should init from partially signed txn hex and preserve the signature', async () => {
    const txnBuilderFactory = new TransactionBuilderFactory(coins.get('tada'));
    const txnBuilder = txnBuilderFactory.from(rawTx.partiallySignedPledgeTx);
    let tx = (await txnBuilder.build()) as Transaction;
    tx.type.should.equal(TransactionType.StakingPledge);
    tx.signature.length.should.equal(1);
    let txData = tx.toJson();
    txData.witnesses.length.should.equal(1);
    txData.witnesses[0].publicKey.should.equal(rawTx.pledgeNodeKeyPubkey);
    txData.witnesses[0].signature.should.equal(rawTx.pledgeNodeWitnessSignature);

    txnBuilder.addSignature({ pub: rawTx.pledgeNodeKeyPubkey }, Buffer.from(rawTx.pledgeNodeWitnessSignature, 'hex'));
    tx = (await txnBuilder.build()) as Transaction;
    tx.type.should.equal(TransactionType.StakingPledge);
    txData = tx.toJson();
    txData.witnesses.length.should.equal(2);
    txData.witnesses[0].publicKey.should.equal(rawTx.pledgeNodeKeyPubkey);
    txData.witnesses[0].signature.should.equal(rawTx.pledgeNodeWitnessSignature);
    txData.witnesses[1].publicKey.should.equal(rawTx.pledgeNodeKeyPubkey);
    txData.witnesses[1].signature.should.equal(rawTx.pledgeNodeWitnessSignature);
  });

  it('should init from partially signed txn object and preserve the signature', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(rawTx.partiallySignedPledgeTx);
    prebuiltTx.toBroadcastFormat().should.equal(rawTx.partiallySignedPledgeTx);
    prebuiltTx.signature.length.should.equal(1);
    const txBuilder = factory.getStakingPledgeBuilder();
    txBuilder.initBuilder(prebuiltTx);
    const tx = (await txBuilder.build()) as Transaction;
    tx.type.should.equal(TransactionType.StakingPledge);
    tx.toBroadcastFormat().should.equal(rawTx.partiallySignedPledgeTx);
    tx.signature.length.should.equal(1);
    const txData = tx.toJson();
    txData.witnesses.length.should.equal(1);
    txData.witnesses[0].publicKey.should.equal(rawTx.pledgeNodeKeyPubkey);
    txData.witnesses[0].signature.should.equal(rawTx.pledgeNodeWitnessSignature);
  });
});
