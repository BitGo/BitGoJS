import * as sinon from 'sinon';
import 'should';
import { Keychains, decodeDerivableEd25519Pub } from '../../../../src';
import type { IEncryptionSession } from '../../../../src/api';

/** Slot-④ roots are generated as XLM keychains, then persisted as raw pub||chain-code base32. */
const STRKEY_PUB = 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH';
const SAFE_ID = 'safe-1';
const XPUB =
  'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
const BASE32_ROOT = /^[A-Z2-7]{103}$/;

describe('Keychains.createBackup', function () {
  let keychains: Keychains;
  let send: sinon.SinonStub;
  let mockBitGo: any;

  /** The body actually handed to `.send()` — i.e. what goes on the wire. */
  function sentBody(): Record<string, unknown> {
    return send.firstCall.args[0];
  }

  function buildKeychains(pub = STRKEY_PUB): Keychains {
    const mockBaseCoin = {
      url: sinon.stub().callsFake((path: string) => path),
      generateKeyPair: sinon.stub().returns({ pub, prv: 'SOME_SEED' }),
    };
    return new Keychains(mockBitGo, mockBaseCoin as any);
  }

  beforeEach(function () {
    send = sinon.stub().returns({ result: sinon.stub().resolves({ id: 'backup-key-id' }) });
    mockBitGo = {
      post: sinon.stub().returns({ send }),
      encrypt: sinon.stub().resolves('encrypted-prv'),
      setRequestTracer: sinon.stub(),
    };
    keychains = buildKeychains();
  });

  describe('safe child key registration', function () {
    it('serializes the hardened derivation path', async function () {
      await keychains.add({
        pub: XPUB,
        source: 'user',
        keyType: 'independent',
        parent: 'user-root-id',
        safeId: SAFE_ID,
        derivedFromParentWithPath: "m/7'",
      });

      const derivedPath = sentBody().derivedFromParentWithPath;
      if (typeof derivedPath !== 'string') {
        throw new Error('expected derivedFromParentWithPath to be serialized');
      }
      derivedPath.should.equal("m/7'");
    });
  });

  describe('safe ed25519Multisig root (slot ④)', function () {
    it('posts raw public key plus chain code as unpadded base32', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });

      const pub = sentBody().pub as string;
      BASE32_ROOT.test(pub).should.equal(true);
      decodeDerivableEd25519Pub(pub)
        .pub.toString('hex')
        .should.match(/^[0-9a-f]{64}$/);
      decodeDerivableEd25519Pub(pub)
        .chainCode.toString('hex')
        .should.match(/^[0-9a-f]{64}$/);
    });

    it('mints a different chain code for each backup key', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      const first = decodeDerivableEd25519Pub(send.firstCall.args[0].pub).chainCode;
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      const second = decodeDerivableEd25519Pub(send.secondCall.args[0].pub).chainCode;
      first.equals(second).should.equal(false);
    });

    it('sends no separate chainCode field', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      sentBody().should.not.have.property('chainCode');
    });

    it('still encrypts and returns the un-composed prv', async function () {
      const result = await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      sentBody().encryptedPrv!.should.equal('encrypted-prv');
      result.prv!.should.equal('SOME_SEED');
    });
  });

  describe('leaves every other key untouched', function () {
    it('does not compose without a safeId, even for an ed25519 coin', async function () {
      await keychains.createBackup({ passphrase: 'pw' });
      const body = sentBody();
      body.pub!.should.equal(STRKEY_PUB);
      (body.pub as string).length.should.equal(56);
    });

    it('does not compose a safe secp256k1Multisig root', async function () {
      const btcKeychains = buildKeychains(XPUB);
      await btcKeychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      sentBody().pub!.should.equal(XPUB);
    });

    it('sends a body with no chainCode and source backup', async function () {
      await keychains.createBackup({ passphrase: 'pw' });

      const body = sentBody();
      body.should.not.have.property('chainCode');
      body.source!.should.equal('backup');
      body.encryptedPrv!.should.equal('encrypted-prv');
    });

    it('leaves a KRS-provider backup key untouched', async function () {
      await keychains.createBackup({ provider: 'krs-provider', safeId: SAFE_ID });

      const body = sentBody();
      (body.pub === undefined).should.be.true();
      body.provider!.should.equal('krs-provider');
    });
  });
  describe('password rotation encryption session', function () {
    it('uses the supplied session for the new encrypted private key', async function () {
      mockBitGo.decrypt = sinon.stub().resolves('decrypted-prv');
      const sessionEncrypt = sinon.stub().resolves('session-encrypted');
      const session: IEncryptionSession = {
        encrypt: sessionEncrypt,
        decrypt: sinon.stub().resolves('decrypted-prv'),
        destroy: sinon.stub(),
      };

      const updatedKeychain = await keychains.updateSingleKeychainPassword({
        keychain: {
          id: 'key-id',
          encryptedPrv: 'legacy-encrypted-prv',
          type: 'independent',
        },
        oldPassword: 'old-password',
        newPassword: 'new-password',
        encryptionVersion: 2,
        encryptionSession: session,
      });

      sessionEncrypt.calledOnceWithExactly('decrypted-prv').should.equal(true);
      mockBitGo.encrypt.called.should.equal(false);
      updatedKeychain.encryptedPrv!.should.equal('session-encrypted');
    });
  });
});
