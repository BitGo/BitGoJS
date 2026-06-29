import should from 'should';
import { V8TokenTransferBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { accounts, mockTssSignature } from '../../resources';
import { testnetV8Material } from '../../../src/resources';
import { buildTestConfig } from './base';

const FROM_DID = '0x1208d7851e6698249aea40742701ee1ef6cdcced260a7c49c1cca1a9db836342';
const TO_DID = '0xbc6f7ec808f361c1353ab9dc88c3cc54b98d9eb60fed9c063e67a40925b8ef61';
const ASSET_ID = '0x780602887b358cf48989d0d9aa6c8d28';

describe('V8TokenTransferBuilder', () => {
  describe('v8 material', () => {
    it('carries v8 specVersion and txVersion', () => {
      const builder = new V8TokenTransferBuilder(buildTestConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
    });
  });

  describe('factory method', () => {
    it('getV8TokenTransferBuilder returns a V8TokenTransferBuilder', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      should.ok(factory.getV8TokenTransferBuilder() instanceof V8TokenTransferBuilder);
    });
  });

  describe('build transaction', () => {
    const sender = accounts.account1;

    it('should build a v8 token transfer transaction with v8 specVersion in output', async () => {
      const builder = new V8TokenTransferBuilder(buildTestConfig())
        .assetId(ASSET_ID)
        .amount('1000000')
        .fromDID(FROM_DID)
        .toDID(TO_DID)
        .memo('0')
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
