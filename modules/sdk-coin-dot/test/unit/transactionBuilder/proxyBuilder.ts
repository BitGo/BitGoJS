import should from 'should';
import { buildTestConfig } from './base';
import { accounts, rawTx, specVersion, txVersion, chainName, genesisHash, mockTssSignature } from '../../resources';
import { RemoveProxyBuilder } from '../../../src';
import { ProxyType } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';

describe('Dot Remove Proxy Builder', () => {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: RemoveProxyBuilder;
  const sender = accounts.account1;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new RemoveProxyBuilder(config).material(utils.getMaterial(config));
  });

  describe('build remove proxy transaction', () => {
    it('should build a remove proxy transaction', async () => {
      builder
        .owner({ address: accounts.stakingProxy.address })
        .type(ProxyType.STAKING)
        .delay('0')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, accounts.stakingProxy.address);
      should.deepEqual(txJson.proxyType, 'Staking');
      should.deepEqual(txJson.delay, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async () => {
      builder.from(rawTx.removeProxy.signed);
      builder.validity({ firstValid: 3933 }).referenceBlock(referenceBlock);

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, accounts.stakingProxy.address);
      should.deepEqual(txJson.proxyType, 'Staking');
      should.deepEqual(txJson.delay, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async () => {
      builder.from(rawTx.removeProxy.unsigned);
      builder.sender({ address: sender.address }).validity({ firstValid: 3933 }).referenceBlock(referenceBlock);

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.owner, accounts.stakingProxy.address);
      should.deepEqual(txJson.proxyType, 'Staking');
      should.deepEqual(txJson.delay, '0');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, chainName);
      should.deepEqual(txJson.eraPeriod, 64);
    });
  });
});
