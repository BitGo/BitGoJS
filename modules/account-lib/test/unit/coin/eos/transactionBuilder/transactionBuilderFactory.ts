import { Numeric } from 'eosjs';
import should from 'should';
import { register } from '../../../../../src';
import { TransactionBuilderFactory } from '../../../../../src/coin/eos';
import * as EosResources from '../../../../resources/eos';

describe('Eos Transaction Builder factory', () => {
  const factory = register('eos', TransactionBuilderFactory);
  const sender = EosResources.accounts.account1;
  const receiver = EosResources.accounts.account2;
  const receiver2 = EosResources.accounts.account3;
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

    it('should not build a transfer transaction', async () => {
      const builder = factory.getTransferBuilder()
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

    it('should build a multi action transaction', async () => {
      const builder = factory.getWalletInitializationBuilder()
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });

      builder
        .newAccountActionBuilder('eosio', [sender.name])
        .creator(sender.name)
        .name('mynewaccount')
        .owner({threshold:1, keys:[{key: sender.publicKey, weight:1}], accounts:[], waits:[]})
        .active({threshold:1, keys:[{key: receiver.publicKey, weight:1}], accounts:[], waits:[]})
      
      builder
        .buyRamBytesActionBuilder('eosio', [sender.name])
        .payer(sender.name)
        .receiver(receiver2.name)
        .bytes(8192);  
      
      builder  
        .stakeActionBuilder('eosio', [sender.name])
        .from(sender.name)
        .receiver(receiver2.name)
        .stake_net_quantity('1.0000 SYS')
        .stake_cpu_quantity('1.0000 SYS')
        .transfer(false);

      const tx = await builder.build();
      const json = await tx.toJson();

      should.deepEqual(json.actions[0].data.creator, sender.name);
      should.deepEqual(json.actions[0].data.name, 'mynewaccount');
      const formattedKey = Numeric.stringToPublicKey(json.actions[0].data.owner.keys[0].key).data;
      const expectedFormattedKey = Numeric.stringToPublicKey(sender.publicKey).data;
      should.deepEqual(formattedKey, expectedFormattedKey);
      should.deepEqual(json.actions[1].data.payer, sender.name);
      should.deepEqual(json.actions[1].data.receiver, 'kerry');
      should.deepEqual(json.actions[1].data.bytes, 8192);
      should.deepEqual(json.actions[2].data.from, sender.name);
      should.deepEqual(json.actions[2].data.receiver, 'kerry');
      should.deepEqual(json.actions[2].data.stake_net_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.stake_cpu_quantity, '1.0000 SYS');
      should.deepEqual(json.actions[2].data.transfer, false);
      should.deepEqual(
      tx.toBroadcastFormat().serializedTransaction,
      EosResources.WalletInitializationTransaction.serializedTransaction,
    );
    });

    it('should build a transaction', async () => {
      const builder = factory.getEosTransactionBuilder()
      builder
        .testnet()
        .expiration('2019-09-19T16:39:15')
        .refBlockNum(100)
        .refBlockPrefix(100)
        .sign({ key: sender.privateKey });
      builder
        .buyRamBytesActionBuilder('eosio', [sender.name])
        .payer(sender.name)
        .receiver(receiver.name)
        .bytes(8192);
      const tx = await builder.build();
      const json = await tx.toJson();
      should.deepEqual(json.actions[0].data.payer, sender.name);
      should.deepEqual(json.actions[0].data.receiver, 'david');
      should.deepEqual(json.actions[0].data.bytes, 8192);
      should.deepEqual(
      tx.toBroadcastFormat().serializedTransaction,
      EosResources.buyRamBytesTransaction.serializedTransaction,
      );
      });
  });
});
