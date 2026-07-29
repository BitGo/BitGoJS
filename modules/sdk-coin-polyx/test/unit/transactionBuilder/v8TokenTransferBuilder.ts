import should from 'should';
import { decode } from '@substrate/txwrapper-polkadot';
import { V8TokenTransferBuilder, TransactionBuilderFactory, SingletonRegistry, utils } from '../../../src/lib';
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

    it('encodes legs/holderSet using the v8 AssetHolder wrapper, not the v7 bare PortfolioId shape', async () => {
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

      // Call index is unchanged from v7 (0x2514) — confirmed on Polymesh Testnet v8 (block 24801173).
      const methodHex = (tx as any)._substrateTransaction.method as string;
      should.equal(methodHex.slice(2, 6), '2514');

      // Decoding against real v8 metadata must resolve `holderSet` + AssetHolder-wrapped legs
      // (lowercase `portfolio` key — see DecodedAssetHolder). A v7-shaped `portfolios` field
      // would fail this decode (defineMethod itself throws "expects argument holderSet" if the
      // v7 shape is passed to v8 metadata — this test proves the v8 shape round-trips cleanly).
      const v8Material = utils.getV8Material(buildTestConfig().network.type);
      const registry = SingletonRegistry.getInstance(v8Material);
      const decoded = decode(tx.toBroadcastFormat(), {
        metadataRpc: v8Material.metadata,
        registry,
      });
      const args = decoded.method.args as any;
      should.not.exist(args.portfolios);
      should.exist(args.holderSet);
      should.equal(args.holderSet[0].portfolio.did, FROM_DID);
      should.equal(args.legs[0].fungible.sender.portfolio.did, FROM_DID);
      should.equal(args.legs[0].fungible.receiver.portfolio.did, TO_DID);
      should.equal(args.legs[0].fungible.assetId, ASSET_ID);
    });

    it('should build from raw signed v8 tx and decode the AssetHolder-wrapped legs back into DIDs', async () => {
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
      const built = await builder.build();
      const rawSigned = built.toBroadcastFormat();

      const roundTrip = new V8TokenTransferBuilder(buildTestConfig());
      roundTrip.from(rawSigned);
      roundTrip
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
      const tx = await roundTrip.build();
      const txJson = tx.toJson();

      should.deepEqual(txJson.amount, '1000000');
      should.deepEqual(txJson.assetId, ASSET_ID);
      should.deepEqual(txJson.fromDID, FROM_DID);
      should.deepEqual(txJson.toDID, TO_DID);
    });
  });
});
