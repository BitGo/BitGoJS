import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionType } from '../../../../src/coin/baseCoin';
import { KeyPair, Transaction, TransferBuilder, Utils } from '../../../../src/coin/dot';
import { TxData } from '../../../../src/coin/dot/iface';
import utils from '../../../../src/coin/dot/utils';
import * as DotResources from '../../../resources/dot';
import { buildTestConfig } from './transactionBuilder/base';

class StubTransaction extends Transaction {
  private _txJson: TxData;

  setTxJson(json: TxData) {
    this._txJson = json;
  }

  toJson(): TxData {
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
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });

    it('should not sign', async () => {
      try {
        await tx.sign(new KeyPair({ prv: DotResources.accounts.account1.secretKey }));
      } catch (e) {
        should.equal(e.message, 'No transaction data to sign');
      }
    });
  });

  describe('sign transaction', () => {
    it('cannot sign - wrong account secret', () => {
      tx.sender(DotResources.accounts.account1.address);
      should.deepEqual(tx.canSign({ key: DotResources.accounts.account2.secretKey }), false);
    });

    it('can sign', () => {
      tx.sender(DotResources.accounts.account2.address);
      should.deepEqual(tx.canSign({ key: DotResources.accounts.account2.secretKey }), true);
    });

    it('can generate valid txHash from signed transaction', () => {
      const signedTx = DotResources.rawTx.transfer.westendSigned2;
      const txHash = Utils.default.getTxHash(signedTx);
      const expectedHash = '0x252e9b53c1d068c275ef4c9b5afcffb2df42859203be1305d148c0c1441a5b20';

      txHash.should.equal(expectedHash);
    });
  });

  describe('should build from raw unsigned tx', async () => {
    it('Transaction size validation', async () => {
      const builder = new TransferBuilder(coins.get('tdot')).material(material);
      builder.from(DotResources.rawTx.transfer.unsigned);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: DotResources.accounts.account1.address });
      const tx = (await builder.build()) as Transaction;
      should.deepEqual(tx.transactionSize(), DotResources.rawTx.transfer.unsigned.length / 2);
    });
  });

  describe('Dot Explain Transaction', () => {
    // let tx: StubTransaction;
    const sender = DotResources.accounts.account1;
    const receiver = DotResources.accounts.account3;

    it('should explain a transfer transaction', async () => {
      const json = JSON.parse(DotResources.jsonTransactions.transfer) as TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.Send);
      const explain = tx.explainTransaction();
      explain.id.should.equal('0xecb860905342cf985b39276a07d6e6696746de4623c07df863f69cba153f939a');
      explain.outputAmount.should.equal('1000000000000');
      explain.outputs[0].amount.should.equal('1000000000000');
      explain.outputs[0].address.should.equal(DotResources.accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });

    it('should explain a proxy transfer transaction', async () => {
      const json = JSON.parse(DotResources.jsonTransactions.proxyTransfer) as TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.Send);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('90034235235322');
      explain.outputs[0].amount.should.equal('90034235235322');
      explain.outputs[0].address.should.equal(DotResources.accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
      explain.owner?.should.equal(sender.address);
      explain.forceProxyType?.should.equal('Any');
    });

    it('should explain a address initialization transaction', async () => {
      const json = JSON.parse(DotResources.jsonTransactions.walletInitialization) as TxData;
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
      const json = JSON.parse(DotResources.jsonTransactions.staking) as TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingActivate);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(DotResources.accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingActivate);
      explain.payee?.should.equal('Staked');
    });

    it('should explain a staking transaction with receiver account', async () => {
      const json = JSON.parse(DotResources.jsonTransactions.stakingPayee) as TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingActivate);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(DotResources.accounts.account2.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingActivate);
      explain.payee?.should.equal(DotResources.accounts.account2.address);
    });

    it('should explain a staking unlock transaction', async () => {
      const json = JSON.parse(DotResources.jsonTransactions.unstaking) as TxData;
      tx.setTxJson(json);
      tx.transactionType(TransactionType.StakingUnlock);
      const explain = tx.explainTransaction();
      explain.outputAmount.should.equal('50000000000000');
      explain.outputs[0].amount.should.equal('50000000000000');
      explain.outputs[0].address.should.equal(DotResources.accounts.account1.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.StakingUnlock);
    });
  });
});
