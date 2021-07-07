import { Numeric } from 'eosjs';
import should from 'should';
import { register } from '../../../../../src';
import { TransactionBuilderFactory } from '../../../../../src/coin/eos';
import * as EosResources from '../../../../resources/eos';

describe('Eos Transaction Builder factory', () => {
  const factory = register('eos', TransactionBuilderFactory);
  const sender = EosResources.accounts.account1;
  const { permission1 } = EosResources.permission;
  describe('serialized transactions', () => {
    it('should parse a transfer transaction', async () => {
      const builder = factory.from(EosResources.tranferTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.to, 'david');
      should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.memo, 'Some memo');
    });

    it('should parse a stake transaction', async () => {
      const builder = factory.from(EosResources.stakeTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.transfer, false);
    });

    it('should parse an unstake transaction', async () => {
      const builder = factory.from(EosResources.unstakeTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.from, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.unstake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[0].data.unstake_cpu_quantity, '1.0000 SYS');
    });

    it('should parse an updateauth transaction', async () => {
      const builder = factory.from(EosResources.updateAuthTransaction.serializedTransaction);
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

    it('should parse an delete transaction', async () => {
      const builder = factory.from(EosResources.deleteAuthTransaction.serializedTransaction);
      builder.from(EosResources.deleteAuthTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.permission, permission1.name);
    });

    it('should parse a link auth transaction', async () => {
      const builder = factory.from(EosResources.linkAuthTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
      should.deepEqual(json.actions[0].data.requirement, permission1.requirement);
    });

    it('should parse an unlink auth transaction', async () => {
      const builder = factory.from(EosResources.unlinkAuthTransaction.serializedTransaction);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.account, sender.name);
      should.deepEqual(json.actions[0].data.code, sender.name);
      should.deepEqual(json.actions[0].data.type, permission1.type);
    });
  });
});
