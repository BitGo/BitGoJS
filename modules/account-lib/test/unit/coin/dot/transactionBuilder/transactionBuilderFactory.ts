import should from 'should';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { register } from '../../../../../src/index';
import {
  TransactionBuilderFactory,
  TransferBuilder,
  WalletInitializationBuilder,
  StakingBuilder,
  UnstakeBuilder,
} from '../../../../../src/coin/dot';
import * as dotResources from '../../../../resources/dot';
import { TestDotNetwork, TEST_NETWORK_DATA } from './base';

class StubTransactionBuilderFactory extends TransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    const testNetwork = { ..._coinConfig.network, ...TEST_NETWORK_DATA } as TestDotNetwork;
    super({ ..._coinConfig, network: testNetwork });
  }
}

describe('dot Transaction Builder Factory', () => {
  const factory = register('dot', StubTransactionBuilderFactory);
  const { rawTx } = dotResources;
  const sender = dotResources.accounts.account1;
  const sender2 = dotResources.accounts.account3;

  it('should parse an unsigned transfer txn and return a transfer builder', async () => {
    const builder = factory.from(rawTx.transfer.unsigned);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .version(7)
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.transfer.unsigned);
  });
  it('should parse a signed transfer txn and return a transfer builder', async () => {
    const builder = factory.from(rawTx.transfer.signed);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .version(7)
      .sender({ address: sender.address })
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.transfer.signed);
  });
  it('should parse an unsigned add proxy txn and return an Add Proxy builder', async () => {
    const builder = factory.from(rawTx.addProxy.unsigned);
    should(builder).instanceOf(WalletInitializationBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .version(7)
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.addProxy.unsigned);
  });

  it('should parse an signed add proxy txn and return an Add Proxy builder', async () => {
    const builder = factory.from(rawTx.addProxy.signed);
    should(builder).instanceOf(WalletInitializationBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .version(7)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.addProxy.signed);
  });

  it('should parse an unsigned proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.unsigned);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address })
      .version(7);
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.unsigned);
  });
  it('should parse a signed proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.signed);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender2.address })
      .version(7)
      .sign({ key: sender2.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.signed);
  });

  it('should parse an unsigned stake txn and return a stake builder', async () => {
    const builder = factory.from(rawTx.stake.unsigned);
    should(builder).instanceOf(StakingBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.stake.unsigned);
  });
  it('should parse a signed stake txn and return a stake builder', async () => {
    const builder = factory.from(rawTx.stake.signed);
    should(builder).instanceOf(StakingBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address })
      .version(7)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.stake.signed);
  });

  it('should parse an unsigned unstake txn and return an unstake builder', async () => {
    const builder = factory.from(rawTx.unstake.unsigned);
    should(builder).instanceOf(UnstakeBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.unstake.unsigned);
  });
  it('should parse a signed unstake txn and return an unstake builder', async () => {
    const builder = factory.from(rawTx.unstake.signed);
    should(builder).instanceOf(UnstakeBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address })
      .version(7)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.unstake.signed);
  });
});
