import should from 'should';
import sinon, { assert } from 'sinon';
import { AnonymousAddressInitializationBuilder } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';
import { buildTestConfig } from './base';
import { ProxyType } from '../../../../../src/coin/dot/iface';

describe('Dot Add Anonymous Proxy Builder', () => {
  let builder: AnonymousAddressInitializationBuilder;
  const sender = DotResources.accounts.account1;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new AnonymousAddressInitializationBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate index', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.index(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.index(0));
      assert.calledTwice(spy);
    });
    it('should validate delay', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.delay(-1),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.delay(0));
      assert.calledTwice(spy);
    });
  });

  describe('build anonymous proxy creation transaction', () => {
    it('should build an anonymous proxy transaction', async () => {
      builder
        .type(ProxyType.ANY)
        .delay(0)
        .index(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .version(7);
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.proxyType, ProxyType.ANY);
      should.deepEqual(txJson.delay, '0');
      should.deepEqual(txJson.index, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned anonymous proxy transaction', async () => {
      builder
        .type(ProxyType.ANY)
        .delay(0)
        .index(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .version(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.proxyType, ProxyType.ANY);
      should.deepEqual(txJson.delay, '0');
      should.deepEqual(txJson.index, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });
});
