import should from 'should';
import { V8PreApproveAssetBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { accounts, mockTssSignature } from '../../resources';
import { testnetV8Material } from '../../../src/resources';
import { buildTestConfig } from './base';

const ASSET_ID = '0x780602887b358cf48989d0d9aa6c8d28';

describe('V8PreApproveAssetBuilder', () => {
  describe('v8 material', () => {
    it('carries v8 specVersion and txVersion', () => {
      const builder = new V8PreApproveAssetBuilder(buildTestConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
    });
  });

  describe('factory method', () => {
    it('getV8PreApproveAssetBuilder returns a V8PreApproveAssetBuilder', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      should.ok(factory.getV8PreApproveAssetBuilder() instanceof V8PreApproveAssetBuilder);
    });
  });

  describe('build transaction', () => {
    const sender = accounts.account1;

    it('should build a v8 pre-approve asset transaction with v8 specVersion in output', async () => {
      const builder = new V8PreApproveAssetBuilder(buildTestConfig())
        .assetId(ASSET_ID)
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
  });
});
