import assert from 'assert';
import { ed25519 } from '@noble/curves/ed25519';
import { EddsaMPSDsg, MPSUtil } from '../../../../src/tss/eddsa-mps';
import { deriveUnhardenedMps } from '../../../../src/tss/eddsa-mps/derive';
import { generateEdDsaDKGKeyShares } from './util';

const MESSAGE = Buffer.from('The Times 03/Jan/2009 Chancellor on brink of second bailout for banks');

describe('deriveUnhardenedMps', function () {
  this.timeout(60_000);

  // DKG is expensive; run once and reuse across tests.
  let commonKeychain: string;
  let rootPubKey: Buffer;
  let userKeyShare: Buffer;
  let bitgoKeyShare: Buffer;

  before(async function () {
    const [userDkg, , bitgoDkg] = await generateEdDsaDKGKeyShares();
    commonKeychain = userDkg.getCommonKeychain();
    rootPubKey = userDkg.getSharePublicKey();
    userKeyShare = userDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();
  });

  describe('input validation', function () {
    it('throws when commonKeychainHex is shorter than 128 chars', function () {
      assert.throws(() => deriveUnhardenedMps('deadbeef', 'm'), /expected 128 hex chars/);
    });

    it('throws when commonKeychainHex is longer than 128 chars', function () {
      assert.throws(() => deriveUnhardenedMps('a'.repeat(130), 'm'), /expected 128 hex chars/);
    });
  });

  describe('derivation correctness using existing deriveUnhardened path parsing', function () {
    it('returns the root key unchanged for path "m"', function () {
      const result = deriveUnhardenedMps(commonKeychain, 'm');
      assert.strictEqual(result, commonKeychain, 'Path "m" should return the keychain unchanged');
    });

    it('produces a different key at m/0 than at the root', function () {
      const derived = deriveUnhardenedMps(commonKeychain, 'm/0');
      assert.notStrictEqual(derived.slice(0, 64), commonKeychain.slice(0, 64));
    });

    it('is deterministic — same inputs produce the same output', function () {
      const a = deriveUnhardenedMps(commonKeychain, 'm/0/1');
      const b = deriveUnhardenedMps(commonKeychain, 'm/0/1');
      assert.strictEqual(a, b);
    });

    it('produces different keys for different paths', function () {
      const d0 = deriveUnhardenedMps(commonKeychain, 'm/0');
      const d1 = deriveUnhardenedMps(commonKeychain, 'm/1');
      assert.notStrictEqual(d0.slice(0, 64), d1.slice(0, 64));
    });

    it('output is always 128 hex chars', function () {
      assert.strictEqual(deriveUnhardenedMps(commonKeychain, 'm').length, 128);
      assert.strictEqual(deriveUnhardenedMps(commonKeychain, 'm/0').length, 128);
      assert.strictEqual(deriveUnhardenedMps(commonKeychain, 'm/0/1').length, 128);
    });
  });

  describe('DSG signature cross-check against the public key derived by deriveUnhardenedMps', function () {
    let sigAtRoot: Buffer;
    let sigAtM0: Buffer;
    let sigAtM01: Buffer;

    before(async function () {
      const dsgA1 = new EddsaMPSDsg.DSG(0);
      await MPSUtil.executeTillRound(3, dsgA1, new EddsaMPSDsg.DSG(2), userKeyShare, bitgoKeyShare, MESSAGE, 'm');
      sigAtRoot = dsgA1.getSignature();

      const dsgA2 = new EddsaMPSDsg.DSG(0);
      await MPSUtil.executeTillRound(3, dsgA2, new EddsaMPSDsg.DSG(2), userKeyShare, bitgoKeyShare, MESSAGE, 'm/0');
      sigAtM0 = dsgA2.getSignature();

      const dsgA3 = new EddsaMPSDsg.DSG(0);
      await MPSUtil.executeTillRound(3, dsgA3, new EddsaMPSDsg.DSG(2), userKeyShare, bitgoKeyShare, MESSAGE, 'm/0/1');
      sigAtM01 = dsgA3.getSignature();
    });

    it('signature from DSG at "m" verifies against the root public key', function () {
      assert(ed25519.verify(sigAtRoot, MESSAGE, rootPubKey), 'DSG at "m" should verify against the raw DKG public key');
    });

    it('signature from DSG at "m/0" verifies against deriveUnhardenedMps(commonKeychain, "m/0")', function () {
      const derivedPk = Buffer.from(deriveUnhardenedMps(commonKeychain, 'm/0').slice(0, 64), 'hex');
      assert(
        ed25519.verify(sigAtM0, MESSAGE, derivedPk),
        'DSG at "m/0" should verify against deriveUnhardenedMps result at "m/0"'
      );
    });

    it('signature from DSG at "m/0/1" verifies against deriveUnhardenedMps(commonKeychain, "m/0/1")', function () {
      const derivedPk = Buffer.from(deriveUnhardenedMps(commonKeychain, 'm/0/1').slice(0, 64), 'hex');
      assert(
        ed25519.verify(sigAtM01, MESSAGE, derivedPk),
        'DSG at "m/0/1" should verify against deriveUnhardenedMps result at "m/0/1"'
      );
    });
  });
});
