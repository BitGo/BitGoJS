import should from 'should';
import { register } from '../../../../../src/index';
import {
  TransactionBuilderFactory,
  TransferBuilder,
  AddProxyBuilder,
  ProxyBuilder,
  StakeBuilder,
} from '../../../../../src/coin/dot';
import * as dotResources from '../../../../resources/dot';

describe('dot Transaction Builder Factory', () => {
  const factory = register('algo', TransactionBuilderFactory);
  const { rawTx } = dotResources;
  const sender = dotResources.accounts.account1;
  const sender2 = dotResources.accounts.account3;

  it('should parse an unsigned transfer txn and return a transfer builder', async () => {
    const builder = factory.from(rawTx.transfer.unsigned);
    should(builder).instanceOf(TransferBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .transactionVersion(7)
      .sender(sender.address);
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.transfer.unsigned);
  });
  it('should parse a signed transfer txn and return a transfer builder', async () => {
    const builder = factory.from(rawTx.transfer.signed);
    should(builder).instanceOf(TransferBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .transactionVersion(7)
      .sender(sender.address)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.transfer.signed);
  });
  it('should parse an unsigned add proxy txn and return an Add Proxy builder', async () => {
    const builder = factory.from(rawTx.addProxy.unsigned);
    should(builder).instanceOf(AddProxyBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .transactionVersion(7)
      .sender(sender.address);
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.addProxy.unsigned);
  });

  it('should parse an signed add proxy txn and return an Add Proxy builder', async () => {
    const builder = factory.from(rawTx.addProxy.signed);
    should(builder).instanceOf(AddProxyBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .transactionVersion(7)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.addProxy.signed);
  });

  it('should parse an unsigned proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.unsigned);
    should(builder).instanceOf(ProxyBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender(sender.address)
      .transactionVersion(7);
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.unsigned);
  });
  it('should parse a signed proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.signed);
    should(builder).instanceOf(ProxyBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender(sender2.address)
      .transactionVersion(7)
      .sign({ key: sender2.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.signed);
  });

  it('should parse an unsigned stake txn and return a stake builder', async () => {
    const builder = factory.from(rawTx.stake.unsigned);
    should(builder).instanceOf(StakeBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender(sender.address);
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.stake.unsigned);
  });
  it('should parse a signed stake txn and return a stake builder', async () => {
    const builder = factory.from(rawTx.stake.signed);
    should(builder).instanceOf(StakeBuilder);
    builder
      .testnet()
      .validity({ firstValid: 3933 })
      .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender(sender.address)
      .transactionVersion(7)
      .sign({ key: sender.secretKey });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.stake.signed);
  });
});
