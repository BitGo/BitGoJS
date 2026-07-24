import should from 'should';
import { coins } from '@bitgo/statics';
import { HexTokenTransferBuilder, TokenTransferBuilder, TransactionBuilderFactory } from '../../../src/lib';
import { utils } from '../../../src';
import { accounts, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';

const NEW_MEMO_HEX: Record<string, string> = {
  0: '0x3000000000000000000000000000000000000000000000000000000000000000',
  56594: '0x3536353934000000000000000000000000000000000000000000000000000000',
  testmemo: '0x746573746d656d6f000000000000000000000000000000000000000000000000',
  102329716: '0x3130323332393731360000000000000000000000000000000000000000000000',
};

const senderDID = '0x28e8649fec23dd688090b9b5bb950fd34bf20a014cf05542e3ad0264915ee775';
const receiverDID = '0x9202856204a721d2f5e8b85408067d54f1ca84390bf4f558b5615a5a6d3bddb8';
const assetId = '0x780602887b358cf48989d0d9aa6c8d28';

const commonBuilderParams = (builder: HexTokenTransferBuilder, sender: (typeof accounts)['rbitgoTokenOwner']) => {
  return builder
    .toDID(receiverDID)
    .fromDID(senderDID)
    .assetId(assetId)
    .amount('100')
    .sender({ address: sender.address })
    .validity({ firstValid: 3933, maxDuration: 64 })
    .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
    .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
    .fee({ amount: 0, type: 'tip' });
};

describe('HexTokenTransferBuilder — memo encoding', () => {
  let builder: HexTokenTransferBuilder;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new HexTokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('memo() produces NEW encoding', () => {
    it('encodes "0"', () => {
      builder.memo('0');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['0']);
    });

    it('encodes "56594"', () => {
      builder.memo('56594');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['56594']);
    });

    it('encodes "testmemo"', () => {
      builder.memo('testmemo');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['testmemo']);
    });

    it('encodes "102329716"', () => {
      builder.memo('102329716');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['102329716']);
    });

    it('stores an already-encoded 0x hex memo as-is (round-trip)', () => {
      const alreadyEncoded = NEW_MEMO_HEX['56594'];
      builder.memo(alreadyEncoded);
      should.equal((builder as any)._memo, alreadyEncoded);
    });
  });

  describe('NEW encoding differs from OLD encoding', () => {
    it('produces different bytes than TokenTransferBuilder for "56594"', () => {
      const config = buildTestConfig();
      const oldBuilder = new TokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
      const newBuilder = new HexTokenTransferBuilder(config).material(utils.getMaterial(config.network.type));

      oldBuilder.memo('56594');
      newBuilder.memo('56594');

      const oldMemo = (oldBuilder as any)._memo;
      const newMemo = (newBuilder as any)._memo;

      should.notEqual(oldMemo, newMemo);
      should.ok(!oldMemo.startsWith('0x'), `OLD memo should not start with 0x, got: ${oldMemo}`);
      should.ok(newMemo.startsWith('0x'), `NEW memo should start with 0x, got: ${newMemo}`);
      should.equal(newMemo, NEW_MEMO_HEX['56594']);
    });

    it('produces different bytes than TokenTransferBuilder for "0"', () => {
      const config = buildTestConfig();
      const oldBuilder = new TokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
      const newBuilder = new HexTokenTransferBuilder(config).material(utils.getMaterial(config.network.type));

      oldBuilder.memo('0');
      newBuilder.memo('0');

      should.notEqual((oldBuilder as any)._memo, (newBuilder as any)._memo);
    });
  });
});

describe('HexTokenTransferBuilder — build transaction', () => {
  const sender = accounts.rbitgoTokenOwner;
  let builder: HexTokenTransferBuilder;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new HexTokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  it('should build a valid addAndAffirmWithMediators tx with NEW memo "56594"', async () => {
    commonBuilderParams(builder, sender).memo('56594');
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    const txJson = tx.toJson();
    should.deepEqual(txJson.amount, '100');
    should.deepEqual(txJson.toDID, receiverDID);
    should.deepEqual(txJson.fromDID, senderDID);
    should.deepEqual(txJson.assetId, assetId);
    should.deepEqual(txJson.memo, NEW_MEMO_HEX['56594']);
  });

  it('should build a valid tx with NEW memo "testmemo"', async () => {
    commonBuilderParams(builder, sender).memo('testmemo');
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    should.deepEqual(tx.toJson().memo, NEW_MEMO_HEX['testmemo']);
  });

  it('should build a valid tx with NEW memo "0" (default)', async () => {
    commonBuilderParams(builder, sender).memo('0');
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    should.deepEqual(tx.toJson().memo, NEW_MEMO_HEX['0']);
  });

  it('should build a valid tx with NEW memo "102329716"', async () => {
    commonBuilderParams(builder, sender).memo('102329716');
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    should.deepEqual(tx.toJson().memo, NEW_MEMO_HEX['102329716']);
  });

  it('raw transaction bytes differ between OLD and NEW builder for same memo', async () => {
    const config = buildTestConfig();
    const material = utils.getMaterial(config.network.type);

    const buildOld = async () => {
      const b = new TokenTransferBuilder(config)
        .material(material)
        .toDID(receiverDID)
        .fromDID(senderDID)
        .assetId(assetId)
        .amount('100')
        .memo('56594')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      b.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      return (await b.build()).toBroadcastFormat();
    };

    const buildNew = async () => {
      const b = new HexTokenTransferBuilder(config)
        .material(material)
        .toDID(receiverDID)
        .fromDID(senderDID)
        .assetId(assetId)
        .amount('100')
        .memo('56594')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      b.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      return (await b.build()).toBroadcastFormat();
    };

    should.notEqual(await buildOld(), await buildNew());
  });
});

describe('HexTokenTransferBuilder — factory.from() round-trip', () => {
  const sender = accounts.rbitgoTokenOwner;
  const commonParams = {
    firstValid: 3933,
    maxDuration: 64,
    referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    nonce: 200,
  };
  let factory: TransactionBuilderFactory;

  beforeEach(() => {
    factory = new TransactionBuilderFactory(coins.get('tpolyx'));
  });

  const buildSigned = async (memo: string) => {
    const config = buildTestConfig();
    const b = new HexTokenTransferBuilder(config)
      .material(utils.getMaterial(config.network.type))
      .toDID(receiverDID)
      .fromDID(senderDID)
      .assetId(assetId)
      .amount('100')
      .memo(memo)
      .sender({ address: sender.address })
      .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
      .referenceBlock(commonParams.referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
      .fee({ amount: 0, type: 'tip' });
    b.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    return (await b.build()).toBroadcastFormat();
  };

  it('factory.from() returns HexTokenTransferBuilder for a NEW-encoded token transfer', async () => {
    const serialized = await buildSigned('56594');
    const rebuilt = factory.from(serialized);
    rebuilt.should.be.instanceOf(HexTokenTransferBuilder);
  });

  it('factory.from() returns TokenTransferBuilder (not Hex) for an OLD-encoded token transfer', async () => {
    const config = buildTestConfig();
    const b = new TokenTransferBuilder(config)
      .material(utils.getMaterial(config.network.type))
      .toDID(receiverDID)
      .fromDID(senderDID)
      .assetId(assetId)
      .amount('100')
      .memo('56594')
      .sender({ address: sender.address })
      .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
      .referenceBlock(commonParams.referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
      .fee({ amount: 0, type: 'tip' });
    b.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const serialized = (await b.build()).toBroadcastFormat();

    const rebuilt = factory.from(serialized);
    rebuilt.should.be.instanceOf(TokenTransferBuilder);
    rebuilt.should.not.be.instanceOf(HexTokenTransferBuilder);
  });

  it('round-trip preserves memo bytes for multiple memos', async () => {
    for (const memo of ['56594', 'testmemo', '0', '102329716']) {
      const original = await buildSigned(memo);
      const rebuilt = factory
        .from(original)
        .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
        .referenceBlock(commonParams.referenceBlock);
      const roundTripped = (await rebuilt.build()).toBroadcastFormat();
      should.equal(roundTripped, original, `round-trip failed for memo "${memo}"`);
    }
  });

  it('rebuilt tx has correct _memo value after round-trip', async () => {
    const serialized = await buildSigned('56594');
    const rebuilt = factory.from(serialized);
    should.equal((rebuilt as any)._memo, NEW_MEMO_HEX['56594']);
  });
});

describe('HexTokenTransferBuilder — memo validation', () => {
  let builder: HexTokenTransferBuilder;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new HexTokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  it('throws when memo exceeds 32 UTF-8 bytes', () => {
    should.throws(() => builder.memo('a'.repeat(33)), /exceeds maximum length of 32 bytes/);
  });

  it('throws for invalid hex memo', () => {
    should.throws(() => builder.memo('0x' + 'zz'.repeat(32)), /Invalid memo hex encoding/);
  });
});

describe('TokenTransferBuilder — no regression from HexTokenTransferBuilder', () => {
  it('OLD TokenTransferBuilder still produces OLD encoding for "56594"', () => {
    const config = buildTestConfig();
    const builder = new TokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
    builder.memo('56594');
    const memo = (builder as any)._memo;
    should.ok(!memo.startsWith('0x'), `OLD memo should not start with 0x, got: ${memo}`);
    should.equal(memo, '00000000000000000000000000056594'.slice(-32));
  });

  it('OLD TokenTransferBuilder still produces OLD encoding for "0"', () => {
    const config = buildTestConfig();
    const builder = new TokenTransferBuilder(config).material(utils.getMaterial(config.network.type));
    builder.memo('0');
    const memo = (builder as any)._memo;
    should.equal(memo, '0'.padStart(32, '0'));
  });
});
