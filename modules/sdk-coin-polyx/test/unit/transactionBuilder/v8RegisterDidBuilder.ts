import should from 'should';
import { decode } from '@substrate/txwrapper-polkadot';
import { V8RegisterDidBuilder, TransactionBuilderFactory, SingletonRegistry, utils } from '../../../src/lib';
import { accounts, mockTssSignature } from '../../resources';
import { testnetV8Material } from '../../../src/resources';
import { buildTestConfig } from './base';

describe('V8RegisterDidBuilder', () => {
  describe('v8 material', () => {
    it('carries v8 specVersion and txVersion', () => {
      const builder = new V8RegisterDidBuilder(buildTestConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
    });
  });

  describe('factory method', () => {
    it('getV8RegisterDidBuilder returns a V8RegisterDidBuilder', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      should.ok(factory.getV8RegisterDidBuilder() instanceof V8RegisterDidBuilder);
    });
  });

  describe('build transaction', () => {
    const sender = accounts.cddProvider;
    const target = accounts.account1;

    it('should build a v8 DID registration transaction with v8 specVersion in output', async () => {
      const builder = new V8RegisterDidBuilder(buildTestConfig())
        .to({ address: target.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.specVersion, testnetV8Material.specVersion);
      should.deepEqual(txJson.transactionVersion, testnetV8Material.txVersion);
    });

    it('encodes identity.registerDid (0x0718), not the v7 cddRegisterDidWithCdd (0x0714)', async () => {
      const builder = new V8RegisterDidBuilder(buildTestConfig())
        .to({ address: target.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();

      const methodHex = (tx as any)._substrateTransaction.method as string;
      should.equal(methodHex.slice(2, 6), '0718');

      const v8Material = utils.getV8Material(buildTestConfig().network.type);
      const registry = SingletonRegistry.getInstance(v8Material);
      const decoded = decode(tx.toBroadcastFormat(), {
        metadataRpc: v8Material.metadata,
        registry,
      });
      should.equal(decoded.method.name, 'registerDid');
    });

    it('should build from raw signed v8 tx and decode back to the target address', async () => {
      const builder = new V8RegisterDidBuilder(buildTestConfig())
        .to({ address: target.address })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const built = await builder.build();
      const rawSigned = built.toBroadcastFormat();

      const roundTrip = new V8RegisterDidBuilder(buildTestConfig());
      roundTrip.from(rawSigned);
      roundTrip
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await roundTrip.build();
      const txJson = tx.toJson();

      should.deepEqual(txJson.to, target.address);
      should.deepEqual(txJson.amount, '0');
    });
  });
});
