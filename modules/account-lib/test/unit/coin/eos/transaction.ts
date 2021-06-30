import should from 'should';
import { coins } from '@bitgo/statics';
import fetch from 'node-fetch';
import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Transaction } from '../../../../src/coin/eos/transaction';
import * as EosResources from '../../../resources/eos';
import { TransactionType } from '../../../../src/coin/baseCoin';

const signatureProvider = new JsSignatureProvider([EosResources.accounts.account1.privateKey]);
const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

describe('Eos Transaction', () => {
  let tx: Transaction;

  const sender = EosResources.accounts.account1;

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
  });

  describe('build transaction', () => {
    it('should build a transaction', async () => {
      try {
        await api.getAbi('eosio.token');
        const eosBuilder = api.buildTransaction();
        if (eosBuilder) {
          eosBuilder.with('eosio.token').as(sender.name).transfer(sender.name, 'bob', '1.0000 SYS', 'Some memo');
          await tx.build(eosBuilder);
          tx.setTransactionType(TransactionType.Send);
          const json = await tx.toJson();
          should.deepEqual(json.actions[0].data.from, sender.name);
          should.deepEqual(json.actions[0].data.to, 'bob');
          should.deepEqual(json.actions[0].data.quantity, '1.0000 SYS');
          should.deepEqual(json.actions[0].data.memo, 'Some memo');
        }
      } catch (error) {
        throw new Error(error);
      }
    });
  });
});
