import should from 'should';
import sinon, { assert } from 'sinon';
import { WalletInitializationBuilder } from '../../../../../src/coin/dot';
import * as DotResources from '../../../../resources/dot';
import { buildTestConfig } from './base';

describe('Dot Add Proxy Builder', () => {
  let builder: WalletInitializationBuilder;

  const sender = DotResources.accounts.account1;
  const receiver = DotResources.accounts.account3;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new WalletInitializationBuilder(config);
  });
  describe('setter validation', () => {
    it('should validate delay', () => {
      const spy = sinon.spy(builder, 'validateValue');
      should.throws(
        () => builder.delay('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero',
      );
      should.doesNotThrow(() => builder.delay('0'));
      assert.calledTwice(spy);
    });

    it('should validate owner address', () => {
      const spy = sinon.spy(builder, 'validateAddress');
      should.throws(
        () => builder.owner({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`,
      );
      should.doesNotThrow(() => builder.owner({ address: sender.address }));
      assert.calledTwice(spy);
    });
  });

  describe('build addProxy transaction', () => {
    it('should build a addProxy transaction', async () => {
      builder
        .owner({ address: receiver.address })
        .type('Any')
        .delay('0')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .tip({ amount: 0, type: 'tip' })
        .version(7);
      builder.sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, receiver.address);
      should.deepEqual(txJson.proxyType, 'Any');
      should.deepEqual(txJson.delay, '0');
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

    it('should build an unsigned addProxy transaction', async () => {
      builder
        .owner({ address: receiver.address })
        .type('Any')
        .delay('0')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .tip({ amount: 0, type: 'tip' })
        .version(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, receiver.address);
      should.deepEqual(txJson.proxyType, 'Any');
      should.deepEqual(txJson.delay, '0');
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
      builder.from(DotResources.rawTx.addProxy.signed);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .version(7);
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, receiver.address);
      should.deepEqual(txJson.proxyType, 'Any');
      should.deepEqual(txJson.delay, '0');
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
      builder.from(DotResources.rawTx.addProxy.unsigned);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .blockHash('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, receiver.address);
      should.deepEqual(txJson.proxyType, 'Any');
      should.deepEqual(txJson.delay, '0');
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
