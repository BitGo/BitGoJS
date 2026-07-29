import should from 'should';
import { V8HexTransferBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { accounts, mockTssSignature } from '../../resources';
import { testnetV8Material } from '../../../src/resources';
import { buildTestConfig } from './base';

describe('V8HexTransferBuilder', () => {
  describe('v8 material', () => {
    it('carries v8 specVersion and txVersion', () => {
      const builder = new V8HexTransferBuilder(buildTestConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
    });
  });

  describe('factory method', () => {
    it('getV8HexTransferBuilder returns a V8HexTransferBuilder', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      should.ok(factory.getV8HexTransferBuilder() instanceof V8HexTransferBuilder);
    });
  });

  describe('memo encoding', () => {
    it('encodes memo in NEW (hex) format', () => {
      const builder = new V8HexTransferBuilder(buildTestConfig());
      builder.memo('56594');
      const memo = (builder as any)._memo as string;
      should.ok(memo.startsWith('0x'), `expected 0x-prefixed hex memo, got: ${memo}`);
      should.equal(memo.length, 66);
    });

    it('stores an already-encoded hex memo as-is', () => {
      const builder = new V8HexTransferBuilder(buildTestConfig());
      const encoded = '0x3536353934000000000000000000000000000000000000000000000000000000';
      builder.memo(encoded);
      should.equal((builder as any)._memo, encoded);
    });
  });

  describe('build transaction', () => {
    const sender = accounts.account1;
    const receiver = accounts.account2;

    it('should build a v8 hex transfer transaction', async () => {
      const builder = new V8HexTransferBuilder(buildTestConfig())
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('56594')
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
