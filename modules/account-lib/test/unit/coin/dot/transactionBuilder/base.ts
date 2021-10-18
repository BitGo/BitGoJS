import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import should from 'should';
import sinon, { assert } from 'sinon';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { BaseKey } from '../../../../../src/coin/baseCoin/iface';
import { specNameType } from '../../../../../src/coin/dot/iface';
import { Transaction } from '../../../../../src/coin/dot/transaction';
import { TransactionBuilder } from '../../../../../src/coin/dot/transactionBuilder';
import * as DotResources from '../../../../resources/dot';

class StubTransactionBuilder extends TransactionBuilder {
  protected buildDotTxn(): UnsignedTransaction {
    throw new Error('Method not implemented.');
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  getSender(): string {
    return this._sender;
  }

  getGenesisHash(): string {
    return this._genesisHash;
  }

  getBlockNumber(): number {
    return this._blockNumber;
  }

  getBlockHash(): string {
    return this._blockHash;
  }

  getSpecVersion(): number {
    return this._specVersion;
  }

  getTransactionVersion(): number {
    return this._transactionVersion;
  }

  getSpecName(): specNameType {
    return this._specName;
  }

  getChainName(): string {
    return this._chainName;
  }

  getNonce(): number {
    return this._nonce;
  }

  getTip(): number | undefined {
    return this._tip;
  }

  getEraPeriod(): number | undefined {
    return this._eraPeriod;
  }

  buildImplementation(): Promise<Transaction> {
    return super.buildImplementation();
  }

  fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  protected get transactionType(): TransactionType {
    throw new Error('Method not implemented.');
  }

  getTransaction(): Transaction {
    return this._transaction;
  }
}

describe('Dot Transfer Builder', () => {
  let builder: StubTransactionBuilder;

  const sender = DotResources.accounts.account1;

  beforeEach(() => {
    const config = coins.get('dot');
    builder = new StubTransactionBuilder(config);
  });
  describe('setter validation', () => {
    it('should validate sender address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.sender('asd'),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.sender(sender.address));
      assert.calledTwice(spy);
    });

    it('should validate eraPeriod', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.eraPeriod(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.eraPeriod(64));
      assert.calledTwice(spy);
    });

    it('should validate nonce', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.nonce(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.nonce(10));
      assert.calledTwice(spy);
    });

    it('should validate tip', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.tip(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.tip(10));
      assert.calledTwice(spy);
    });

    it('should validate blockNumber', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.blockNumber(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.blockNumber(10));
      assert.calledTwice(spy);
    });
  });

  describe('build base transaction', () => {
    it('should build validate base fields', async () => {
      builder
        .testnet()
        .sender(sender.address)
        .blockNumber(3933)
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .nonce(200)
        .tip(0)
        .transactionVersion(7)
        .eraPeriod(64);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });

    it('should build a base transaction on testnet', async () => {
      builder.testnet();
      should.deepEqual(builder.getSpecName(), 'polkadot');
      should.deepEqual(builder.getGenesisHash(), '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(builder.getSpecVersion(), 9100);
      should.deepEqual(builder.getChainName(), 'Polkadot');
    });

    it('should build from raw signed tx', async () => {
      builder.testnet().from(DotResources.rawTx.transfer.signed);
      should.deepEqual(builder.getSender(), sender.address);
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), 0);
    });

    it('should build from raw unsigned tx', async () => {
      builder.testnet().from(DotResources.rawTx.transfer.unsigned);
      should.deepEqual(builder.getBlockHash(), '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(builder.getTransactionVersion(), 7);
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), 0);
    });
  });
});
