import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eos/transaction';
import { KeyPair } from '../../../../src/coin/eos';
import * as EosResources from '../../../resources/eos';
// import { TransactionType } from '../../../../src/coin/baseCoin';
// import { initApi } from '../../../../src/coin/eos/utils';

// const signatureProvider = new JsSignatureProvider([EosResources.accounts.account1.privateKey]);
// const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
// const api = initApi('2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840');

describe('Eos Transaction', () => {
  let tx: Transaction;

  // const sender = EosResources.accounts.account1;
  // const receiver = EosResources.accounts.account2;
  beforeEach(() => {
    const config = coins.get('eos');
    tx = new Transaction(config);
    tx.blocksBehind(3);
    tx.expireSeconds(30);
  });

  describe('empty transaction', async () => {
    it('should throw empty transaction', async () => {
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
      try {
        await tx.toJson();
      } catch (error) {
        should.equal(error.message, 'Empty transaction');
      }
    });

    it('should not sign', () => {
      should.throws(
        () => tx.sign([new KeyPair({ prv: EosResources.accounts.account1.privateKey })]),
        'Empty transaction',
      );
    });
  });

  // describe('sign transaction', () => {
  //   it('cannot sign - no signer required', () => {
  //     should.deepEqual(tx.canSign({ key: 'some' }), false);
  //   });

  //   it('cannot sign - wrong account secret', () => {
  //     tx.sender(AlgoResources.accounts.account1.address);
  //     should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), false);
  //   });

  //   it('can sign', () => {
  //     tx.setNumberOfRequiredSigners(1);
  //     tx.sender(AlgoResources.accounts.account2.address);
  //     should.deepEqual(tx.canSign({ key: AlgoResources.accounts.account2.secretKey.toString('hex') }), true);
  //   });
  // });

  // describe('build transaction', () => {
  //   it('should build a transaction', async () => {
  //     try {
  //       await api.getAbi('eosio.token');
  //       const eosBuilder = api.buildTransaction();
  //       if (eosBuilder) {
  //         eosBuilder
  //           .with('eosio.token')
  //           .as(sender.name)
  //           .transfer(sender.name, receiver.name, '1.0000 SYS', 'Some memo');
  //         await tx.build(eosBuilder);
  //         tx.setTransactionType(TransactionType.Send);
  //         const json = await tx.toJson();
  //         should.deepEqual(json.actions[0].data.from, sender.name);
  //         should.deepEqual(json.actions[0].data.to, 'david');
  //         should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
  //         should.deepEqual(json.actions[0].data.memo, 'Some memo');
  //       }
  //     } catch (error) {
  //       throw new Error(error);
  //     }
  //   });
  // });
});
