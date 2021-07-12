import should from 'should';
import { coins } from '@bitgo/statics';
import { EosTransactionBuilder } from '../../../../../src/coin/eos/eosTransactionBuilder';
import * as EosResources from '../../../../resources/eos';
import { Transaction } from '../../../../../src/coin/eos/transaction';

class StubTransactionBuilder extends EosTransactionBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos vote producer builder', () => {
  let builder: StubTransactionBuilder;

  const sender = EosResources.accounts.account1;
  const receiver1 = EosResources.accounts.account2;
  const receiver2 = EosResources.accounts.account3;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', async () => {
    it('should fail without required fields', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder.voteActionBuilder('eosio', [sender.name]);
      try {
        await builder.build();
      } catch (error) {
        should.equal(error.message, 'Could not build tx');
      }
    });
    it('should fail if proxy and producers both are empty', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .voteActionBuilder('eosio', [sender.name])
        .voter(sender.name)
        .proxy('')
        .producers([])
      try {
        await builder.build();
      } catch (error) { 
        should.equal(error.message, 'Could not build tx');
      }
    });

    it('should fail if proxy and producers both are provided', async () => {
        builder
          .testnet()
          .expiration('2019-09-19T16:39:15')
          .refBlockNum(100)
          .refBlockPrefix(100)
          .sign({ key: sender.privateKey });
        builder
          .voteActionBuilder('eosio', [sender.name])
          .voter(sender.name)
          .proxy(receiver1.name)
          .producers([receiver2.name])
        try {
          await builder.build();
        } catch (error) { 
          should.equal(error.message, 'Could not build tx');
        }
      });
    });

  describe('build transaction', () => {
    it('should build a transaction', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .voteActionBuilder('eosio', [sender.name])
        .voter(sender.name)
        .proxy('')
        .producers([receiver1.name, receiver2.name])
    
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.voter, sender.name);
      should.deepEqual(json.actions[0].data.producers, [receiver1.name, receiver2.name]);
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.voteProducerTransaction.serializedTransaction,
      );
    });

    it('should build a multi-sig transaction', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .voteActionBuilder('eosio', [sender.name])
        .voter(sender.name)
        .proxy('')
        .producers([receiver1.name, receiver2.name])

      builder.sign({ key: receiver2.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.voter, sender.name);
      should.deepEqual(json.actions[0].data.producers, [receiver1.name, receiver2.name]);
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey, receiver2.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.voteProducerTransaction.serializedTransaction,
      );
    });


    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.voteProducerTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.voter, sender.name);
      should.deepEqual(json.actions[0].data.producers, [receiver1.name, receiver2.name]);
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.voteProducerTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.voteProducerTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.voter, sender.name);
      should.deepEqual(json.actions[0].data.producers, [receiver1.name, receiver2.name]);
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.voteProducerTransaction.serializedTransaction,
      );
    });

  describe('transaction validation', () => {
    it('should validate a normal transaction', () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .voteActionBuilder('eosio', [sender.name])
        .voter(sender.name)
        .proxy('')
        .producers([receiver1.name, receiver2.name])
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
})
});
