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

describe('Eos Power up builder', () => {
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
        .powerupActionBuilder('eosio', [sender.name])
        .payer(sender.name)
        .receiver(receiver.name)
        .days(1)
        .netFrac('2000000000')
        .cpuFrac('8000000000')
        .maxPayment('10.0000 EOS');
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.payer, sender.name);
      should.deepEqual(json.actions[0].data.receiver, receiver.name);
      should.deepEqual(json.actions[0].data.days, 1);
      should.deepEqual(json.actions[0].data.net_frac, '2000000000');
      should.deepEqual(json.actions[0].data.cpu_frac, '8000000000');
      should.deepEqual(json.actions[0].data.max_payment, '10.0000 EOS');
      should.deepEqual(tx.inputs[0].address, sender.name);
      should.deepEqual(tx.inputs[0].value, '0');
      should.deepEqual(tx.inputs[0].coin, 'eos');
      should.deepEqual(tx.outputs[0].address, receiver.name);
      should.deepEqual(tx.outputs[0].value, '0');
      should.deepEqual(tx.outputs[0].coin, 'eos');
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.powerupTransaction.serializedTransaction,
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
        .powerupActionBuilder('eosio', [sender.name])
        .payer(sender.name)
        .receiver(receiver.name)
        .days(1)
        .netFrac('2000000000')
        .cpuFrac('8000000000')
        .maxPayment('10.0000 EOS');
      builder.sign({ key: EosResources.accounts.account3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.payer, sender.name);
      should.deepEqual(json.actions[0].data.receiver, receiver.name);
      should.deepEqual(json.actions[0].data.days, 1);
      should.deepEqual(json.actions[0].data.net_frac, '2000000000');
      should.deepEqual(json.actions[0].data.cpu_frac, '8000000000');
      should.deepEqual(json.actions[0].data.max_payment, '10.0000 EOS');
      should.deepEqual(
        builder.getTransaction().verifySignature([sender.publicKey, EosResources.accounts.account3.publicKey]),
        true,
      );
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.powerupTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.powerupTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.payer, sender.name);
      should.deepEqual(json.actions[0].data.receiver, receiver.name);
      should.deepEqual(json.actions[0].data.days, 1);
      should.deepEqual(json.actions[0].data.net_frac, '2000000000');
      should.deepEqual(json.actions[0].data.cpu_frac, '8000000000');
      should.deepEqual(json.actions[0].data.max_payment, '10.0000 EOS');
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.powerupTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
      should.deepEqual(json.actions[0].data.payer, sender.name);
      should.deepEqual(json.actions[0].data.receiver, receiver.name);
      should.deepEqual(json.actions[0].data.days, 1);
      should.deepEqual(json.actions[0].data.net_frac, '2000000000');
      should.deepEqual(json.actions[0].data.cpu_frac, '8000000000');
      should.deepEqual(json.actions[0].data.max_payment, '10.0000 EOS');
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
        .powerupActionBuilder('eosio', [sender.name])
        .payer(sender.name)
        .receiver(receiver.name)
        .days(1)
        .netFrac('2000000000')
        .cpuFrac('8000000000')
        .maxPayment('10.0000 EOS');
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
});
