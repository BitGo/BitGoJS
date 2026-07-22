import { coins, NetworkType } from '@bitgo/statics';
import should from 'should';
import {
  TransactionBuilderFactory,
  TransferBuilder,
  V8TransferBuilder,
  V8HexTransferBuilder,
  V8TokenTransferBuilder,
  utils,
} from '../../../src/lib';
import { Interface } from '../../../src';
import { rawTx, accounts, mockTssSignature } from '../../resources';
import * as materialData from '../../resources/materialData.json';
import { buildTestConfig } from './base';

describe('Tao Transaction Builder Factory', function () {
  const sender = accounts.account1;
  let factory: TransactionBuilderFactory;

  xdescribe('parse generic builders', function () {
    before(function () {
      factory = new TransactionBuilderFactory(coins.get('tpolyx'));
    });

    [{ type: 'transfer', builder: TransferBuilder }].forEach((txn) => {
      it(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].unsigned).material(materialData as Interface.Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
          .sender({ address: sender.address });
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].unsigned);
      });

      it(`should parse a signed ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].signed).material(materialData as Interface.Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].signed);
      });
    });
  });

  describe('tryGetV8Builder routing', function () {
    const receiver = accounts.account2;

    let v8TransferTxHex: string;
    let v8HexTransferTxHex: string;

    before(async function () {
      const config = buildTestConfig();

      // Build an unsigned v8 transferWithMemo tx (plain-string memo, not 0x-prefixed)
      const v8Tx = await new V8TransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      v8TransferTxHex = v8Tx.toBroadcastFormat();

      // Build an unsigned v8 hex-memo transferWithMemo tx
      const v8HexTx = await new V8HexTransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('56594')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      v8HexTransferTxHex = v8HexTx.toBroadcastFormat();
    });

    it('routes a v8 transferWithMemo tx to V8TransferBuilder via fallback', function () {
      // A v8 txHex encodes transferWithMemo at call index 0x28 (Balances pallet, call 40),
      // which does not exist in the v7 SDK metadata. The factory falls back to tryGetV8Builder,
      // decodes against v8 metadata, and returns the correct builder.
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(v8TransferTxHex);
      should.ok(builder instanceof V8TransferBuilder, 'expected V8TransferBuilder from tryGetV8Builder fallback');
    });

    it('routes a v8 hex-memo transferWithMemo tx to V8HexTransferBuilder via fallback', function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(v8HexTransferTxHex);
      should.ok(builder instanceof V8HexTransferBuilder, 'expected V8HexTransferBuilder from tryGetV8Builder fallback');
    });

    it('routes a v7 transferWithMemo tx to TransferBuilder directly', function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(rawTx.transfer.signed);
      should.ok(builder instanceof TransferBuilder, 'expected TransferBuilder for v7 txHex');
    });
  });

  // Regression test for the bug where getBuilder() decoded a v8 addAndAffirmWithMediators
  // payload with v7 metadata (same call index, so no throw), silently lost sender.did, then
  // routed to the v7 TokenTransferBuilder — causing Joi to throw
  // 'legs[0].fungible.sender.did is required'.
  describe('v8 token transfer routing regression', function () {
    const FROM_DID = '0x1208d7851e6698249aea40742701ee1ef6cdcced260a7c49c1cca1a9db836342';
    const TO_DID = '0xbc6f7ec808f361c1353ab9dc88c3cc54b98d9eb60fed9c063e67a40925b8ef61';
    const ASSET_ID = '0x780602887b358cf48989d0d9aa6c8d28';
    const VALIDITY = { firstValid: 3933, maxDuration: 64 };
    const REF_BLOCK = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';

    let unsignedHex: string;
    let signedHex: string;

    before(async function () {
      const config = buildTestConfig();

      // unsigned (no signature attached)
      const unsignedTx = await new V8TokenTransferBuilder(config)
        .assetId(ASSET_ID)
        .amount('1000000')
        .fromDID(FROM_DID)
        .toDID(TO_DID)
        .memo('0')
        .sender({ address: sender.address })
        .validity(VALIDITY)
        .referenceBlock(REF_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      unsignedHex = unsignedTx.toBroadcastFormat();

      // signed
      const signedBuilder = new V8TokenTransferBuilder(config)
        .assetId(ASSET_ID)
        .amount('1000000')
        .fromDID(FROM_DID)
        .toDID(TO_DID)
        .memo('0')
        .sender({ address: sender.address })
        .validity(VALIDITY)
        .referenceBlock(REF_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      signedBuilder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const signedTx = await signedBuilder.build();
      signedHex = signedTx.toBroadcastFormat();
    });

    it('routes a v8 token transfer tx to V8TokenTransferBuilder (not TokenTransferBuilder)', function () {
      // The call index for addAndAffirmWithMediators is identical in v7 and v8, so the v7 decode
      // path "succeeds" but drops sender.did. The fix in getBuilder() detects the missing field
      // and redirects to tryGetV8Builder() before Joi validation fires.
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(signedHex);
      should.ok(
        builder instanceof V8TokenTransferBuilder,
        'expected V8TokenTransferBuilder — v8 payload must not be silently mis-routed to v7 TokenTransferBuilder'
      );
      // V8TokenTransferBuilder extends TokenTransferBuilder; verify it is the v8 subclass
      // specifically (constructor name) so a future refactor that breaks the class hierarchy
      // is caught here rather than silently allowing a plain TokenTransferBuilder through.
      should.equal(
        builder.constructor.name,
        'V8TokenTransferBuilder',
        'constructor must be V8TokenTransferBuilder, not plain TokenTransferBuilder'
      );
    });

    it('rebuilds from unsigned v8 token transfer hex with correct fields and matching raw output', async function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(unsignedHex);
      builder.validity(VALIDITY).referenceBlock(REF_BLOCK).sender({ address: sender.address });
      const rebuilt = await builder.build();

      const json = rebuilt.toJson();
      should.equal(json.assetId, ASSET_ID);
      should.equal(json.amount, '1000000');
      should.equal(json.fromDID, FROM_DID);
      should.equal(json.toDID, TO_DID);
      should.equal(rebuilt.toBroadcastFormat(), unsignedHex, 'unsigned round-trip hex must match original');
    });

    it('rebuilds from signed v8 token transfer hex with correct fields and matching raw output', async function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(signedHex);
      builder.validity(VALIDITY).referenceBlock(REF_BLOCK);
      const rebuilt = await builder.build();

      const json = rebuilt.toJson();
      should.equal(json.assetId, ASSET_ID);
      should.equal(json.amount, '1000000');
      should.equal(json.fromDID, FROM_DID);
      should.equal(json.toDID, TO_DID);
      should.equal(rebuilt.toBroadcastFormat(), signedHex, 'signed round-trip hex must match original');
    });

    it('forwards factory live material specVersion to V8TokenTransferBuilder (SI-XXXX regression)', async function () {
      // Regression for the bug where getV8TokenTransferBuilder() was called without
      // .material(this._material), causing the builder to use the static placeholder
      // specVersion (8000000) instead of the live chain specVersion. This produced a
      // rebuilt signablePayload with wrong additional bytes, failing verifySignature.
      const liveSpecVersion = 8000020;
      const liveMaterial = {
        ...utils.getV8Material(NetworkType.TESTNET),
        specVersion: liveSpecVersion,
      } as Interface.Material;

      // Build an unsigned tx with the live material — its signable payload encodes liveSpecVersion.
      const originalTx = await new V8TokenTransferBuilder(buildTestConfig())
        .material(liveMaterial)
        .assetId(ASSET_ID)
        .amount('1000000')
        .fromDID(FROM_DID)
        .toDID(TO_DID)
        .memo('0')
        .sender({ address: sender.address })
        .validity(VALIDITY)
        .referenceBlock(REF_BLOCK)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      const originalSignable = originalTx.signablePayload.toString('hex');
      const signingPayloadHex = originalTx.toBroadcastFormat();

      // Factory with the same live material must forward it to the created V8TokenTransferBuilder
      // so the rebuild uses liveSpecVersion, not the static 8000000 placeholder.
      const factoryInst = new TransactionBuilderFactory(buildTestConfig()).material(liveMaterial);
      const rebuiltBuilder = factoryInst.from(signingPayloadHex);
      rebuiltBuilder.sender({ address: sender.address }).validity(VALIDITY).referenceBlock(REF_BLOCK);
      const rebuiltTx = await rebuiltBuilder.build();

      should.equal(
        rebuiltTx.signablePayload.toString('hex'),
        originalSignable,
        'signablePayload must match: factory must forward live material to V8TokenTransferBuilder'
      );
    });
  });
});
