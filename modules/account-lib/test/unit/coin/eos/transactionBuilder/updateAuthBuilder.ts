import should from 'should';
import { coins } from '@bitgo/statics';
import * as Numeric from 'eosjs/dist/eosjs-numeric';
import { EosTransactionBuilder } from '../../../../../src/coin/eos/eosTransactionBuilder';
import * as EosResources from '../../../../resources/eos';
import { Transaction } from '../../../../../src/coin/eos/transaction';
import { NameValidationError, PermissionAuthValidationError } from '../../../../../src/coin/eos/errors';

class StubTransactionBuilder extends EosTransactionBuilder {
  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Eos update auth builder', () => {
  let builder: StubTransactionBuilder;

  const sender = EosResources.accounts.account1;
  // const receiver = EosResources.accounts.account2;
  const { permission1 } = EosResources.permission;
  beforeEach(() => {
    const config = coins.get('eos');
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', async () => {
    it('should fail with an invalid account name', async () => {
      const authBuilder = builder.updateAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.account('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid permission', async () => {
      const authBuilder = builder.updateAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.permission_name('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid parent', async () => {
      const authBuilder = builder.updateAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () => authBuilder.parent('some_invalid_long_name'),
        (e: Error) => e.name === NameValidationError.name,
      );
    });
    it('should fail with an invalid auth object', async () => {
      const authBuilder = builder.updateAuthActionBuilder('eosio', [sender.name]);
      should.throws(
        () =>
          authBuilder.auth({
            threshold: 1,
            accounts: [{ permission: { actor: '', permission: '' }, weight: 1 }],
            keys: [{ key: '', weight: 1 }],
            waits: [],
          }),
        (e: Error) => e.name === PermissionAuthValidationError.name,
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
        .updateAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .permission_name(permission1.name)
        .parent('active')
        .auth({
          threshold: 1,
          accounts: [
            {
              permission: {
                actor: sender.name,
                permission: 'active',
              },
              weight: 1,
            },
          ],
          keys: [
            {
              key: permission1.publicKey,
              weight: 1,
            },
          ],
          waits: [],
        });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.permission, permission1.name);
      const auth = json.actions[0].data.auth;
      should.deepEqual(auth.threshold, 1);
      should.deepEqual(auth.accounts[0].permission.actor, sender.name);
      should.deepEqual(auth.accounts[0].weight, 1);
      const formattedKey = Numeric.stringToPublicKey(auth.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(permission1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(auth.keys[0].weight, 1);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.updateAuthTransaction.serializedTransaction,
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
        .updateAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .permission_name(permission1.name)
        .parent('active')
        .auth({
          threshold: 1,
          accounts: [
            {
              permission: {
                actor: sender.name,
                permission: 'active',
              },
              weight: 1,
            },
          ],
          keys: [
            {
              key: permission1.publicKey,
              weight: 1,
            },
          ],
          waits: [],
        });
      builder.sign({ key: EosResources.accounts.account3.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.permission, permission1.name);
      const auth = json.actions[0].data.auth;
      should.deepEqual(auth.threshold, 1);
      should.deepEqual(auth.accounts[0].permission.actor, sender.name);
      should.deepEqual(auth.accounts[0].weight, 1);
      const formattedKey = Numeric.stringToPublicKey(auth.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(permission1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(auth.keys[0].weight, 1);
      should.deepEqual(
        tx.toBroadcastFormat().serializedTransaction,
        EosResources.updateAuthTransaction.serializedTransaction,
      );
    });

    it('should build a trx from a raw transaction', async () => {
      builder.testnet();
      builder.from(EosResources.updateAuthTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.permission, permission1.name);
      const auth = json.actions[0].data.auth;
      should.deepEqual(auth.threshold, 1);
      should.deepEqual(auth.accounts[0].permission.actor, sender.name);
      should.deepEqual(auth.accounts[0].weight, 1);
      const formattedKey = Numeric.stringToPublicKey(auth.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(permission1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(auth.keys[0].weight, 1);
    });

    it('should build a trx from a raw transaction and sign the tx', async () => {
      builder.testnet();
      builder.from(EosResources.updateAuthTransaction.serializedTransaction);
      builder.sign({ key: EosResources.accounts.account1.privateKey });
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.permission, permission1.name);
      const auth = json.actions[0].data.auth;
      should.deepEqual(auth.threshold, 1);
      should.deepEqual(auth.accounts[0].permission.actor, sender.name);
      should.deepEqual(auth.accounts[0].weight, 1);
      const formattedKey = Numeric.stringToPublicKey(auth.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(permission1.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(auth.keys[0].weight, 1);
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
        .updateAuthActionBuilder('eosio', [sender.name])
        .account(sender.name)
        .permission_name(permission1.name)
        .parent('active')
        .auth({
          threshold: 1,
          accounts: [
            {
              permission: {
                actor: sender.name,
                permission: 'active',
              },
              weight: 1,
            },
          ],
          keys: [
            {
              key: permission1.publicKey,
              weight: 1,
            },
          ],
          waits: [],
        });
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });
  });
});
