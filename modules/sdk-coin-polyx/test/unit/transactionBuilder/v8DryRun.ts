/**
 * Polymesh v8 dry-run tests (CECHO-1470 BASE-1).
 *
 * Verifies that all existing transaction builders accept v8 material
 * (specVersion=8000000, txVersion=8) and produce valid serializable
 * transactions. These tests use the v7 on-chain metadata blob with
 * only the version fields swapped to v8 values, confirming that no
 * builder hard-codes or rejects the new version numbers.
 */
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { Interface } from '@bitgo/abstract-substrate';
import {
  HexTransferBuilder,
  TransferBuilder,
  RegisterDidWithCDDBuilder,
  PreApproveAssetBuilder,
  BatchBuilder,
  BatchUnstakingBuilder,
  BondExtraBuilder,
  UnbondBuilder,
  WithdrawUnbondedBuilder,
  NominateBuilder,
} from '../../../src/lib';
import { utils } from '../../../src';
import { accounts, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';

const V8_SPEC_VERSION = 8000000;
const V8_TX_VERSION = 8;
const REFERENCE_BLOCK = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';

function buildV8Material(): Interface.Material {
  const base = utils.getMaterial(NetworkType.TESTNET);
  return { ...base, specVersion: V8_SPEC_VERSION, txVersion: V8_TX_VERSION };
}

describe('Polymesh v8 dry-run — builders accept v8 material', function () {
  const sender = accounts.account1;
  const receiver = accounts.account2;
  const v8Material = buildV8Material();
  const config = buildTestConfig();

  it('v8 material has expected specVersion and txVersion', function () {
    v8Material.specVersion.should.equal(V8_SPEC_VERSION);
    v8Material.txVersion.should.equal(V8_TX_VERSION);
  });

  describe('TransferBuilder (legacy memo encoding)', function () {
    it('builds a signed transfer transaction with v8 material', async function () {
      const builder = new TransferBuilder(config)
        .material(v8Material)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      txJson.amount.should.equal('1000000');
      txJson.to.should.equal(receiver.address);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });

    it('builds an unsigned transfer transaction with v8 material', async function () {
      const builder = new TransferBuilder(config)
        .material(v8Material)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('HexTransferBuilder (new memo encoding)', function () {
    it('builds a signed transfer transaction with v8 material', async function () {
      const builder = new HexTransferBuilder(config)
        .material(v8Material)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('56594')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      txJson.amount.should.equal('1000000');
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('RegisterDidWithCDDBuilder', function () {
    it('builds a registerDid transaction with v8 material', async function () {
      const builder = new RegisterDidWithCDDBuilder(config)
        .material(v8Material)
        .to({ address: receiver.address })
        .sender({ address: accounts.cddProvider.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 0 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: accounts.cddProvider.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('PreApproveAssetBuilder', function () {
    it('builds a preApproveAsset transaction with v8 material', async function () {
      const builder = new PreApproveAssetBuilder(config)
        .material(v8Material)
        .assetId('0x780602887b358cf48989d0d9aa6c8d28')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('BondExtraBuilder', function () {
    it('builds a bondExtra transaction with v8 material', async function () {
      const builder = new BondExtraBuilder(config)
        .material(v8Material)
        .amount('1000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('UnbondBuilder', function () {
    it('builds an unbond transaction with v8 material', async function () {
      const builder = new UnbondBuilder(config)
        .material(v8Material)
        .amount('1000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('WithdrawUnbondedBuilder', function () {
    it('builds a withdrawUnbonded transaction with v8 material', async function () {
      const builder = new WithdrawUnbondedBuilder(config)
        .material(v8Material)
        .slashingSpans(0)
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('NominateBuilder', function () {
    it('builds a nominate transaction with v8 material', async function () {
      const builder = new NominateBuilder(config)
        .material(v8Material)
        .validators(['5C7kNpSvVr22Z1X6gVAUjfahSJfSpvw4DHNoY7uUHpLfEJZR'])
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('BatchBuilder (bond + nominate)', function () {
    it('builds a batch staking transaction with v8 material', async function () {
      const staker = accounts.account3;
      const builder = new BatchBuilder(config).material(v8Material);
      builder
        .amount('10000000')
        .controller({ address: staker.address })
        .payee('Staked')
        .validators(['5C7kNpSvVr22Z1X6gVAUjfahSJfSpvw4DHNoY7uUHpLfEJZR'])
        .sender({ address: staker.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: staker.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('BatchUnstakingBuilder (chill + unbond)', function () {
    it('builds a batch unstaking transaction with v8 material', async function () {
      const staker = accounts.account3;
      const builder = new BatchUnstakingBuilder(config).material(v8Material);
      builder
        .amount('10000000')
        .sender({ address: staker.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(REFERENCE_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: staker.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.specVersion.should.equal(V8_SPEC_VERSION);
      txJson.transactionVersion.should.equal(V8_TX_VERSION);
      should.ok(tx.toBroadcastFormat().startsWith('0x'));
    });
  });

  describe('v8 vs v7 signing payload differs in version fields', function () {
    it('unsigned transfer tx with v8 material has different signable payload than v7', async function () {
      const v7Material = utils.getMaterial(NetworkType.TESTNET);

      const buildUnsignedTx = async (material: Interface.Material) => {
        const b = new HexTransferBuilder(config)
          .material(material)
          .amount('1000000')
          .to({ address: receiver.address })
          .sender({ address: sender.address })
          .memo('0')
          .validity({ firstValid: 3933, maxDuration: 64 })
          .referenceBlock(REFERENCE_BLOCK)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
          .fee({ amount: 0, type: 'tip' });
        return (await b.build()).toBroadcastFormat();
      };

      const v7Hex = await buildUnsignedTx(v7Material);
      const v8Hex = await buildUnsignedTx(v8Material);

      // specVersion and txVersion are encoded in the unsigned signing payload,
      // so the two payloads must differ.
      v7Hex.should.not.equal(v8Hex);
      should.ok(v7Hex.startsWith('0x'));
      should.ok(v8Hex.startsWith('0x'));
    });
  });
});
