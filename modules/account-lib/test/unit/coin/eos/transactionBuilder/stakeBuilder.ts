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

describe('Eos Stake builder', () => {
  let builder: StubTransactionBuilder;

  const sender = EosResources.accounts.account1;
  const receiver = EosResources.accounts.account2;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
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
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.stakeTransaction.serializedTransaction,
      );
    });

    it('should build a multi action transaction', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);
      builder
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.doubleStakeTransaction.serializedTransaction,
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
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);
      builder.sign({ key: EosResources.accounts.account3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.stakeTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.stakeTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.stakeTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
    });
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
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
});
