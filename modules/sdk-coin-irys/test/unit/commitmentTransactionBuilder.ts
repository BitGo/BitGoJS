import should from 'should';
import * as sinon from 'sinon';
import nock from 'nock';
import { IrysCommitmentTransactionBuilder } from '../../src/lib/commitmentTransactionBuilder';
import { CommitmentTypeId, COMMITMENT_TX_VERSION, IRYS_TESTNET_CHAIN_ID } from '../../src/lib/iface';
import { encodeBase58, decodeBase58 } from '../../src/lib/utils';

describe('IrysCommitmentTransactionBuilder', function () {
  // Common test fixtures
  const testAnchor = new Uint8Array(32).fill(1); // 32 bytes of 0x01
  const testSigner = new Uint8Array(20).fill(2); // 20 bytes of 0x02
  const testChainId = IRYS_TESTNET_CHAIN_ID; // 1270n
  const testFee = 1000n;
  const testValue = 5000n;
  const testApiUrl = 'https://testnet-node1.irys.xyz/v1';

  let builder: IrysCommitmentTransactionBuilder;

  beforeEach(function () {
    builder = new IrysCommitmentTransactionBuilder(testApiUrl, testChainId);
  });

  afterEach(function () {
    sinon.restore();
    nock.cleanAll();
  });

  // === Commitment Type Encoding Tests ===

  describe('encodeCommitmentTypeForSigning', function () {
    it('should encode STAKE as a flat number (not array)', function () {
      const result = IrysCommitmentTransactionBuilder.encodeCommitmentTypeForSigning({
        type: CommitmentTypeId.STAKE,
      });
      result.should.equal(1);
      Array.isArray(result).should.be.false();
    });

    it('should encode PLEDGE as a nested array [type, pledgeCount]', function () {
      const result = IrysCommitmentTransactionBuilder.encodeCommitmentTypeForSigning({
        type: CommitmentTypeId.PLEDGE,
        pledgeCount: 42n,
      });
      Array.isArray(result).should.be.true();
      (result as any[]).length.should.equal(2);
      (result as any[])[0].should.equal(2);
      (result as any[])[1].should.equal(42n);
    });
  });

  // === Commitment Type Broadcast Encoding Tests ===

  describe('encodeCommitmentTypeForBroadcast', function () {
    it('should encode STAKE as { type: "stake" }', function () {
      const result = IrysCommitmentTransactionBuilder.encodeCommitmentTypeForBroadcast({
        type: CommitmentTypeId.STAKE,
      });
      should.deepEqual(result, { type: 'stake' });
    });

    it('should encode PLEDGE with pledgeCountBeforeExecuting', function () {
      const result = IrysCommitmentTransactionBuilder.encodeCommitmentTypeForBroadcast({
        type: CommitmentTypeId.PLEDGE,
        pledgeCount: 42n,
      });
      should.deepEqual(result, { type: 'pledge', pledgeCountBeforeExecuting: '42' });
    });
  });

  // === RLP Encoding Tests ===

  describe('rlpEncode', function () {
    it('should RLP encode a STAKE transaction with correct field order', function () {
      const fields = {
        version: COMMITMENT_TX_VERSION,
        anchor: testAnchor,
        signer: testSigner,
        commitmentType: { type: CommitmentTypeId.STAKE as const },
        chainId: testChainId,
        fee: testFee,
        value: testValue,
      };

      const encoded = builder.rlpEncode(fields);
      encoded.should.be.instanceOf(Uint8Array);
      encoded.length.should.be.greaterThan(0);

      // The encoded output should be deterministic
      const encoded2 = builder.rlpEncode(fields);
      Buffer.from(encoded).equals(Buffer.from(encoded2)).should.be.true();
    });

    it('should RLP encode a PLEDGE transaction with nested array commitment type', function () {
      const fields = {
        version: COMMITMENT_TX_VERSION,
        anchor: testAnchor,
        signer: testSigner,
        commitmentType: { type: CommitmentTypeId.PLEDGE as const, pledgeCount: 42n },
        chainId: testChainId,
        fee: testFee,
        value: testValue,
      };

      const encoded = builder.rlpEncode(fields);
      encoded.should.be.instanceOf(Uint8Array);
      encoded.length.should.be.greaterThan(0);
    });

    it('should produce different encodings for STAKE vs PLEDGE', function () {
      const stakeFields = {
        version: COMMITMENT_TX_VERSION,
        anchor: testAnchor,
        signer: testSigner,
        commitmentType: { type: CommitmentTypeId.STAKE as const },
        chainId: testChainId,
        fee: testFee,
        value: testValue,
      };

      const pledgeFields = {
        ...stakeFields,
        commitmentType: { type: CommitmentTypeId.PLEDGE as const, pledgeCount: 1n },
      };

      const stakeEncoded = builder.rlpEncode(stakeFields);
      const pledgeEncoded = builder.rlpEncode(pledgeFields);
      Buffer.from(stakeEncoded).equals(Buffer.from(pledgeEncoded)).should.be.false();
    });
  });

  // === Prehash Tests ===

  describe('computePrehash', function () {
    it('should return a 32-byte keccak256 hash', function () {
      const rlpEncoded = new Uint8Array([0xc0]); // minimal RLP
      const prehash = builder.computePrehash(rlpEncoded);
      prehash.should.be.instanceOf(Uint8Array);
      prehash.length.should.equal(32);
    });

    it('should produce deterministic output', function () {
      const rlpEncoded = new Uint8Array([0xc8, 0x02, 0x01, 0x02, 0x03]);
      const hash1 = builder.computePrehash(rlpEncoded);
      const hash2 = builder.computePrehash(rlpEncoded);
      Buffer.from(hash1).equals(Buffer.from(hash2)).should.be.true();
    });

    it('should produce different hashes for different inputs', function () {
      const input1 = new Uint8Array([0x01]);
      const input2 = new Uint8Array([0x02]);
      const hash1 = builder.computePrehash(input1);
      const hash2 = builder.computePrehash(input2);
      Buffer.from(hash1).equals(Buffer.from(hash2)).should.be.false();
    });
  });

  // === Build Tests ===

  describe('build', function () {
    it('should build a STAKE transaction with manually set anchor', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(testFee)
        .setValue(testValue)
        .setSigner(testSigner)
        .setAnchor(testAnchor);

      const result = await builder.build();
      result.prehash.should.be.instanceOf(Uint8Array);
      result.prehash.length.should.equal(32);
      result.rlpEncoded.should.be.instanceOf(Uint8Array);
      result.rlpEncoded.length.should.be.greaterThan(0);
      result.fields.version.should.equal(COMMITMENT_TX_VERSION);
      result.fields.chainId.should.equal(testChainId);
    });

    it('should build a PLEDGE transaction with manually set anchor', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.PLEDGE, pledgeCount: 5n })
        .setFee(testFee)
        .setValue(testValue)
        .setSigner(testSigner)
        .setAnchor(testAnchor);

      const result = await builder.build();
      result.prehash.length.should.equal(32);
      result.fields.commitmentType.should.deepEqual({ type: CommitmentTypeId.PLEDGE, pledgeCount: 5n });
    });

    it('should fetch anchor from API when not manually set', async function () {
      const mockAnchorBase58 = encodeBase58(testAnchor);
      const scope = nock('https://testnet-node1.irys.xyz')
        .get('/v1/anchor')
        .reply(200, { blockHash: mockAnchorBase58 });

      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(testFee)
        .setValue(testValue)
        .setSigner(testSigner);

      const result = await builder.build();
      result.prehash.length.should.equal(32);
      Buffer.from(result.fields.anchor).equals(Buffer.from(testAnchor)).should.be.true();
      scope.done();
    });

    it('should throw if commitment type is not set', async function () {
      builder.setFee(testFee).setValue(testValue).setSigner(testSigner).setAnchor(testAnchor);

      await builder.build().should.be.rejectedWith('Commitment type is required');
    });

    it('should throw if fee is not set', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setValue(testValue)
        .setSigner(testSigner)
        .setAnchor(testAnchor);

      await builder.build().should.be.rejectedWith('Fee is required');
    });

    it('should throw if value is not set', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(testFee)
        .setSigner(testSigner)
        .setAnchor(testAnchor);

      await builder.build().should.be.rejectedWith('Value is required');
    });

    it('should throw if signer is not set', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(testFee)
        .setValue(testValue)
        .setAnchor(testAnchor);

      await builder.build().should.be.rejectedWith('Signer is required');
    });
  });

  // === Validation Tests ===

  describe('input validation', function () {
    it('should reject signer with wrong length', function () {
      (() => builder.setSigner(new Uint8Array(19))).should.throw(/Signer must be 20 bytes/);
      (() => builder.setSigner(new Uint8Array(21))).should.throw(/Signer must be 20 bytes/);
    });

    it('should reject anchor with wrong length', function () {
      (() => builder.setAnchor(new Uint8Array(31))).should.throw(/Anchor must be 32 bytes/);
      (() => builder.setAnchor(new Uint8Array(33))).should.throw(/Anchor must be 32 bytes/);
    });
  });

  // === Transaction ID Tests ===

  describe('computeTxId', function () {
    it('should compute base58(keccak256(signature))', function () {
      const fakeSignature = new Uint8Array(65).fill(0xab);
      const txId = IrysCommitmentTransactionBuilder.computeTxId(fakeSignature);
      txId.should.be.a.String();
      txId.length.should.be.greaterThan(0);
    });

    it('should produce deterministic output', function () {
      const sig = new Uint8Array(65).fill(0xcd);
      const id1 = IrysCommitmentTransactionBuilder.computeTxId(sig);
      const id2 = IrysCommitmentTransactionBuilder.computeTxId(sig);
      id1.should.equal(id2);
    });

    it('should reject non-65-byte signatures', function () {
      (() => IrysCommitmentTransactionBuilder.computeTxId(new Uint8Array(64))).should.throw(
        /Signature must be 65 bytes/
      );
    });
  });

  // === Broadcast Payload Tests ===

  describe('createBroadcastPayload', function () {
    it('should create valid JSON payload for STAKE', function () {
      const fields = {
        version: COMMITMENT_TX_VERSION,
        anchor: testAnchor,
        signer: testSigner,
        commitmentType: { type: CommitmentTypeId.STAKE as const },
        chainId: testChainId,
        fee: testFee,
        value: testValue,
      };
      const signature = new Uint8Array(65).fill(0xab);

      const payload = IrysCommitmentTransactionBuilder.createBroadcastPayload(fields, signature);

      payload.version.should.equal(2);
      payload.anchor.should.be.a.String();
      payload.signer.should.be.a.String();
      should.deepEqual(payload.commitmentType, { type: 'stake' });
      payload.chainId.should.equal('1270');
      payload.fee.should.equal('1000');
      payload.value.should.equal('5000');
      payload.id.should.be.a.String();
      payload.signature.should.be.a.String();
    });

    it('should create valid JSON payload for PLEDGE with pledgeCountBeforeExecuting', function () {
      const fields = {
        version: COMMITMENT_TX_VERSION,
        anchor: testAnchor,
        signer: testSigner,
        commitmentType: { type: CommitmentTypeId.PLEDGE as const, pledgeCount: 42n },
        chainId: testChainId,
        fee: testFee,
        value: testValue,
      };
      const signature = new Uint8Array(65).fill(0xcd);

      const payload = IrysCommitmentTransactionBuilder.createBroadcastPayload(fields, signature);

      should.deepEqual(payload.commitmentType, { type: 'pledge', pledgeCountBeforeExecuting: '42' });
    });
  });

  // === Known-Good Test Vectors (from successful testnet transactions) ===
  //
  // These vectors were captured from actual STAKE and PLEDGE transactions
  // submitted to the Irys testnet using coins-sandbox/eth/irys/stake.ts.
  // They verify our RLP encoding + prehash match the protocol exactly.

  describe('known-good test vectors', function () {
    const testnetSigner = '0x22f9C9f1845D9b6C22b96Ef35E46E265aC4Af30c';
    const testnetSignerBytes = Uint8Array.from(Buffer.from(testnetSigner.slice(2), 'hex'));
    const testnetChainId = 1270n;

    it('should match known STAKE RLP encoding and prehash', async function () {
      // From stake_pledge.txt - successful STAKE transaction
      // TX ID: 4XhUTrkhxr1RmUQbXUVRwbNZ6pKEYrAVo5ymdMY41fS5
      const anchorBase58 = '8JR2rD5DejnM2NuVSqqGa68dfye6ZKruT9rdh2Cn4B8y';
      const anchorBytes = decodeBase58(anchorBase58);

      const stakeBuilder = new IrysCommitmentTransactionBuilder(testApiUrl, testnetChainId);

      stakeBuilder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(100n)
        .setValue(20000000000000000000000n) // 20000 IRYS
        .setSigner(testnetSignerBytes)
        .setAnchor(anchorBytes);

      const result = await stakeBuilder.build();

      const expectedRlp =
        '0xf84702a06c77daebc2db4e572e4f296983d1413fc10d4852e0fabfdb8323c9c69a2b85' +
        '9e9422f9c9f1845d9b6c22b96ef35e46e265ac4af30c018204f6648a043c33c1937564800000';
      const actualRlp = '0x' + Buffer.from(result.rlpEncoded).toString('hex');
      actualRlp.should.equal(expectedRlp);

      const expectedPrehash = '0xe6fe57810c12785e3ce5fa64e2eb4da120b89ec0e469213715916abf36358d01';
      const actualPrehash = '0x' + Buffer.from(result.prehash).toString('hex');
      actualPrehash.should.equal(expectedPrehash);
    });

    it('should match known PLEDGE RLP encoding and prehash', async function () {
      // From stake_pledge.txt - successful PLEDGE transaction
      // TX ID: EsdiesC58S8eeY1SHM5jTfy84zYxFMUdKF89Ytr6PyNb
      const anchorBase58 = 'jUShJPUACW4bxUSvZji65Q96MaqKDh7AFFALKnkapBn';
      const anchorBytes = decodeBase58(anchorBase58);

      const pledgeBuilder = new IrysCommitmentTransactionBuilder(testApiUrl, testnetChainId);

      pledgeBuilder
        .setCommitmentType({ type: CommitmentTypeId.PLEDGE, pledgeCount: 0n })
        .setFee(100n)
        .setValue(950000000000000000000n) // 950 IRYS
        .setSigner(testnetSignerBytes)
        .setAnchor(anchorBytes);

      const result = await pledgeBuilder.build();

      const expectedRlp =
        '0xf84802a00ae16c8476bbde2f28b2e4629d393dfe6fa7affcf0a0c4654f8246a9ba78970594' +
        '22f9c9f1845d9b6c22b96ef35e46e265ac4af30cc202808204f66489337fe5feaf2d180000';
      const actualRlp = '0x' + Buffer.from(result.rlpEncoded).toString('hex');
      actualRlp.should.equal(expectedRlp);

      const expectedPrehash = '0xfe07c2f3c6e50d9c9e2cff57f6d7015b4528f425b6132f567e26bba745228102';
      const actualPrehash = '0x' + Buffer.from(result.prehash).toString('hex');
      actualPrehash.should.equal(expectedPrehash);
    });
  });

  // === Edge Case Tests ===

  describe('edge cases', function () {
    it('should handle zero fee and value', async function () {
      builder
        .setCommitmentType({ type: CommitmentTypeId.STAKE })
        .setFee(0n)
        .setValue(0n)
        .setSigner(testSigner)
        .setAnchor(testAnchor);

      const result = await builder.build();
      result.prehash.length.should.equal(32);
    });
  });

  // === Anchor Fetch Tests ===

  describe('fetchAnchor', function () {
    it('should fetch and decode base58 anchor from API', async function () {
      const mockAnchorBase58 = encodeBase58(testAnchor);
      const scope = nock('https://testnet-node1.irys.xyz')
        .get('/v1/anchor')
        .reply(200, { blockHash: mockAnchorBase58 });

      const anchor = await builder.fetchAnchor();
      anchor.should.be.instanceOf(Uint8Array);
      anchor.length.should.equal(32);
      Buffer.from(anchor).equals(Buffer.from(testAnchor)).should.be.true();
      scope.done();
    });

    it('should throw on non-200 response', async function () {
      const scope = nock('https://testnet-node1.irys.xyz').get('/v1/anchor').reply(500, 'Internal Server Error');

      await builder.fetchAnchor().should.be.rejectedWith(/Internal Server Error/);
      scope.done();
    });

    it('should throw if anchor decodes to wrong length', async function () {
      const shortAnchor = encodeBase58(new Uint8Array(16)); // 16 bytes instead of 32
      const scope = nock('https://testnet-node1.irys.xyz').get('/v1/anchor').reply(200, { blockHash: shortAnchor });

      await builder.fetchAnchor().should.be.rejectedWith(/Expected 32 bytes/);
      scope.done();
    });
  });
});
