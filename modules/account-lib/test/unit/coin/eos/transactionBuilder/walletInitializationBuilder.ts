import should from 'should';
import { coins } from '@bitgo/statics';
import * as Numeric from 'eosjs/dist/eosjs-numeric';
import { WalletInitializationBuilder } from '../../../../../src/coin/eos/WalletInitializationBuilder';
import * as EosResources from '../../../../resources/eos';
import { Transaction } from '../../../../../src/coin/eos/transaction';

class StubTransactionBuilder extends WalletInitializationBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos Stake builder', () => {
  let builder: StubTransactionBuilder;

  const user1 = EosResources.accounts.account1;
  const user2 = EosResources.accounts.account2;
  const user3 = EosResources.accounts.account3;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
  });
    it('should build a multi action transaction', async () => {
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
      
      builder
        .buyRamBytesActionBuilder('eosio', [user1.name])
        .payer(user1.name)
        .receiver(user3.name)
        .bytes(8192);  
      
      builder  
        .stakeActionBuilder('eosio', [user1.name])
        .from(user1.name)
        .receiver(user3.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);

      const tx = await builder.build();
      const json = await tx.toJson();

      should.deepEqual(json.actions[0].data.creator, user1.name);
      should.deepEqual(json.actions[0].data.name, 'mynewaccount');
      const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(json.actions[1].data.payer, user1.name);
      should.deepEqual(json.actions[1].data.receiver, 'kerry');
      should.deepEqual(json.actions[1].data.bytes, 8192);
      should.deepEqual(json.actions[2].data.from, user1.name);
      should.deepEqual(json.actions[2].data.receiver, 'kerry');
      should.deepEqual(json.actions[2].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.transfer, false);
      should.deepEqual(
      tx.toBroadcastFormat().serializedTransaction,
      EosResources.WalletInitializationTransaction.serializedTransaction,
    );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.WalletInitializationTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.creator, user1.name);
      should.deepEqual(json.actions[0].data.name, 'mynewaccount');
      const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(user1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(json.actions[1].data.payer, user1.name);
      should.deepEqual(json.actions[1].data.receiver, 'kerry');
      should.deepEqual(json.actions[1].data.bytes, 8192);
      should.deepEqual(json.actions[2].data.from, user1.name);
      should.deepEqual(json.actions[2].data.receiver, 'kerry');
      should.deepEqual(json.actions[2].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.transfer, false);
      should.deepEqual(
      tx.toBroadcastFormat().serializedTransaction,
      EosResources.WalletInitializationTransaction.serializedTransaction,
    );
    });
  })
