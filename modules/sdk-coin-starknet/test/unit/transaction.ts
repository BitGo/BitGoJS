import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';
import { Accounts, rawTx } from '../resources/starknet';

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
    it('should return Starknet RPC-ready JSON string', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.unsigned);

      const payload = tx.toBroadcastFormat();
      should.exist(payload);
      const parsed = JSON.parse(payload);
      parsed.type.should.equal('INVOKE');
      parsed.version.should.equal('0x3');
      parsed.should.have.property('sender_address');
      parsed.sender_address.should.equal(Accounts.account1.address);
      parsed.calldata.should.be.Array().and.not.empty();
      parsed.calldata[0].should.equal('0x1');
      parsed.should.have.property('nonce');
      parsed.resource_bounds.should.have.properties(['l2_gas', 'l1_gas', 'l1_data_gas']);
      parsed.resource_bounds.l2_gas.should.have.properties(['max_amount', 'max_price_per_unit']);
      parsed.nonce_data_availability_mode.should.equal('L1');
      parsed.fee_data_availability_mode.should.equal('L1');
    });
  });

  describe('toInternalHex', () => {
    it('should produce hex-encoded internal JSON', async () => {
      const coinConfig = coins.get('starknet');
      const tx = new Transaction(coinConfig);
      await tx.fromRawTransaction(rawTx.transfer.unsigned);

      const hex = tx.toInternalHex();
      should.exist(hex);
      const json = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'));
      json.should.have.property('senderAddress');
      json.should.have.property('calls');
      json.should.have.property('chainId');
      json.should.have.property('transactionType');
    });
  });
});
