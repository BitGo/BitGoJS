import should from 'should';
import { coins } from '@bitgo/statics';
import { HexTransferBuilder, TransactionBuilderFactory, TransferBuilder } from '../../../src/lib';
import { utils } from '../../../src';
import { accounts, mockTssSignature } from '../../resources';
import { buildTestConfig, buildMainnetConfig } from './base';

// Expected NEW-encoding hex values from problem.md example table
const NEW_MEMO_HEX: Record<string, string> = {
  0: '0x3000000000000000000000000000000000000000000000000000000000000000',
  1: '0x3100000000000000000000000000000000000000000000000000000000000000',
  2: '0x3200000000000000000000000000000000000000000000000000000000000000',
  56594: '0x3536353934000000000000000000000000000000000000000000000000000000',
  102329716: '0x3130323332393731360000000000000000000000000000000000000000000000',
  testmemo: '0x746573746d656d6f000000000000000000000000000000000000000000000000',
  abc: '0x6162630000000000000000000000000000000000000000000000000000000000',
};

describe('HexTransferBuilder — memo encoding', () => {
  let builder: HexTransferBuilder;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new HexTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  describe('memo() produces NEW encoding', () => {
    it('encodes "0"', () => {
      builder.memo('0');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['0']);
    });

    it('encodes "1"', () => {
      builder.memo('1');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['1']);
    });

    it('encodes "2"', () => {
      builder.memo('2');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['2']);
    });

    it('encodes "56594"', () => {
      builder.memo('56594');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['56594']);
    });

    it('encodes "102329716"', () => {
      builder.memo('102329716');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['102329716']);
    });

    it('encodes "testmemo"', () => {
      builder.memo('testmemo');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['testmemo']);
    });

    it('encodes "abc"', () => {
      builder.memo('abc');
      should.equal((builder as any)._memo, NEW_MEMO_HEX['abc']);
    });

    it('stores an already-encoded 0x hex memo as-is (round-trip)', () => {
      const alreadyEncoded = NEW_MEMO_HEX['56594'];
      builder.memo(alreadyEncoded);
      should.equal((builder as any)._memo, alreadyEncoded);
    });
  });

  describe('NEW encoding differs from OLD encoding', () => {
    it('produces different bytes than TransferBuilder for "56594"', () => {
      const { TransferBuilder } = require('../../../src/lib');
      const config = buildTestConfig();
      const oldBuilder = new TransferBuilder(config).material(utils.getMaterial(config.network.type));
      const newBuilder = new HexTransferBuilder(config).material(utils.getMaterial(config.network.type));

      oldBuilder.memo('56594');
      newBuilder.memo('56594');

      const oldMemo = (oldBuilder as any)._memo;
      const newMemo = (newBuilder as any)._memo;

      should.notEqual(oldMemo, newMemo);
      // OLD: left-pad with ASCII '0' chars
      should.ok(oldMemo.startsWith('000000'), `OLD memo should start with ASCII '0' padding, got: ${oldMemo}`);
      // NEW: 0x-prefixed hex
      should.ok(newMemo.startsWith('0x'), `NEW memo should start with 0x, got: ${newMemo}`);
      should.equal(newMemo, NEW_MEMO_HEX['56594']);
    });

    it('produces different bytes than TransferBuilder for "0"', () => {
      const { TransferBuilder } = require('../../../src/lib');
      const config = buildTestConfig();
      const oldBuilder = new TransferBuilder(config).material(utils.getMaterial(config.network.type));
      const newBuilder = new HexTransferBuilder(config).material(utils.getMaterial(config.network.type));

      oldBuilder.memo('0');
      newBuilder.memo('0');

      should.notEqual((oldBuilder as any)._memo, (newBuilder as any)._memo);
    });
  });

  describe('build transaction with NEW memo encoding', () => {
    const sender = accounts.account1;
    const receiver = accounts.account2;

    it('should build a transaction with NEW memo "56594"', async () => {
      builder
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

      should.deepEqual(txJson.amount, '1000000');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual(txJson.sender, sender.address);
    });

    it('should build a transaction with NEW memo "testmemo"', async () => {
      builder
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('testmemo')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      should.deepEqual(txJson.amount, '1000000');
      should.deepEqual(txJson.to, receiver.address);
      should.deepEqual((builder as any)._memo, NEW_MEMO_HEX['testmemo']);
    });

    it('should build a transaction with NEW memo "0" (default)', async () => {
      builder
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      should.ok(tx);
      should.equal((builder as any)._memo, NEW_MEMO_HEX['0']);
    });

    it('should build a transaction with NEW memo "102329716"', async () => {
      builder
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('102329716')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      should.ok(tx);
      should.equal((builder as any)._memo, NEW_MEMO_HEX['102329716']);
    });

    it('raw transaction bytes differ between OLD and NEW builder for same memo', async () => {
      const { TransferBuilder } = require('../../../src/lib');
      const config = buildTestConfig();
      const material = utils.getMaterial(config.network.type);

      const commonParams = {
        address: receiver.address,
        amount: '1000000',
        sender: sender.address,
        firstValid: 3933,
        maxDuration: 64,
        referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
        nonce: 1,
      };

      const oldBuilder = new TransferBuilder(config)
        .material(material)
        .amount(commonParams.amount)
        .to({ address: commonParams.address })
        .sender({ address: commonParams.sender })
        .memo('56594')
        .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
        .referenceBlock(commonParams.referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
        .fee({ amount: 0, type: 'tip' });
      oldBuilder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const oldTx = await oldBuilder.build();

      const newBuilder = new HexTransferBuilder(config)
        .material(material)
        .amount(commonParams.amount)
        .to({ address: commonParams.address })
        .sender({ address: commonParams.sender })
        .memo('56594')
        .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
        .referenceBlock(commonParams.referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
        .fee({ amount: 0, type: 'tip' });
      newBuilder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const newTx = await newBuilder.build();

      should.notEqual(oldTx.toBroadcastFormat(), newTx.toBroadcastFormat());
    });
  });
});

describe('HexTransferBuilder — Mainnet', () => {
  let builder: HexTransferBuilder;

  const sender = accounts.account5Mainnet;
  const receiver = accounts.account6Mainnet;

  beforeEach(() => {
    const config = buildMainnetConfig();
    builder = new HexTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  it('should encode memo "56594" correctly on mainnet', () => {
    builder.memo('56594');
    should.equal((builder as any)._memo, NEW_MEMO_HEX['56594']);
  });

  it('should build a mainnet transaction with NEW memo', async () => {
    builder
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

    should.deepEqual(txJson.amount, '1000000');
    should.deepEqual(txJson.to, receiver.address);
    should.deepEqual(txJson.sender, sender.address);
  });
});

describe('HexTransferBuilder — factory.from() rebuild round-trip', () => {
  const sender = accounts.account1;
  const receiver = accounts.account2;
  const commonParams = {
    amount: '1000000',
    firstValid: 3933,
    maxDuration: 64,
    referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
    nonce: 1,
  };
  let factory: TransactionBuilderFactory;

  beforeEach(() => {
    factory = new TransactionBuilderFactory(coins.get('tpolyx'));
  });

  it('factory.from() returns HexTransferBuilder for a NEW-encoded signed transaction', async () => {
    const builder = new HexTransferBuilder(buildTestConfig())
      .material(utils.getMaterial(buildTestConfig().network.type))
      .amount(commonParams.amount)
      .to({ address: receiver.address })
      .sender({ address: sender.address })
      .memo('56594')
      .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
      .referenceBlock(commonParams.referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
      .fee({ amount: 0, type: 'tip' });
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    const serialized = tx.toBroadcastFormat();

    const rebuilt = factory.from(serialized);
    rebuilt.should.be.instanceOf(HexTransferBuilder);
  });

  it('factory.from() returns TransferBuilder (not HexTransferBuilder) for an OLD-encoded signed transaction', async () => {
    const builder = new TransferBuilder(buildTestConfig())
      .material(utils.getMaterial(buildTestConfig().network.type))
      .amount(commonParams.amount)
      .to({ address: receiver.address })
      .sender({ address: sender.address })
      .memo('56594')
      .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
      .referenceBlock(commonParams.referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
      .fee({ amount: 0, type: 'tip' });
    builder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const tx = await builder.build();
    const serialized = tx.toBroadcastFormat();

    const rebuilt = factory.from(serialized);
    rebuilt.should.be.instanceOf(TransferBuilder);
    rebuilt.should.not.be.instanceOf(HexTransferBuilder);
  });

  it('rebuild from NEW-encoded tx preserves memo bytes (serialized hex is identical)', async () => {
    const build = async (memo: string) => {
      const b = new HexTransferBuilder(buildTestConfig())
        .material(utils.getMaterial(buildTestConfig().network.type))
        .amount(commonParams.amount)
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo(memo)
        .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
        .referenceBlock(commonParams.referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
        .fee({ amount: 0, type: 'tip' });
      b.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      return (await b.build()).toBroadcastFormat();
    };

    for (const memo of ['56594', 'testmemo', '0', '102329716']) {
      const original = await build(memo);
      // fromImplementation for signed txs doesn't restore blockNumber — must re-supply validity + referenceBlock
      const rebuilt = factory
        .from(original)
        .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
        .referenceBlock(commonParams.referenceBlock);
      const roundTripped = (await rebuilt.build()).toBroadcastFormat();
      should.equal(roundTripped, original, `round-trip failed for memo "${memo}"`);
    }
  });

  it('rebuild from NEW-encoded tx has correct _memo value', async () => {
    const hexBuilder = new HexTransferBuilder(buildTestConfig())
      .material(utils.getMaterial(buildTestConfig().network.type))
      .amount(commonParams.amount)
      .to({ address: receiver.address })
      .sender({ address: sender.address })
      .memo('56594')
      .validity({ firstValid: commonParams.firstValid, maxDuration: commonParams.maxDuration })
      .referenceBlock(commonParams.referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: commonParams.nonce })
      .fee({ amount: 0, type: 'tip' });
    hexBuilder.addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));
    const serialized = (await hexBuilder.build()).toBroadcastFormat();

    const rebuilt = factory.from(serialized);
    should.equal((rebuilt as any)._memo, NEW_MEMO_HEX['56594']);
  });
});

describe('utils.isNewMemoEncoding', () => {
  it('detects NEW encoding (has 0x00 bytes)', () => {
    should.ok(utils.isNewMemoEncoding(NEW_MEMO_HEX['56594']));
    should.ok(utils.isNewMemoEncoding(NEW_MEMO_HEX['testmemo']));
    should.ok(utils.isNewMemoEncoding(NEW_MEMO_HEX['abc']));
    should.ok(utils.isNewMemoEncoding(NEW_MEMO_HEX['0']));
  });

  it('does not detect OLD encoding as NEW (no 0x00 bytes)', () => {
    // OLD encoding of "0": all 0x30 bytes, no nulls
    const oldMemoZero = '0x3030303030303030303030303030303030303030303030303030303030303030';
    // OLD encoding of "56594": 27 × 0x30 + ASCII "56594"
    const oldMemoRef = '0x3030303030303030303030303030303030303030303030303030303536353934';
    should.ok(!utils.isNewMemoEncoding(oldMemoZero));
    should.ok(!utils.isNewMemoEncoding(oldMemoRef));
  });

  it('returns false for non-0x strings', () => {
    should.ok(!utils.isNewMemoEncoding('00000000000000000000000000056594'));
    should.ok(!utils.isNewMemoEncoding(''));
  });

  it('returns false for wrong-length 0x strings', () => {
    should.ok(!utils.isNewMemoEncoding('0x1234'));
  });

  it('detects full 32-byte NEW memo with no null padding as NEW', () => {
    const fullMemo = '0x' + '61'.repeat(32);
    should.ok(utils.isNewMemoEncoding(fullMemo));
  });
});

describe('utils.encodeMemoNew', () => {
  it('encodes "56594" correctly', () => {
    should.equal(utils.encodeMemoNew('56594'), NEW_MEMO_HEX['56594']);
  });

  it('encodes "testmemo" correctly', () => {
    should.equal(utils.encodeMemoNew('testmemo'), NEW_MEMO_HEX['testmemo']);
  });

  it('encodes "0" correctly', () => {
    should.equal(utils.encodeMemoNew('0'), NEW_MEMO_HEX['0']);
  });

  it('encodes "102329716" correctly', () => {
    should.equal(utils.encodeMemoNew('102329716'), NEW_MEMO_HEX['102329716']);
  });

  it('encodes "abc" correctly', () => {
    should.equal(utils.encodeMemoNew('abc'), NEW_MEMO_HEX['abc']);
  });

  it('always returns a 0x-prefixed 66-character string', () => {
    ['0', '1', '56594', 'testmemo', 'abc', '102329716'].forEach((memo) => {
      const encoded = utils.encodeMemoNew(memo);
      should.ok(encoded.startsWith('0x'), `should start with 0x: ${encoded}`);
      should.equal(encoded.length, 66, `should be 66 chars (0x + 64 hex): ${encoded}`);
    });
  });

  it('throws when memo exceeds 32 UTF-8 bytes', () => {
    const tooLong = 'a'.repeat(33);
    should.throws(() => utils.encodeMemoNew(tooLong), /exceeds maximum length of 32 bytes/);
  });
});

describe('HexTransferBuilder — memo validation', () => {
  let builder: HexTransferBuilder;

  beforeEach(() => {
    const config = buildTestConfig();
    builder = new HexTransferBuilder(config).material(utils.getMaterial(config.network.type));
  });

  it('throws when memo exceeds 32 UTF-8 bytes', () => {
    const tooLong = 'a'.repeat(33);
    should.throws(() => builder.memo(tooLong), /exceeds maximum length of 32 bytes/);
  });

  it('throws for invalid hex memo', () => {
    should.throws(() => builder.memo('0x' + 'zz'.repeat(32)), /Invalid memo hex encoding/);
  });
});
