import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import * as testData from '../resources';
import { KeyPair, TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';
import { CertType, Transaction } from '../../src/lib/transaction';

describe('ADA Vote Delegation Transaction Builder', async () => {
  const factory = new TransactionBuilderFactory(coins.get('tada'));
  it('start and build an unsigned staking vote delegation tx', async () => {
    const keyPairStake = new KeyPair({ prv: testData.privateKeys.prvKey2 });
    const txBuilder = factory.getVoteDelegationBuilder();
    txBuilder.input({
      transaction_id: '3677e75c7ba699bfdc6cd57d42f246f86f63aefd76025006ac78313fad2bba21',
      transaction_index: 1,
    });
    const totalInput = '4000000';
    txBuilder.changeAddress(
      'addr1q8rm9z7w4yx5gz652kn2q238efvms6t0qelur9nlglun8eu4tr5knj4fu4adelzqhxg8adu5xca4jra0gtllfrpcawyq9psz23',
      totalInput
    );
    txBuilder.addVoteDelegationCertificate(
      keyPairStake.getKeys().pub,
      'drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd'
    );
    txBuilder.ttl(800000000);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.VoteDelegation);

    const explainedTx = tx.explainTransaction();
    should.equal(explainedTx.type, 'VoteDelegation');

    const txData = tx.toJson();
    const fee = tx.getFee;
    fee.should.equal('168537');

    txData.certs.length.should.equal(1);
    txData.certs[0].type.should.equal(CertType.VoteDelegation);

    txData.outputs.length.should.equal(1);
    txData.outputs[0].amount.should.equal((Number(totalInput) - Number(fee)).toString());
    tx.toBroadcastFormat().should.equal(testData.rawTx.unsignedVoteDelegationTx);
    should.equal(tx.id, testData.rawTx.unsignedVoteDelegationTxHash);
  });

  it('should build a vote delegation transaction', async () => {
    const prebuiltTx = new Transaction(coins.get('tada'));
    prebuiltTx.fromRawTransaction(testData.rawTx.unsignedVoteDelegationTx);
    const txBuilder = factory.getVoteDelegationBuilder();
    txBuilder.initBuilder(prebuiltTx);
    const tx = (await txBuilder.build()) as Transaction;
    should.equal(tx.type, TransactionType.VoteDelegation);
    const txData = tx.toJson();
    txData.inputs.length.should.equal(1);
    txData.outputs.length.should.equal(1);
    txData.certs.length.should.equal(1);
    txData.certs[0].type.should.equal(CertType.VoteDelegation);
    should.exist(txData.certs[0].dRepId);
    txData.certs[0].dRepId!.should.equal('drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd');
    txData.withdrawals.length.should.equal(0);
    txData.witnesses.length.should.equal(0);

    const fee = tx.getFee;
    fee.should.equal('168537');
    tx.toBroadcastFormat().should.equal(testData.rawTx.unsignedVoteDelegationTx);
    should.equal(tx.id, testData.rawTx.unsignedVoteDelegationTxHash);

    const explainedTx = tx.explainTransaction();
    should.equal(explainedTx.type, 'VoteDelegation');
  });
});
