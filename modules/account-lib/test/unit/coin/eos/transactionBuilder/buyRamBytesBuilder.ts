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

describe('Eos BuyRamBytes builder', () => {
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
            .buyRamBytesActionBuilder('eosio', [sender.name])
            .payer(sender.name)
            .receiver(receiver.name)
            .bytes(8192);
        const tx = await builder.build();
        const json = await tx.toJson();
        should.deepEqual(json.actions[0].data.payer, sender.name);
        should.deepEqual(json.actions[0].data.receiver, 'david');
        should.deepEqual(json.actions[0].data.bytes, 8192);
        should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
        should.deepEqual(
            tx.toBroadcastFormat().serializedTransaction,
            EosResources.buyRamBytesTransaction.serializedTransaction,
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
            .buyRamBytesActionBuilder('eosio', [sender.name])
            .payer(sender.name)
            .receiver(receiver.name)
            .bytes(8192)
            builder.sign({ key: EosResources.accounts.account3.privateKey });
            const tx = await builder.build();
            const json = await tx.toJson();
            should.deepEqual(json.actions[0].data.payer, sender.name);
            should.deepEqual(json.actions[0].data.receiver, 'david');
            should.deepEqual(json.actions[0].data.bytes, 8192);
            should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey, EosResources.accounts.account3.publicKey]), true);
            should.deepEqual(
                tx.toBroadcastFormat().serializedTransaction,
                EosResources.buyRamBytesTransaction.serializedTransaction,
            );
        });

        it('should build a trx from a raw transaction', async () => {
            builder.testnet();
            builder.from(EosResources.buyRamBytesTransaction.serializedTransaction);
            const tx = await builder.build();
            const json = await tx.toJson();
            should.deepEqual(json.actions[0].data.payer, sender.name);
            should.deepEqual(json.actions[0].data.receiver, 'david');
            should.deepEqual(json.actions[0].data.bytes, 8192);
            should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
            should.deepEqual(
                tx.toBroadcastFormat().serializedTransaction,
                EosResources.buyRamBytesTransaction.serializedTransaction,
            );
        });

        it('should build a trx from a raw transaction and sign the tx', async () => {
            builder.testnet();
            builder.from(EosResources.buyRamBytesTransaction.serializedTransaction);
            builder.sign({ key: EosResources.accounts.account1.privateKey });
            const tx = await builder.build();
            const json = await tx.toJson();
            should.deepEqual(json.actions[0].data.payer, sender.name);
            should.deepEqual(json.actions[0].data.receiver, 'david');
            should.deepEqual(json.actions[0].data.bytes, 8192);
            should.deepEqual(builder.getTransaction().verifySignature([sender.publicKey]), true);
            should.deepEqual(
                tx.toBroadcastFormat().serializedTransaction,
                EosResources.buyRamBytesTransaction.serializedTransaction,
            );
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
            .buyRamBytesActionBuilder('eosio', [sender.name])
            .payer(sender.name)
            .receiver(receiver.name)
            .bytes(8192)
            should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
        });
    });
});
