import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { KeyPair, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';

describe('ADA Staking Withdraw Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));
  it('should build an unsigned claim rewards tx', async () => {
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey2 });
    const txBuilder = factory.getStakingClaimRewardsBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const totalInput = '4000000';
    txBuilder.changeAddress(
      'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      totalInput
    );
    const reward = 1239239;
    txBuilder.addWithdrawal(keyPairStake.getKeys().pub, reward.toString());
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.StakingClaim);
    const txData = tx.toJson();
    const fee = tx.getFee;
    txData.certs.length.should.equal(0);
    txData.withdrawals.length.should.equal(1);
    txData.withdrawals[0].value.should.equal(reward.toString());
    txData.outputs.length.should.equal(1);
    txData.outputs[0].amount.should.equal((Number(totalInput) + reward - Number(fee)).toString());
    fee.should.equal('171749');
  });
});
