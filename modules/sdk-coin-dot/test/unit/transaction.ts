import { TransactionType } from '@bitgo/sdk-core';
import assert from 'assert';
import should from 'should';
import { KeyPair, Transaction, TransferBuilder, Interface } from '../../src';
import utils from '../../src/lib/utils';
import { rawTx, accounts, jsonTransactions } from '../resources';
import { buildTestConfig } from './transactionBuilder/base';

class StubTransaction extends Transaction {
  private _txJson: Interface.TxData;

  setTxJson(json: Interface.TxData) {
    this._txJson = json;
  }

  toJson(): Interface.TxData {
    if (this._txJson) {
      return this._txJson;
    }
    return super.toJson();
  }
}

describe('Dot Transaction', () => {
  let tx: StubTransaction;

  beforeEach(() => {
    tx = new StubTransaction(buildTestConfig());
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      assert.throws(() => tx.toJson(), /Empty transaction/);
      assert.throws(() => tx.toBroadcastFormat(), /Empty transaction/);
    });

    it('should not sign', async () => {
      try {
        tx.sign(new KeyPair({ prv: accounts.account1.secretKey }));
      } catch (e) {
        should.equal(e.message, 'No transaction data to sign');
      }
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - wrong account secret', () => {
      tx.sender(accounts.account1.address);
      should.deepEqual(tx.canSign({ key: accounts.account2.secretKey }), false);
    });

    it('can sign', () => {
      tx.sender(accounts.account2.address);
      should.deepEqual(tx.canSign({ key: accounts.account2.secretKey }), true);
    });

    it('can generate valid txHash from signed transaction', () => {
      const signedTx = rawTx.transfer.westendSigned2;
      const txHash = utils.getTxHash(signedTx);
      const expectedHash = '0x252e9b53c1d068c275ef4c9b5afcffb2df42859203be1305d148c0c1441a5b20';

      txHash.should.equal(expectedHash);
    });
  });

  describe('should build from raw unsigned tx', async () => {
    it('Transaction size validation', async () => {
      const builder = new TransferBuilder(buildTestConfig()).material(utils.getMaterial(buildTestConfig()));
      builder.from(rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: accounts.account1.address });
      const tx = (await builder.build()) as Transaction;
      should.deepEqual(tx.transactionSize(), rawTx.transfer.unsigned.length / 2);
    });
  });

  describe('Dot Explain Transaction', () => {
    // let tx: StubTransaction;
    const sender = accounts.account1;
    const receiver = accounts.account3;

    it('should explain a transfer transaction', async () => {
      const json = JSON.parse(jsonTransactions.transfer) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.Send);
      const explain = tx.explainTransaction();
      explain.id.should.equal('0xecb860905342cf985b39276a07d6e6696746de4623c07df863f69cba153f939a');
      explain.outputAmount.should.equal('1000000000000');
      explain.outputs[0].amount.should.equal('1000000000000');
      explain.outputs[0].address.should.equal(accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });

    it('should explain a proxy transfer transaction', async () => {
      const json = JSON.parse(jsonTransactions.proxyTransfer) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.Send);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('90034235235322');
      explain.outputs[0].amount.should.equal('90034235235322');
      explain.outputs[0].address.should.equal(accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
      explain.owner?.should.equal(sender.address);
      explain.forceProxyType?.should.equal('Any');
    });

    it('should explain a address initialization transaction', async () => {
      const json = JSON.parse(jsonTransactions.walletInitialization) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.AddressInitialization);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('0');
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.AddressInitialization);
      explain.owner?.should.equal(receiver.address);
      explain.proxyType?.should.equal('Any');
      explain.delay?.should.equal('0');
    });

    it('should explain a staking transaction', async () => {
      const json = JSON.parse(jsonTransactions.staking) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingActivate);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingActivate);
      explain.payee?.should.equal('Staked');
    });

    it('should explain a staking transaction with receiver account', async () => {
      const json = JSON.parse(jsonTransactions.stakingPayee) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingActivate);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingActivate);
      explain.payee?.should.equal(accounts.account2.address);
    });

    it('should explain a staking unlock transaction', async () => {
      const json = JSON.parse(jsonTransactions.unstaking) as Interface.TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingUnlock);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(accounts.account1.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingUnlock);
    });
  });
});
