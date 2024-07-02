import { TransactionType } from '@bitgo/sdk-core';
import assert from 'assert';
import should from 'should';
import {
  KeyPair,
  Transaction,
  TransferBuilder,
  Interface,
  BatchTransactionBuilder,
  StakingBuilder,
  UnstakeBuilder,
  WithdrawUnstakedBuilder,
} from '../../src';
import utils from '../../src/lib/utils';
import { rawTx, accounts, jsonTransactions } from '../resources';
import { buildTestConfig } from './transactionBuilder/base';
import { STAKING_DESTINATION } from '../../src/lib/transaction';

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
  const config = buildTestConfig();
  const material = utils.getMaterial(config);

  beforeEach(() => {
    tx = new StubTransaction(config);
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
      const builder = new TransferBuilder(config).material(material);
      builder.from(rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: accounts.account1.address });
      const tx = (await builder.build()) as Transaction;
      should.deepEqual(tx.transactionSize(), rawTx.transfer.unsigned.length / 2);
    });

    it('Should rebuild different hex if keepAlive is true or false for transferAll txs', async () => {
      const keepAliveFalseBuilder = new TransferBuilder(config).material(material);
      keepAliveFalseBuilder.from(rawTx.transferAll.unsignedKeepAliveFalse);
      keepAliveFalseBuilder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: accounts.account1.address });
      const keepAliveFalseTx = (await keepAliveFalseBuilder.build()).toJson();

      const keepAliveTrueBuilder = new TransferBuilder(config).material(material);
      keepAliveTrueBuilder.from(rawTx.transferAll.unsignedKeepAliveTrue);
      keepAliveTrueBuilder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: accounts.account1.address });
      const keepAliveTrueTx = (await keepAliveTrueBuilder.build()).toJson();

      should.notEqual(keepAliveFalseTx.id, keepAliveTrueTx.id);
      should.notEqual(keepAliveFalseTx.keepAlive, keepAliveTrueTx.keepAlive);
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

  describe('inputs and outputs', () => {
    it('should generate inputs and output for a batch staking transaction', async () => {
      const builder = new BatchTransactionBuilder(config).material(material);
      builder.from(rawTx.stake.batchAll.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');

      const tx = await builder.build();

      should(tx.inputs).not.be.null();
      should(tx.inputs.length).eql(2);

      // Staked amount
      should(tx.inputs[0].address).eql(accounts.account1.address);
      should(tx.inputs[0].value).eql('500000000000');
      should(tx.inputs[0].coin).eql('tdot');

      // Add proxy storage fee
      should(tx.inputs[1].address).eql(accounts.account1.address);
      should(tx.inputs[1].value).eql('1002050000000');
      should(tx.inputs[1].coin).eql('tdot');

      should(tx.outputs).not.be.null();
      should(tx.outputs.length).eql(2);

      // Staked amount
      should(tx.outputs[0].address).eql(STAKING_DESTINATION);
      should(tx.outputs[0].value).eql('500000000000');
      should(tx.outputs[0].coin).eql('tdot');

      // Add proxy storage fee
      should(tx.outputs[1].address).eql(accounts.stakingProxy.address);
      should(tx.outputs[1].value).eql('1002050000000');
      should(tx.outputs[1].coin).eql('tdot');
    });

    it('should generate inputs and output for a batch unstaking transaction', async () => {
      const builder = new BatchTransactionBuilder(config).material(material);
      builder.from(rawTx.unstake.batchAll.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');

      const tx = await builder.build();

      should(tx.inputs).not.be.null();
      should(tx.inputs.length).eql(1);

      // Remove proxy storage fee refund
      should(tx.inputs[0].address).eql(accounts.stakingProxy.address);
      should(tx.inputs[0].value).eql('1002050000000');
      should(tx.inputs[0].coin).eql('tdot');

      should(tx.outputs).not.be.null();
      should(tx.outputs.length).eql(1);

      // Remove proxy storage fee refund
      should(tx.outputs[0].address).eql(accounts.account1.address);
      should(tx.outputs[0].value).eql('1002050000000');
      should(tx.outputs[0].coin).eql('tdot');
    });

    it('should generate inputs and output for a stake more transaction', async () => {
      const builder = new StakingBuilder(config).material(material);
      builder.from(rawTx.stakeMore.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');

      const tx = await builder.build();

      should(tx.inputs).not.be.null();
      should(tx.inputs.length).eql(1);

      // Amount to add to stake
      should(tx.inputs[0].address).eql(accounts.account1.address);
      should(tx.inputs[0].value).eql('90034235235322');
      should(tx.inputs[0].coin).eql('tdot');

      should(tx.outputs).not.be.null();
      should(tx.outputs.length).eql(1);

      should(tx.outputs[0].address).eql(STAKING_DESTINATION);
      should(tx.outputs[0].value).eql('90034235235322');
      should(tx.outputs[0].coin).eql('tdot');
    });

    it('should generate inputs and output for an unstake transaction', async () => {
      const builder = new UnstakeBuilder(config).material(material);
      builder.from(rawTx.unstake.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');

      const tx = await builder.build();

      should(tx.inputs).not.be.null();
      should(tx.inputs.length).eql(0);

      should(tx.outputs).not.be.null();
      should(tx.outputs.length).eql(0);
    });

    it('should generate inputs and output for a withdraw staked transaction', async () => {
      const builder = new WithdrawUnstakedBuilder(config).material(material);
      builder.from(rawTx.withdrawUnbonded.signed);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');

      const tx = await builder.build();

      should(tx.inputs).not.be.null();
      should(tx.inputs.length).eql(0);

      should(tx.outputs).not.be.null();
      should(tx.outputs.length).eql(0);
    });
  });
});
