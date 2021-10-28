import { coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { ProxyBuilder } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';

describe('Dot Proxy Builder', () => {
  let builder: ProxyBuilder;

  const sender = DotResources.accounts.account3;
  const real = DotResources.accounts.account1;

  beforeEach(() => {
    const config = coins.get('dot');
    builder = new ProxyBuilder(config);
  });
  describe('setter validation', () => {
    it('should validate real address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.real('asd'),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.real(sender.address));
      assert.calledTwice(spy);
    });
  });

  describe('build proxy transaction', () => {
    it('should build a proxy transaction', async () => {
      builder
        .testnet()
        .real(real.address)
        .forceProxyType('Any')
        .call(DotResources.rawTx.proxy.transferCall)
        .sender(sender.address)
        .blockNumber(3933)
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .nonce(200)
        .tip(0)
        .transactionVersion(7)
        .eraPeriod(64);
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.real, real.address);
      should.deepEqual(txJson.forceProxyType, 'Any');
      should.deepEqual(txJson.call, DotResources.rawTx.proxy.transferCall);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned proxy transaction', async () => {
      builder
        .testnet()
        .real(real.address)
        .forceProxyType('Any')
        .call(DotResources.rawTx.proxy.transferCall)
        .sender(sender.address)
        .blockNumber(3933)
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .nonce(200)
        .tip(0)
        .transactionVersion(7)
        .eraPeriod(64);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.real, real.address);
      should.deepEqual(txJson.forceProxyType, 'Any');
      should.deepEqual(txJson.call, DotResources.rawTx.proxy.transferCall);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.testnet().from(DotResources.rawTx.proxy.signed);
      builder
        .blockNumber(3933)
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .transactionVersion(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.real, real.address);
      should.deepEqual(txJson.forceProxyType, 'Any');
      should.deepEqual(txJson.call, DotResources.rawTx.proxy.transferCall);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.testnet().from(DotResources.rawTx.proxy.unsigned);
      builder
        .blockNumber(3933)
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender(sender.address)
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.real, real.address);
      should.deepEqual(txJson.forceProxyType, 'Any');
      should.deepEqual(txJson.call, DotResources.rawTx.proxy.transferCall);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.blockHash, '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      should.deepEqual(txJson.genesisHash, '0x2b8d4fdbb41f4bc15b8a7ec8ed0687f2a1ae11e0fc2dc6604fa962a9421ae349');
      should.deepEqual(txJson.specVersion, 9100);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.eraPeriod, 64);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, 7);
      should.deepEqual(txJson.chainName, 'Polkadot');
    });
  });
});
