import should from 'should';
import { V8TransferBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { utils } from '../../../src';
import { accounts, mockTssSignature } from '../../resources';
import { testnetMaterial, testnetV8Material, mainnetV8Material } from '../../../src/resources';
import { buildTestConfig, buildMainnetConfig } from './base';

describe('V8TransferBuilder', () => {
  describe('v8 material', () => {
    it('testnet builder uses v8 specVersion and txVersion', () => {
      const config = buildTestConfig();
      const builder = new V8TransferBuilder(config);
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
      should.equal(material.chainName, testnetV8Material.chainName);
    });

    it('mainnet builder uses v8 specVersion and txVersion', () => {
      const config = buildMainnetConfig();
      const builder = new V8TransferBuilder(config);
      const material = (builder as any)._material;
      should.equal(material.specVersion, mainnetV8Material.specVersion);
      should.equal(material.txVersion, mainnetV8Material.txVersion);
    });

    it('v8 specVersion is greater than v7 specVersion', () => {
      const config = buildTestConfig();
      const v7Material = utils.getMaterial(config.network.type);
      const v8Material = utils.getV8Material(config.network.type);
      should.ok(
        v8Material.specVersion > v7Material.specVersion,
        `expected v8 (${v8Material.specVersion}) > v7 (${v7Material.specVersion})`
      );
    });

    it('testnet v8 metadata bytes differ from v7 (real chain metadata, not placeholder)', () => {
      should.notEqual(testnetV8Material.metadata, testnetMaterial.metadata);
    });
  });

  describe('factory method', () => {
    it('getV8TransferBuilder returns a V8TransferBuilder', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      should.ok(factory.getV8TransferBuilder() instanceof V8TransferBuilder);
    });

    it('factory v8 builder carries v8 material', () => {
      const factory = new TransactionBuilderFactory(buildTestConfig());
      const builder = factory.getV8TransferBuilder();
      should.equal((builder as any)._material.specVersion, testnetV8Material.specVersion);
    });
  });

  describe('build transaction', () => {
    const sender = accounts.account1;
    const receiver = accounts.account2;

    it('should build a signed v8 transfer transaction with v8 specVersion in output', async () => {
      const config = buildTestConfig();
      const builder = new V8TransferBuilder(config)
        .amount('90034235235322')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      should.deepEqual(txJson.amount, '90034235235322');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.specVersion, testnetV8Material.specVersion);
      should.deepEqual(txJson.transactionVersion, testnetV8Material.txVersion);
    });

    it('should build an unsigned v8 transfer transaction', async () => {
      const config = buildTestConfig();
      const tx = await new V8TransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();

      const txJson = tx.toJson();
      should.deepEqual(txJson.specVersion, testnetV8Material.specVersion);
      should.deepEqual(txJson.transactionVersion, testnetV8Material.txVersion);
    });

    it('encodes transferWithMemo at v8 call index 0x0528 (HSM method ID 1320)', async () => {
      const config = buildTestConfig();
      const tx = await new V8TransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();

      const methodHex = (tx as any)._substrateTransaction.method as string;
      // pallet 5 (balances) + call 0x28 (transferWithMemo) → hex bytes 05 28
      should.equal(methodHex.slice(2, 6), '0528');
    });
  });
});
