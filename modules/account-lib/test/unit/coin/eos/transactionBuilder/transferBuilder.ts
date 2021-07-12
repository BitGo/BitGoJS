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

describe('Eos Transfer builder', () => {
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
        .transferActionBuilder('eosio.token', [sender.name])
        .from(sender.name)
        .to(receiver.name)
        .quantity('1.0000 SYS')
        .memo('Some memo');
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
      should.deepEqual(tx.inputs[0].address, sender.name);
      should.deepEqual(tx.inputs[0].value, '1.0000 SYS');
      should.deepEqual(tx.inputs[0].coin, 'eos');
      should.deepEqual(tx.outputs[0].address, 'david');
      should.deepEqual(tx.outputs[0].value, '1.0000 SYS');
      should.deepEqual(tx.outputs[0].coin, 'eos');
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.tranferTransaction.serializedTransaction,
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
        .transferActionBuilder('eosio.token', [sender.name])
        .from(sender.name)
        .to(receiver.name)
        .quantity('1.0000 SYS')
        .memo('Some memo');
      builder.sign({ key: EosResources.accounts.account3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(
        builder.getTransaction().verifySignature([sender.publicKey, EosResources.accounts.account3.publicKey]),
        true,
      );
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.tranferTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.tranferTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.tranferTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
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
        .transferActionBuilder('eosio.token', [sender.name])
        .from(sender.name)
        .to(receiver.name)
        .quantity('1.0000 SYS')
        .memo('Some memo');
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
});
