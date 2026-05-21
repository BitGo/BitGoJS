import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';
import { rawTx, Accounts } from '../resources/starknet';

describe('Starknet Transaction', () => {
  describe('Parse unsigned transaction', () => {
    it('should parse unsigned transfer hex and extract correct fields', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.unsigned);

      const json = tx.toJson();
      json.sender.should.equal(Accounts.account1.address);
      should.exist(json.amount);
    });
  });

  describe('Parse signed transaction', () => {
    it('should parse signed transfer hex and extract correct fields', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.signed);

      const json = tx.toJson();
      json.sender.should.equal(Accounts.account1.address);
      should.exist(json.amount);
    });
  });

  describe('Transaction Explanation', () => {
    it('should explain a parsed transaction', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.signed);

      const exp = tx.explainTransaction();
      should.exist(exp);
      should.exist(exp.outputs);
      exp.outputs.length.should.be.greaterThan(0);
    });
  });

  describe('toBroadcastFormat', () => {
    it('should produce non-empty broadcast format for unsigned tx', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.unsigned);

      const payload = tx.toBroadcastFormat();
      should.exist(payload);
      payload.length.should.be.greaterThan(0);
    });
  });
});
