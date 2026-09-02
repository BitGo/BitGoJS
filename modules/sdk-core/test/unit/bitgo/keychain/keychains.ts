import * as sinon from 'sinon';
import 'should';
import { Keychains, decodeDerivableEd25519Pub } from '../../../../src';

/**
 * Slot-④ root keys are generated as XLM keychains, so `create()` yields a 56-char StrKey pub.
 * Taken from the cross-repo fixture pinned in WCN-2485.
 */
const STRKEY_PUB = 'GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH';

/** Marks the key as a safe root; combined with the pub's shape this identifies slot ④. */
const SAFE_ID = 'safe-1';

/** An xpub, as the secp256k1Multisig (slot ①) root coin generates. Already has a chain code. */
const XPUB =
  'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';

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

  describe('safe ed25519Multisig root (slot ④)', function () {
    it('posts a 108-char composite pub built from the generated key', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });

      const pub = sentBody().pub as string;
      pub.length.should.equal(108);
      decodeDerivableEd25519Pub(pub).pub.should.equal(STRKEY_PUB);
    });

    it('mints a chain code that round-trips out of the pub', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });

      // The chain code has no field of its own; this decode is how callers (e.g. the keycard's
      // box B) recover it.
      const { chainCode } = decodeDerivableEd25519Pub(sentBody().pub as string);
      chainCode.should.match(/^[A-Z2-7]{52}$/);
    });

    it('mints a different chain code for each backup key', async function () {
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });
      await keychains.createBackup({ passphrase: 'pw', safeId: SAFE_ID });

      const first = decodeDerivableEd25519Pub(send.firstCall.args[0].pub).chainCode;
      const second = decodeDerivableEd25519Pub(send.secondCall.args[0].pub).chainCode;
      first.should.not.equal(second);
    });

    it('sends no chainCode field of its own', async function () {
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

    it('does not compose a safe secp256k1Multisig root (slot ①)', async function () {
      // An xpub already carries its own chain code; composing onto it would corrupt the pub.
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

    it('leaves a TSS backup key untouched', async function () {
      // No local keypair is generated on the TSS path, so there is no pub to inspect or compose.
      await keychains.createBackup({ prv: 'tss-prv', commonKeychain: 'common-keychain', safeId: SAFE_ID });

      const body = sentBody();
      body.commonKeychain!.should.equal('common-keychain');
      (body.pub === undefined).should.be.true();
    });

    it('leaves a KRS-provider backup key untouched', async function () {
      await keychains.createBackup({ provider: 'krs-provider', safeId: SAFE_ID });

      const body = sentBody();
      (body.pub === undefined).should.be.true();
      body.provider!.should.equal('krs-provider');
    });
  });
});
