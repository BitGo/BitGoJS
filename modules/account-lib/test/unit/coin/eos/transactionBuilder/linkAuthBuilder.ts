import should from 'should';
import { coins } from '@bitgo/statics';
import { EosTransactionBuilder } from '../../../../../src/coin/eos/eosTransactionBuilder';
import * as EosResources from '../../../../resources/eos';
import { Transaction } from '../../../../../src/coin/eos/transaction';
import { NameValidationError } from '../../../../../src/coin/eos/errors';

class StubTransactionBuilder extends EosTransactionBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos link auth builder', () => {
  let builder: StubTransactionBuilder;

  const sender = EosResources.accounts.account1;
  const { permission1 } = EosResources.permission;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', async () => {
    it('should fail with an invalid account name', async () => {
      const authBuilder = builder.linkAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.account('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid code', async () => {
      const authBuilder = builder.linkAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.code('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid type', async () => {
      const authBuilder = builder.linkAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.type('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid requirement', async () => {
      const authBuilder = builder.linkAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.requirement('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail without required fields', async () => {
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder.updateAuthActionBuilder('eosio', [sender.name]);
      try {
        await builder.build();
      } catch (error) {
        should.equal(error.name, Error.name);
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
        .linkAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .code(sender.name)
        .type(permission1.type)
        .requirement(permission1.requirement);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
      should.deepEqual(json.actions[0].data.requirement, permission1.requirement);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.linkAuthTransaction.serializedTransaction,
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
        .linkAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .code(sender.name)
        .type(permission1.type)
        .requirement(permission1.requirement);
      builder.sign({ key: EosResources.accounts.account3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
      should.deepEqual(json.actions[0].data.requirement, permission1.requirement);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.linkAuthTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.linkAuthTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
      should.deepEqual(json.actions[0].data.requirement, permission1.requirement);
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.linkAuthTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
      should.deepEqual(json.actions[0].data.requirement, permission1.requirement);
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
        .linkAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .code(sender.name)
        .type(permission1.type)
        .requirement(permission1.requirement);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
});
