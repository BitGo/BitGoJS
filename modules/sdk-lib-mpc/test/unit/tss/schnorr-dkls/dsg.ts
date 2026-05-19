/**
 * Unit tests for SchnorrDsg: two-party BIP-340 Schnorr threshold signing.
 *
 * These tests:
 *   1. Generate fresh 2-of-2 DKLS keyshares via `generate2of2KeyShares`.
 *   2. Run a 2-round SchnorrDsg ceremony between party 0 and party 1.
 *   3. Assert that both parties produce the same (R, S) signature.
 *   4. Verify the 64-byte output is a valid BIP-340 Schnorr signature using
 *      `@noble/curves/secp256k1` `schnorr.verify`.
 *   5. Repeat for a non-root derivation path and for a 3-party 2-of-3 scenario.
 */

import { schnorr, secp256k1 as nobleSecp } from '@noble/curves/secp256k1';
import { decode } from 'cbor-x';
import * as crypto from 'crypto';
import { createHmac } from 'crypto';
import should from 'should';
import { SchnorrDsg, SchnorrDklsSignature } from '../../../../src/tss/schnorr-dkls/dsg';
import { generate2of2KeyShares, generateDKGKeyShares } from '../../../../src/tss/ecdsa-dkls/util';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Run the full 2-round SchnorrDsg ceremony and return the signature. */
async function runCeremony(
  ks0: Buffer,
  ks1: Buffer,
  party0Idx: number,
  party1Idx: number,
  signingParties: number[],
  derivationPath: string,
  messageHash: Buffer
): Promise<SchnorrDklsSignature> {
  const p0 = new SchnorrDsg(ks0, party0Idx, signingParties, derivationPath, messageHash);
  const p1 = new SchnorrDsg(ks1, party1Idx, signingParties, derivationPath, messageHash);

  // Round 1
  const r0 = await p0.init();
  const r1 = await p1.init();

  // Round 2: each party receives the other's nonce point
  const s0msgs = p0.handleIncomingMessages({ broadcastMessages: [r1], p2pMessages: [] });
  const s1msgs = p1.handleIncomingMessages({ broadcastMessages: [r0], p2pMessages: [] });

  // Combine: each party receives the other's partial scalar
  p0.handleIncomingMessages({ broadcastMessages: s1msgs.broadcastMessages, p2pMessages: [] });
  p1.handleIncomingMessages({ broadcastMessages: s0msgs.broadcastMessages, p2pMessages: [] });

  // Both parties must agree on the final signature
  should.equal(
    Buffer.from(p0.signature.R).toString('hex'),
    Buffer.from(p1.signature.R).toString('hex'),
    'R must match between parties'
  );
  should.equal(
    Buffer.from(p0.signature.S).toString('hex'),
    Buffer.from(p1.signature.S).toString('hex'),
    'S must match between parties'
  );

  return p0.signature;
}

/**
 * Get the BIP-32 derived x-only public key (32 bytes) for BIP-340 verification.
 *
 * Mirrors the HMAC-SHA512 derivation in `SchnorrDsg.derivePath` exactly so that
 * the test verifies the right key without going through a separate library path.
 */
function getDerivedXOnlyPubKey(keyShare: Buffer, derivationPath: string): Buffer {
  const ks = decode(keyShare);
  let pub = Buffer.from(ks.public_key ?? ks.pub); // 33-byte compressed
  let cc = Buffer.from(ks.root_chain_code ?? ks.rootChainCode); // 32-byte chaincode

  if (derivationPath !== 'm' && derivationPath !== '') {
    const parts = derivationPath.replace(/^m\/?/, '').split('/');
    for (const p of parts) {
      const index = parseInt(p, 10);
      const indexBuf = Buffer.alloc(4);
      indexBuf.writeUInt32BE(index, 0);
      const I = Buffer.from(createHmac('sha512', cc).update(pub).update(indexBuf).digest());
      const IL = BigInt('0x' + I.slice(0, 32).toString('hex'));
      cc = I.slice(32);
      const point = nobleSecp.ProjectivePoint.fromHex(pub.toString('hex'));
      const child = point.add(nobleSecp.ProjectivePoint.BASE.multiply(IL));
      pub = Buffer.from(child.toRawBytes(true));
    }
  }

  return pub.slice(1); // 32-byte x-only (drop the 0x02/0x03 parity prefix)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('SchnorrDsg (BIP-340 threshold Schnorr)', function () {
  this.timeout(60_000);

  let ks0: Buffer;
  let ks1: Buffer;
  let ksUser: Buffer;
  let ksBackup: Buffer;
  let ksBitgo: Buffer;

  before('generate 2-of-2 DKLS keyshares', async function () {
    const [partyA, partyB] = await generate2of2KeyShares();
    ks0 = partyA.getKeyShare();
    ks1 = partyB.getKeyShare();
  });

  before('generate 3-party 2-of-3 DKLS keyshares', async function () {
    const [user, backup, bitgo] = await generateDKGKeyShares();
    ksUser = user.getKeyShare();
    ksBackup = backup.getKeyShare();
    ksBitgo = bitgo.getKeyShare();
  });

  // ── 2-of-2 signing ──────────────────────────────────────────────────────────

  describe('2-of-2 key shares (n=2, t=2)', function () {
    const vectors: { label: string; derivationPath: string }[] = [
      { label: 'root key (m)', derivationPath: 'm' },
      { label: 'one-level derivation (m/0)', derivationPath: 'm/0' },
      { label: 'two-level derivation (m/1/2)', derivationPath: 'm/1/2' },
      { label: 'deep path (m/0/0/0/0)', derivationPath: 'm/0/0/0/0' },
    ];

    for (const { label, derivationPath } of vectors) {
      it(`produces a valid BIP-340 Schnorr signature — ${label}`, async function () {
        const messageHash = Buffer.from(crypto.randomBytes(32));

        const sig = await runCeremony(ks0, ks1, 0, 1, [0, 1], derivationPath, messageHash);

        const sigBytes = Buffer.concat([Buffer.from(sig.R), Buffer.from(sig.S)]);
        const xOnlyPub = getDerivedXOnlyPubKey(ks0, derivationPath);

        // BIP-340 Schnorr verification using @noble/curves
        const valid = schnorr.verify(sigBytes, messageHash, xOnlyPub);
        valid.should.equal(true, `schnorr.verify failed for path "${derivationPath}"`);
      });
    }

    it('produces different signatures for different messages', async function () {
      const hash1 = Buffer.from(crypto.randomBytes(32));
      const hash2 = Buffer.from(crypto.randomBytes(32));

      const sig1 = await runCeremony(ks0, ks1, 0, 1, [0, 1], 'm', hash1);
      const sig2 = await runCeremony(ks0, ks1, 0, 1, [0, 1], 'm', hash2);

      // Signatures for different messages must differ (overwhelmingly likely)
      Buffer.from(sig1.S).toString('hex').should.not.equal(Buffer.from(sig2.S).toString('hex'));
    });

    it('rejects signing the same PSKT nonce twice (distinct sessions, distinct k_i)', async function () {
      // Each SchnorrDsg instance generates a fresh nonce in init().
      // Running the ceremony twice should yield different R values.
      const hash = Buffer.from(crypto.randomBytes(32));
      const sig1 = await runCeremony(ks0, ks1, 0, 1, [0, 1], 'm', hash);
      const sig2 = await runCeremony(ks0, ks1, 0, 1, [0, 1], 'm', hash);

      // Same message but fresh nonces → different R (and almost certainly different S)
      Buffer.from(sig1.R).toString('hex').should.not.equal(Buffer.from(sig2.R).toString('hex'));
    });
  });

  // ── 3-party 2-of-3 signing ──────────────────────────────────────────────────

  describe('3-party 2-of-3 key shares (n=3, t=2)', function () {
    it('user (0) + BitGo (2) sign at root — valid BIP-340 signature', async function () {
      const messageHash = Buffer.from(crypto.randomBytes(32));
      const sig = await runCeremony(ksUser, ksBitgo, 0, 2, [0, 2], 'm', messageHash);

      const sigBytes = Buffer.concat([Buffer.from(sig.R), Buffer.from(sig.S)]);
      const xOnlyPub = getDerivedXOnlyPubKey(ksUser, 'm');

      schnorr.verify(sigBytes, messageHash, xOnlyPub).should.equal(true);
    });

    it('user (0) + BitGo (2) sign at m/0 — valid BIP-340 signature', async function () {
      const messageHash = Buffer.from(crypto.randomBytes(32));
      const sig = await runCeremony(ksUser, ksBitgo, 0, 2, [0, 2], 'm/0', messageHash);

      const sigBytes = Buffer.concat([Buffer.from(sig.R), Buffer.from(sig.S)]);
      const xOnlyPub = getDerivedXOnlyPubKey(ksUser, 'm/0');

      schnorr.verify(sigBytes, messageHash, xOnlyPub).should.equal(true);
    });

    it('backup (1) + BitGo (2) sign at root — valid BIP-340 signature', async function () {
      const messageHash = Buffer.from(crypto.randomBytes(32));
      const sig = await runCeremony(ksBackup, ksBitgo, 1, 2, [1, 2], 'm', messageHash);

      const sigBytes = Buffer.concat([Buffer.from(sig.R), Buffer.from(sig.S)]);
      const xOnlyPub = getDerivedXOnlyPubKey(ksBackup, 'm');

      schnorr.verify(sigBytes, messageHash, xOnlyPub).should.equal(true);
    });

    it('different signing subsets produce signatures for the SAME public key', async function () {
      // {user, BitGo} and {backup, BitGo} sign the same message; the public key
      // (root x-only) should be the same, and both signatures must verify.
      const messageHash = Buffer.from(crypto.randomBytes(32));

      const sig02 = await runCeremony(ksUser, ksBitgo, 0, 2, [0, 2], 'm', messageHash);
      const sig12 = await runCeremony(ksBackup, ksBitgo, 1, 2, [1, 2], 'm', messageHash);

      const xOnlyPub0 = getDerivedXOnlyPubKey(ksUser, 'm');
      const xOnlyPub1 = getDerivedXOnlyPubKey(ksBackup, 'm');

      // All parties share the same root public key.
      xOnlyPub0.toString('hex').should.equal(xOnlyPub1.toString('hex'));

      schnorr
        .verify(Buffer.concat([Buffer.from(sig02.R), Buffer.from(sig02.S)]), messageHash, xOnlyPub0)
        .should.equal(true, 'sig from {user, BitGo} must verify');
      schnorr
        .verify(Buffer.concat([Buffer.from(sig12.R), Buffer.from(sig12.S)]), messageHash, xOnlyPub1)
        .should.equal(true, 'sig from {backup, BitGo} must verify');
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  describe('input validation', function () {
    it('rejects messageHash that is not 32 bytes', function () {
      should.throws(() => new SchnorrDsg(ks0, 0, [0, 1], 'm', Buffer.alloc(31)), /messageHash must be 32 bytes/);
    });

    it('rejects partyIdx not in signingPartyIndices', function () {
      should.throws(
        () => new SchnorrDsg(ks0, 2, [0, 1], 'm', Buffer.alloc(32)),
        /must be included in signingPartyIndices/
      );
    });

    it('rejects signingPartyIndices with fewer than 2 parties', function () {
      should.throws(() => new SchnorrDsg(ks0, 0, [0], 'm', Buffer.alloc(32)), /at least 2 parties/);
    });

    it('rejects hardened derivation path', function () {
      should.throws(() => new SchnorrDsg(ks0, 0, [0, 1], "m/44'", Buffer.alloc(32)), /Hardened derivation/);
    });

    it('rejects calling handleIncomingMessages before init()', function () {
      const dsg = new SchnorrDsg(ks0, 0, [0, 1], 'm', Buffer.alloc(32));
      should.throws(() => dsg.handleIncomingMessages({ broadcastMessages: [], p2pMessages: [] }), /unexpected state/);
    });

    it('rejects calling init() twice', async function () {
      const dsg = new SchnorrDsg(ks0, 0, [0, 1], 'm', Buffer.alloc(32));
      await dsg.init();
      await dsg.init().should.be.rejectedWith(/already initialized/);
    });

    it('rejects reading signature before ceremony completes', function () {
      const dsg = new SchnorrDsg(ks0, 0, [0, 1], 'm', Buffer.alloc(32));
      should.throws(() => dsg.signature, /not produced yet/);
    });
  });
});
