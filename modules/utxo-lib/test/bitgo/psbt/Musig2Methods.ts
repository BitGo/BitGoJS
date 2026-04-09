import * as assert from 'assert';
import * as crypto from 'crypto';
import {
  createTapOutputKey,
  createAggregateNonce,
  createTapTweak,
  musig2PartialSign,
  musig2PartialSigVerify,
  musig2AggregateSigs,
  createMusig2SigningSession,
  Musig2NonceStore,
  createTapInternalKey,
} from '../../../src/bitgo/Musig2';
import { getKeyTriple } from '../../../src/testutil/keys';
import { RootWalletKeys } from '../../../src/bitgo';
import { Tuple } from '../../../src/bitgo/types';
import { getFixture } from '../../fixture.util';
import { ecc } from '@bitgo/secp256k1';

// Use static keys for deterministic tests
const keyTriple = getKeyTriple('musig2-fixture-test');
const rootWalletKeys = new RootWalletKeys(keyTriple);

// Derive consistent keys for testing
const walletKeys = rootWalletKeys.deriveForChainAndIndex(11, 0);
const pubKeys: Tuple<Buffer> = [walletKeys.user.publicKey, walletKeys.backup.publicKey];

// Static tap tree root for testing (32 bytes)
const tapTreeRoot = crypto.createHash('sha256').update('test-tap-tree-root').digest();

// Static transaction hash for testing (32 bytes)
const txHash = crypto.createHash('sha256').update('test-transaction-hash').digest();

// Helper to create deterministic session IDs for nonce generation
// Session IDs must be unique per signing session to ensure nonce uniqueness
function getSessionId(n: number): Buffer {
  return Buffer.alloc(32, n);
}

// normalize buffers to hex
function toFixture(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Buffer.isBuffer(obj)) {
    return obj.toString('hex');
  }
  if (Array.isArray(obj)) {
    return obj.map(toFixture);
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).flatMap(([key, value]) => (value === undefined ? [] : [[key, toFixture(value)]]))
    );
  }
  return obj;
}

async function assertEqualsFixture<T>(value: T, fixtureName: string): Promise<void> {
  const normalized = toFixture(value);
  const fixturePath = `${__dirname}/../fixtures/musig2/${fixtureName}.json`;
  const fixture = await getFixture(fixturePath, normalized);
  assert.deepStrictEqual(normalized, fixture);
}

describe('Musig2 Methods Fixture Tests', function () {
  describe('createTapInternalKey', function () {
    it('matches fixture', async function () {
      const result = createTapInternalKey(pubKeys);

      await assertEqualsFixture(
        {
          inputs: {
            pubKeys,
          },
          output: {
            tapInternalKey: result,
          },
        },
        'createTapInternalKey'
      );
    });
  });

  describe('createTapOutputKey', function () {
    it('matches fixture', async function () {
      const internalPubKey = createTapInternalKey(pubKeys);
      const result = createTapOutputKey(internalPubKey, tapTreeRoot);

      await assertEqualsFixture(
        {
          inputs: {
            internalPubKey,
            tapTreeRoot,
          },
          output: {
            tapOutputKey: result,
          },
        },
        'createTapOutputKey'
      );
    });
  });

  describe('createTapTweak', function () {
    it('matches fixture', async function () {
      const tapInternalKey = createTapInternalKey(pubKeys);
      const result = createTapTweak(tapInternalKey, tapTreeRoot);

      await assertEqualsFixture(
        {
          inputs: {
            tapInternalKey,
            tapMerkleRoot: tapTreeRoot,
          },
          output: {
            tapTweak: result,
          },
        },
        'createTapTweak'
      );
    });
  });

  describe('createAggregateNonce', function () {
    it('matches fixture', async function () {
      // Generate deterministic nonces using the nonce store
      const nonceStore = new Musig2NonceStore();
      const internalPubKey = createTapInternalKey(pubKeys);
      const tapOutputKey = createTapOutputKey(internalPubKey, tapTreeRoot);

      const pubNonce1 = nonceStore.createMusig2Nonce(
        walletKeys.user.privateKey as Buffer,
        walletKeys.user.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(1)
      );

      const pubNonce2 = nonceStore.createMusig2Nonce(
        walletKeys.backup.privateKey as Buffer,
        walletKeys.backup.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(2)
      );

      const pubNonces: Tuple<Buffer> = [Buffer.from(pubNonce1), Buffer.from(pubNonce2)];
      const result = createAggregateNonce(pubNonces);

      await assertEqualsFixture(
        {
          inputs: {
            pubNonces,
          },
          output: {
            aggregateNonce: result,
          },
        },
        'createAggregateNonce'
      );
    });
  });

  describe('createMusig2SigningSession', function () {
    it('matches fixture', async function () {
      const nonceStore = new Musig2NonceStore();
      const internalPubKey = createTapInternalKey(pubKeys);
      const tapOutputKey = createTapOutputKey(internalPubKey, tapTreeRoot);

      const pubNonce1 = nonceStore.createMusig2Nonce(
        walletKeys.user.privateKey as Buffer,
        walletKeys.user.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(1)
      );

      const pubNonce2 = nonceStore.createMusig2Nonce(
        walletKeys.backup.privateKey as Buffer,
        walletKeys.backup.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(2)
      );

      const pubNonces: Tuple<Buffer> = [Buffer.from(pubNonce1), Buffer.from(pubNonce2)];

      const sessionKey = createMusig2SigningSession({
        pubNonces,
        txHash,
        pubKeys,
        internalPubKey,
        tapTreeRoot,
      });

      await assertEqualsFixture(
        {
          inputs: {
            pubNonces,
            txHash,
            pubKeys,
            internalPubKey,
            tapTreeRoot,
          },
          output: {
            sessionKey: {
              aggNonce: Buffer.from(sessionKey.aggNonce),
              msg: Buffer.from(sessionKey.msg),
              publicKey: Buffer.from(sessionKey.publicKey),
            },
          },
        },
        'createMusig2SigningSession'
      );
    });
  });

  describe('musig2PartialSign and musig2PartialSigVerify', function () {
    it('matches fixture for partial signing and verification', async function () {
      const nonceStore = new Musig2NonceStore();
      const internalPubKey = createTapInternalKey(pubKeys);
      const tapOutputKey = createTapOutputKey(internalPubKey, tapTreeRoot);

      const pubNonce1 = nonceStore.createMusig2Nonce(
        walletKeys.user.privateKey as Buffer,
        walletKeys.user.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(1)
      );

      const pubNonce2 = nonceStore.createMusig2Nonce(
        walletKeys.backup.privateKey as Buffer,
        walletKeys.backup.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(2)
      );

      const pubNonces: Tuple<Buffer> = [Buffer.from(pubNonce1), Buffer.from(pubNonce2)];

      const sessionKey = createMusig2SigningSession({
        pubNonces,
        txHash,
        pubKeys,
        internalPubKey,
        tapTreeRoot,
      });

      // Sign with user key
      const partialSig1 = musig2PartialSign(
        walletKeys.user.privateKey as Buffer,
        Buffer.from(pubNonce1),
        sessionKey,
        nonceStore
      );

      // Sign with backup key
      const partialSig2 = musig2PartialSign(
        walletKeys.backup.privateKey as Buffer,
        Buffer.from(pubNonce2),
        sessionKey,
        nonceStore
      );

      // Verify signatures
      const isValid1 = musig2PartialSigVerify(partialSig1, pubKeys[0], Buffer.from(pubNonce1), sessionKey);

      const isValid2 = musig2PartialSigVerify(partialSig2, pubKeys[1], Buffer.from(pubNonce2), sessionKey);

      await assertEqualsFixture(
        {
          inputs: {
            privateKeys: [walletKeys.user.privateKey, walletKeys.backup.privateKey],
            pubNonces,
            pubKeys,
            txHash,
            internalPubKey,
            tapTreeRoot,
          },
          output: {
            partialSigs: [partialSig1, partialSig2],
            verificationResults: [isValid1, isValid2],
          },
        },
        'musig2PartialSignAndVerify'
      );

      // Assert all signatures are valid
      assert.strictEqual(isValid1, true);
      assert.strictEqual(isValid2, true);
    });
  });

  describe('musig2AggregateSigs', function () {
    it('matches fixture', async function () {
      const nonceStore = new Musig2NonceStore();
      const internalPubKey = createTapInternalKey(pubKeys);
      const tapOutputKey = createTapOutputKey(internalPubKey, tapTreeRoot);

      const pubNonce1 = nonceStore.createMusig2Nonce(
        walletKeys.user.privateKey as Buffer,
        walletKeys.user.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(1)
      );

      const pubNonce2 = nonceStore.createMusig2Nonce(
        walletKeys.backup.privateKey as Buffer,
        walletKeys.backup.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(2)
      );

      const pubNonces: Tuple<Buffer> = [Buffer.from(pubNonce1), Buffer.from(pubNonce2)];

      const sessionKey = createMusig2SigningSession({
        pubNonces,
        txHash,
        pubKeys,
        internalPubKey,
        tapTreeRoot,
      });

      // Create partial signatures
      const partialSig1 = musig2PartialSign(
        walletKeys.user.privateKey as Buffer,
        Buffer.from(pubNonce1),
        sessionKey,
        nonceStore
      );

      const partialSig2 = musig2PartialSign(
        walletKeys.backup.privateKey as Buffer,
        Buffer.from(pubNonce2),
        sessionKey,
        nonceStore
      );

      // Aggregate signatures
      const aggregatedSig = musig2AggregateSigs([partialSig1, partialSig2], sessionKey);

      // Verify the aggregated signature against the tap output key
      const isValidAggregated = ecc.verifySchnorr(txHash, tapOutputKey, aggregatedSig);

      await assertEqualsFixture(
        {
          inputs: {
            partialSigs: [partialSig1, partialSig2],
            pubKeys,
            txHash,
            internalPubKey,
            tapTreeRoot,
          },
          output: {
            aggregatedSig,
            tapOutputKey,
            isValidAggregated,
          },
        },
        'musig2AggregateSigs'
      );

      // Assert the aggregated signature is valid
      assert.strictEqual(isValidAggregated, true);
    });
  });

  describe('Full signing flow', function () {
    it('matches fixture for complete signing process', async function () {
      const nonceStore = new Musig2NonceStore();

      // Step 1: Create tap keys first
      const internalPubKey = createTapInternalKey(pubKeys);
      const tapOutputKey = createTapOutputKey(internalPubKey, tapTreeRoot);
      const tapTweak = createTapTweak(internalPubKey, tapTreeRoot);

      // Step 2: Generate nonces
      const pubNonce1 = nonceStore.createMusig2Nonce(
        walletKeys.user.privateKey as Buffer,
        walletKeys.user.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(1)
      );

      const pubNonce2 = nonceStore.createMusig2Nonce(
        walletKeys.backup.privateKey as Buffer,
        walletKeys.backup.publicKey,
        tapOutputKey,
        txHash,
        getSessionId(2)
      );

      const pubNonces: Tuple<Buffer> = [Buffer.from(pubNonce1), Buffer.from(pubNonce2)];

      // Step 3: Create aggregate nonce
      const aggregateNonce = createAggregateNonce(pubNonces);

      // Step 4: Create signing session
      const sessionKey = createMusig2SigningSession({
        pubNonces,
        txHash,
        pubKeys,
        internalPubKey,
        tapTreeRoot,
      });

      // Step 5: Create partial signatures
      const partialSig1 = musig2PartialSign(
        walletKeys.user.privateKey as Buffer,
        Buffer.from(pubNonce1),
        sessionKey,
        nonceStore
      );

      const partialSig2 = musig2PartialSign(
        walletKeys.backup.privateKey as Buffer,
        Buffer.from(pubNonce2),
        sessionKey,
        nonceStore
      );

      // Step 6: Verify partial signatures
      const isValid1 = musig2PartialSigVerify(partialSig1, pubKeys[0], Buffer.from(pubNonce1), sessionKey);
      const isValid2 = musig2PartialSigVerify(partialSig2, pubKeys[1], Buffer.from(pubNonce2), sessionKey);

      // Step 7: Aggregate signatures
      const aggregatedSig = musig2AggregateSigs([partialSig1, partialSig2], sessionKey);

      // Step 8: Verify final signature
      const isValidFinal = ecc.verifySchnorr(txHash, tapOutputKey, aggregatedSig);

      await assertEqualsFixture(
        {
          staticInputs: {
            pubKeys,
            privateKeys: [walletKeys.user.privateKey, walletKeys.backup.privateKey],
            txHash,
            tapTreeRoot,
          },
          step1_tapKeys: {
            internalPubKey,
            tapOutputKey,
            tapTweak,
          },
          step2_nonces: {
            pubNonce1: Buffer.from(pubNonce1),
            pubNonce2: Buffer.from(pubNonce2),
          },
          step3_aggregateNonce: {
            aggregateNonce,
          },
          step4_sessionKey: {
            aggNonce: Buffer.from(sessionKey.aggNonce),
            msg: Buffer.from(sessionKey.msg),
            publicKey: Buffer.from(sessionKey.publicKey),
          },
          step5_partialSigs: {
            partialSig1,
            partialSig2,
          },
          step6_verification: {
            isValid1,
            isValid2,
          },
          step7_aggregation: {
            aggregatedSig,
          },
          step8_finalVerification: {
            isValidFinal,
          },
        },
        'fullSigningFlow'
      );

      // Assert everything is valid
      assert.strictEqual(isValid1, true);
      assert.strictEqual(isValid2, true);
      assert.strictEqual(isValidFinal, true);
    });
  });
});
