import { Transaction, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import { rawTx } from '../resources';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';

describe('ADA Staking Pledge Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));

  it('should read a prebuilt transaction', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(rawTx.unsignedPledgeTx);
    const txBuilder = factory.getStakingPledgeBuilder();
    txBuilder.initBuilder(prebuiltTx);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingPledge);
    const txData = tx.toJson();
    txData.certs.length.should.equal(1);
    txData.certs[0].type.should.equal(1);
    txData.outputs.length.should.equal(1);

    const fee = tx.getFee;
    fee.should.equal('185609');
    tx.toBroadcastFormat().should.equal(rawTx.unsignedPledgeTx);
    should.equal(tx.id, rawTx.unsignedPledgeTxHash);

    const explainedTx = tx.explainTransaction();
    should.equal(explainedTx.type, 'StakingPledge');
  });
});
