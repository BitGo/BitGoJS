import 'should';
import { createHash } from 'crypto';
import * as nacl from 'tweetnacl';
import {
  DERIVABLE_ED25519_CHAIN_CODE_BYTES,
  DERIVABLE_ED25519_PUB_LENGTH,
  Ed25519BIP32,
  Eddsa,
  bigIntFromBufferLE,
  bigIntToBufferLE,
  clamp,
  decodeDerivableEd25519Pub,
  decodeEd25519StrKeyPublicKey,
  decodeEd25519StrKeySecretSeed,
  encodeDerivableEd25519Pub,
  encodeEd25519ChainCode,
  encodeEd25519StrKeyPublicKey,
  generateEd25519ChainCode,
  assertValidExternalEd25519Signer,
  signWithExternalEd25519Signer,
  isChecksumValidStrKeyEd25519Pub,
  isDerivableEd25519Pub,
  isValidEd25519StrKeyPublicKey,
  signEd25519Extended,
  softDeriveChildPubEd25519,
  softDeriveChildPubEd25519AtPath,
  softDeriveChildPrvEd25519AtPath,
  type ExternalEd25519Signer,
} from '../../../../src';

// Cross-repo fixture: byte-identical to wallet-platform
// test/unit/base/safes/fixtures/derivableEd25519Pub.json. Four independent implementations of this
// format will otherwise drift, and the failure mode is unrecoverable wallets.
import * as fixture from './fixtures/derivableEd25519Pub.json';

const PUBLIC_KEY = Buffer.alloc(32);
const CHAIN_CODE = Buffer.alloc(32, 0xab);
const ROOT_PUB = encodeDerivableEd25519Pub(PUBLIC_KEY, CHAIN_CODE);
const ROOT_KEYCHAIN = Buffer.concat([PUBLIC_KEY, CHAIN_CODE]).toString('hex');
const STRKEY_PUBLIC = 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH';
const STRKEY_SEED = 'SAAACAQDAQCQMBYIBEFAWDANBYHRAEISCMKBKFQXDAMRUGY4DUPB6NKI';

describe('derivableEd25519Pub', function () {
  describe('base32 root format', function () {
    it('encodes 32-byte public key plus 32-byte chain code', function () {
      DERIVABLE_ED25519_CHAIN_CODE_BYTES.should.equal(32);
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(103);
      ROOT_PUB.should.match(/^[A-Z2-7]{103}$/);
      decodeDerivableEd25519Pub(ROOT_PUB).pub.equals(PUBLIC_KEY).should.equal(true);
      decodeDerivableEd25519Pub(ROOT_PUB).chainCode.equals(CHAIN_CODE).should.equal(true);
    });

    it('matches the constants pinned in the shared fixture', function () {
      DERIVABLE_ED25519_PUB_LENGTH.should.equal(fixture.rootPubBase32Length);
      DERIVABLE_ED25519_CHAIN_CODE_BYTES.should.equal(fixture.chainCodeBytes);
    });

    it('generates raw chain code for root composition', function () {
      generateEd25519ChainCode().length.should.equal(32);
    });
  });

  describe('fixture vectors', function () {
    for (const vector of fixture.valid) {
      it(`round-trips ${vector.name}`, function () {
        const composite = encodeDerivableEd25519Pub(
          Buffer.from(vector.pub, 'hex'),
          Buffer.from(vector.chainCode, 'hex')
        );
        composite.should.equal(vector.composite);
        const decoded = decodeDerivableEd25519Pub(vector.composite);
        decoded.pub.toString('hex').should.equal(vector.pub);
        decoded.chainCode.toString('hex').should.equal(vector.chainCode);
        isDerivableEd25519Pub(vector.composite).should.equal(true);
      });
    }

    for (const vector of fixture.invalidComposite) {
      it(`rejects ${vector.name}`, function () {
        isDerivableEd25519Pub(vector.composite).should.equal(false);
        (() => decodeDerivableEd25519Pub(vector.composite)).should.throw(/Invalid derivable ed25519 pub/);
      });
    }
  });

  describe('raw public soft derivation', function () {
    it('derives a deterministic public key and discards the child chain code', async function () {
      const eddsa = await Eddsa.initialize(await Ed25519BIP32.initialize());
      const derived = eddsa.deriveUnhardened(ROOT_KEYCHAIN, 'm/7');
      derived.length.should.equal(128);
      derived.slice(0, 64).should.match(/^[0-9a-f]{64}$/);
      derived.slice(64).should.match(/^[0-9a-f]{64}$/);
      (await softDeriveChildPubEd25519(ROOT_PUB, 7)).toString('hex').should.equal(derived.slice(0, 64));
    });

    // The golden vectors below pin the unhardened derivation output shared cross-repo with
    // wallet-platform: a divergent implementation derives co-signer keys nobody else can
    // reproduce, permanently bricking the wallets minted with it.
    for (const vector of fixture.softDerivation) {
      it(`derives the pinned golden child: ${vector.name}`, async function () {
        // The pub/chainCode fields must encode to the composite actually derived from.
        encodeDerivableEd25519Pub(Buffer.from(vector.pub, 'hex'), Buffer.from(vector.chainCode, 'hex')).should.equal(
          vector.composite
        );
        const child = await softDeriveChildPubEd25519(vector.composite, vector.index);
        child.toString('hex').should.equal(vector.childPub);
      });
    }

    it('rejects a hardened or out-of-range index', async function () {
      await softDeriveChildPubEd25519(ROOT_PUB, -1).should.be.rejectedWith(/non-hardened/);
      await softDeriveChildPubEd25519(ROOT_PUB, 0x80000000).should.be.rejectedWith(/non-hardened/);
      await softDeriveChildPubEd25519(ROOT_PUB, 1.5).should.be.rejectedWith(/non-hardened/);
    });

    it('rejects a malformed root', async function () {
      await softDeriveChildPubEd25519(fixture.invalidComposite[1].composite, 0).should.be.rejectedWith(
        /Invalid derivable ed25519 pub/
      );
      await softDeriveChildPubEd25519(STRKEY_PUBLIC, 0).should.be.rejectedWith(/Invalid derivable ed25519 pub/);
    });
  });

  describe('multi-segment soft derivation', function () {
    const seed = decodeEd25519StrKeySecretSeed(STRKEY_SEED);
    const rootPub = Buffer.from(nacl.sign.keyPair.fromSeed(seed).publicKey);
    const rootChainCode = Buffer.alloc(32, 0xab);
    const composite = encodeDerivableEd25519Pub(rootPub, rootChainCode);
    const chainCodeStr = encodeEd25519ChainCode(rootChainCode);

    it('private derive public half matches public derive at m/0 and m/44/283/2/0', async function () {
      for (const path of ['m/0', 'm/44/283/2/0']) {
        const pub = await softDeriveChildPubEd25519AtPath(composite, path);
        const prv = await softDeriveChildPrvEd25519AtPath({ seedStrKey: STRKEY_SEED, chainCode: chainCodeStr, path });
        prv.pub.equals(pub).should.equal(true);
        // Recompute the public point directly from kL to prove the private scalar maps to pub.
        bigIntToBufferLE(Eddsa.curve.basePointMult(bigIntFromBufferLE(prv.kL)), 32)
          .equals(prv.pub)
          .should.equal(true);
      }
    });

    it('rejects hardened and out-of-range paths', async function () {
      await softDeriveChildPubEd25519AtPath(composite, "m/0'").should.be.rejectedWith(/Invalid soft derivation path/);
      await softDeriveChildPrvEd25519AtPath({
        seedStrKey: STRKEY_SEED,
        chainCode: chainCodeStr,
        path: "m/0'",
      }).should.be.rejectedWith(/Invalid soft derivation path/);
      await softDeriveChildPubEd25519AtPath(composite, 'm/2147483648').should.be.rejectedWith(/out of range/);
    });
  });

  describe('Stellar user-key codecs', function () {
    it('keeps Stellar encoding separate from the neutral root format', function () {
      isValidEd25519StrKeyPublicKey(STRKEY_PUBLIC).should.equal(true);
      encodeEd25519StrKeyPublicKey(decodeEd25519StrKeyPublicKey(STRKEY_PUBLIC)).should.equal(STRKEY_PUBLIC);
      decodeEd25519StrKeySecretSeed(STRKEY_SEED).length.should.equal(32);
      isDerivableEd25519Pub(STRKEY_PUBLIC).should.equal(false);
      isChecksumValidStrKeyEd25519Pub(STRKEY_PUBLIC).should.equal(true);
    });

    it('rejects a public key with a corrupted checksum', function () {
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYA').should.equal(false);
    });

    it('rejects a secret seed where a public key is required', function () {
      isValidEd25519StrKeyPublicKey('SA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH').should.equal(false);
      (() => decodeEd25519StrKeyPublicKey('SA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH')).should.throw(
        /StrKey public key/
      );
    });

    it('rejects a non-base32 character, the empty string, and lowercase', function () {
      isValidEd25519StrKeyPublicKey('GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKY1').should.equal(false);
      isValidEd25519StrKeyPublicKey('').should.equal(false);
      isValidEd25519StrKeyPublicKey(STRKEY_PUBLIC.toLowerCase()).should.equal(false);
    });
  });

  describe('extended-key signing', function () {
    const seed = decodeEd25519StrKeySecretSeed(STRKEY_SEED);
    const message = Buffer.from('extended-key signature');
    const rootChainCode = Buffer.alloc(32, 0xab);
    const chainCodeStr = encodeEd25519ChainCode(rootChainCode);

    it('matches the seed-based signer for a seed-backed key', async function () {
      const h = createHash('sha512').update(seed).digest();
      const kL = bigIntToBufferLE(clamp(bigIntFromBufferLE(h.subarray(0, 32))), 32);
      const kR = h.subarray(32);
      const sig = await signEd25519Extended(message, kL, kR);
      const expected = Buffer.from(nacl.sign.detached(message, nacl.sign.keyPair.fromSeed(seed).secretKey));
      sig.equals(expected).should.equal(true);
    });

    it('signs a soft-derived key with no seed and verifies against its pub', async function () {
      const prv = await softDeriveChildPrvEd25519AtPath({
        seedStrKey: STRKEY_SEED,
        chainCode: chainCodeStr,
        path: 'm/0',
      });
      const sig = await signEd25519Extended(message, prv.kL, prv.kR);
      nacl.sign.detached.verify(message, sig, prv.pub).should.equal(true);
      // The soft-derived scalar has no seed: treating kL as a seed yields a different pub.
      Buffer.from(nacl.sign.keyPair.fromSeed(prv.kL).publicKey).equals(prv.pub).should.equal(false);
    });

    it('rejects kL/kR that are not 32 bytes', async function () {
      await signEd25519Extended(message, Buffer.alloc(31), Buffer.alloc(32)).should.be.rejectedWith(/kL length/);
      await signEd25519Extended(message, Buffer.alloc(32), Buffer.alloc(33)).should.be.rejectedWith(/kR length/);
    });
  });

  describe('ExternalEd25519Signer', function () {
    const message = Buffer.from('external-signer message');
    const keyPair = nacl.sign.keyPair.fromSeed(Buffer.alloc(32, 0x42));
    const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
    const otherKeyPair = nacl.sign.keyPair.fromSeed(Buffer.alloc(32, 0x77));
    const validSigner: ExternalEd25519Signer = {
      publicKey,
      sign: async (m: Uint8Array) => ({
        signature: Buffer.from(nacl.sign.detached(m, keyPair.secretKey)).toString('hex'),
      }),
    };

    it('rejects a malformed public key', function () {
      (() =>
        assertValidExternalEd25519Signer({
          publicKey: 'not-hex',
          sign: async () => ({ signature: 'a'.repeat(128) }),
        })).should.throw(/expected 32 bytes/);
    });

    it('rejects a public key with trailing garbage after 64 hex chars', function () {
      // Buffer.from(pub, 'hex') truncates at the first bad pair, so a length-only check would
      // accept this; the strict regex must not.
      (() =>
        assertValidExternalEd25519Signer({
          publicKey: 'f1'.repeat(32) + 'zz',
          sign: async () => ({ signature: 'a'.repeat(128) }),
        })).should.throw(/expected 32 bytes/);
    });

    it('rejects a signer without a sign function', function () {
      (() =>
        assertValidExternalEd25519Signer({
          publicKey,
          sign: undefined as unknown as ExternalEd25519Signer['sign'],
        })).should.throw(/sign must be a function/);
    });

    it('rejects a non-64-byte signature', async function () {
      await signWithExternalEd25519Signer(
        { publicKey, sign: async () => ({ signature: 'ab' }) },
        message
      ).should.be.rejectedWith(/expected 64 bytes/);
    });

    it('rejects when sign resolves to a non-object', async function () {
      await signWithExternalEd25519Signer(
        { publicKey, sign: async () => null as unknown as { signature: string } },
        message
      ).should.be.rejectedWith(/sign must resolve to \{ signature: string \}/);
    });

    it('rejects a well-formed signature from the wrong key', async function () {
      await signWithExternalEd25519Signer(
        {
          publicKey,
          sign: async (m: Uint8Array) => ({
            signature: Buffer.from(nacl.sign.detached(m, otherKeyPair.secretKey)).toString('hex'),
          }),
        },
        message
      ).should.be.rejectedWith(/does not verify against its public key/);
    });

    it('signs and returns a verified 64-byte signature', async function () {
      const signature = await signWithExternalEd25519Signer(validSigner, message);
      signature.should.match(/^[0-9a-f]{128}$/);
      nacl.sign.detached.verify(message, Buffer.from(signature, 'hex'), keyPair.publicKey).should.equal(true);
    });
  });
});
