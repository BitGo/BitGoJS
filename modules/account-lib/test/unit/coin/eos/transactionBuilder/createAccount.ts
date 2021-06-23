import should from 'should';
import { coins } from '@bitgo/statics';
import * as Numeric from 'eosjs/dist/eosjs-numeric';
import { EosTransactionBuilder } from '../../../../../src/coin/eos/eosTransactionBuilder';
import * as EosResources from '../../../../resources/eos';
import { Transaction } from '../../../../../src/coin/eos/transaction';


class StubTransactionBuilder extends EosTransactionBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos create new account builder', () => {
  let builder: StubTransactionBuilder;

  const user1 = EosResources.accounts.account1;
  const user2 = EosResources.accounts.account2;
  const user3 = EosResources.accounts.account3;
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
        .sign({ key: user1.privateKey });
      builder.newAccountActionBuilder('eosio', [user1.name]);
      try {
        await builder.build();
      } catch (error) {
        should.equal(error.message, 'Could not build tx');
      }
    });
  
  describe('build transaction', () => {
    it('should build a transaction', async () => {
        builder
            .testnet()
            .expiration('2019-09-19T16:39:15')
            .refBlockNum(100)
            .refBlockPrefix(100)
            .sign({ key: user1.privateKey });
        builder
            .newAccountActionBuilder('eosio', [user1.name])
            .creator(user1.name)
            .name('mynewaccount')
            .owner({threshold:1, keys:[{key: user1.publicKey, weight:1}], accounts:[], waits:[]})
            .active({threshold:1, keys:[{key: user2.publicKey, weight:1}], accounts:[], waits:[]})
        const tx = await builder.build();
        const json = await tx.toJson();
        should.deepEqual(json.actions[0].data.creator, user1.name);
        should.deepEqual(json.actions[0].data.name, 'mynewaccount');
        const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
        const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
        should.deepEqual(formattedKey, expectedFormattedKey);
        should.deepEqual(builder.getTransaction().verifySignature([user1.publicKey]), true);
        should.deepEqual(
          tx.toBroadcastFormat().serializedTransaction,
          EosResources.newAccountTransaction.serializedTransaction,
        );
    });

    it('should build a multi-sig transaction', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: user1.privateKey });
      builder
        .newAccountActionBuilder('eosio', [user1.name])
        .creator(user1.name)
        .name('mynewaccount')
        .owner({threshold:1, keys:[{key: user1.publicKey, weight:1}], accounts:[], waits:[]})
        .active({threshold:1, keys:[{key: user2.publicKey, weight:1}], accounts:[], waits:[]})
      builder.sign({ key: user3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.creator, user1.name);
      should.deepEqual(json.actions[0].data.name, 'mynewaccount');
      const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(builder.getTransaction().verifySignature([user1.publicKey, user3.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.newAccountTransaction.serializedTransaction,
      );
  });


    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.newAccountTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.creator, user1.name);
      should.deepEqual(json.actions[0].data.name, 'mynewaccount');
      const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.newAccountTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
        builder.testnet();
        builder.from(EosResources.newAccountTransaction.serializedTransaction);
        builder.sign({ key: user1.privateKey });
        const tx = await builder.build();
        const json = await tx.toJson();
        should.deepEqual(json.actions[0].data.creator, user1.name);
        should.deepEqual(json.actions[0].data.name, 'mynewaccount');
        const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
        const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
        should.deepEqual(formattedKey, expectedFormattedKey);
        should.deepEqual(builder.getTransaction().verifySignature([user1.publicKey]), true);
        should.deepEqual(
          tx.toBroadcastFormat().serializedTransaction,
          EosResources.newAccountTransaction.serializedTransaction,
        );
      });    
    })
})
});
