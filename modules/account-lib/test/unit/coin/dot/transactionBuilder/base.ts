import { BaseCoin as CoinConfig, coins, DotNetwork, PolkadotSpecNameType } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import should from 'should';
import sinon, { assert } from 'sinon';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import { BaseKey } from '../../../../../src/coin/baseCoin/iface';
import { TransactionBuilder, Transaction } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';

export interface TestDotNetwork extends DotNetwork {
  genesisHash: string;
  specVersion: number;
  metadataRpc: `0x${string}`;
}

export const buildTestConfig = (): Readonly<CoinConfig> => {
  return coins.get('tdot');
};

class StubTransactionBuilder extends TransactionBuilder {
  protected validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    return;
  }
  protected buildTransaction(): UnsignedTransaction {
    throw new Error('Method not implemented.');
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

  getReferenceBlock(): string {
    return this._referenceBlock;
  }

  getSpecVersion(): number {
    return this._specVersion;
  }

  getTransactionVersion(): number {
    return this._transactionVersion;
  }

  getSpecName(): PolkadotSpecNameType {
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
    const config = buildTestConfig();
    builder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate sender address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.sender({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.sender({ address: sender.address }));
      assert.calledTwice(spy);
    });

    it('should validate eraPeriod', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.validity({ maxDuration: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.validity({ maxDuration: 64 }));
      assert.calledTwice(spy);
    });

    it('should validate nonce', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.sequenceId({ name: 'Nonce', keyword: 'nonce', value: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.sequenceId({ name: 'Nonce', keyword: 'nonce', value: 10 }));
      assert.calledTwice(spy);
    });

    it('should validate tip', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.fee({ amount: -1, type: 'tip' }),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.fee({ amount: 10, type: 'tip' }));
      assert.calledTwice(spy);
    });

    it('should validate blockNumber', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.validity({ firstValid: -1 }),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.validity({ firstValid: 10 }));
      assert.calledTwice(spy);
    });
  });

  describe('build base transaction', () => {
    it('should build validate base fields', async () => {
      builder
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .version(7);
      should.doesNotThrow(() => builder.validateTransaction(builder.getTransaction()));
    });

    it('should build a base transaction on testnet', async () => {
      should.deepEqual(builder.getSpecName(), 'westend');
      should.deepEqual(builder.getGenesisHash(), '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e');
      should.deepEqual(builder.getSpecVersion(), 9130);
      should.deepEqual(builder.getChainName(), 'Westend');
    });

    it('should build from raw signed tx', async () => {
      builder.from(DotResources.rawTx.transfer.signed);
      should.deepEqual(builder.getSender(), sender.address);
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), undefined);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(DotResources.rawTx.transfer.unsigned);
      should.deepEqual(
        builder.getReferenceBlock(),
        '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
      );
      should.deepEqual(builder.getTransactionVersion(), 7);
      should.deepEqual(builder.getNonce(), 200);
      should.deepEqual(builder.getEraPeriod(), 64);
      should.deepEqual(builder.getTip(), undefined);
    });
  });
});
