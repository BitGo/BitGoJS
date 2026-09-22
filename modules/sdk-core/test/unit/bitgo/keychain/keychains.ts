import * as sinon from 'sinon';
import 'should';
import { Keychains, decodeDerivableEd25519Pub } from '../../../../src';
import type { IEncryptionSession } from '../../../../src/api';
import type { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { IncorrectPasswordError } from '../../../../src/bitgo/errors';
import type { IBaseCoin } from '../../../../src/bitgo/baseCoin/iBaseCoin';
import type { Keychain, ListKeychainOptions } from '../../../../src/bitgo/keychain/iKeychains';

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

describe('Keychains.updatePassword (safe mode)', function () {
  const SAFE_ID = 'safe-123';
  const OLD_PASSWORD = 'old-passphrase';
  const NEW_PASSWORD = 'new-passphrase';

  let keychains: Keychains;
  let decryptStub: sinon.SinonStub;
  let sessionEncrypt: sinon.SinonStub;
  let sessionDestroy: sinon.SinonSpy;
  let createEncryptionSession: sinon.SinonStub;
  let url: sinon.SinonStub;
  let put: sinon.SinonStub;
  let send: sinon.SinonStub;

  /** sinon records untyped args; this is the only shape updateSafePassword puts on the wire. */
  interface SentBulkBody {
    updates: { keyId: string; encryptedPrv: string; expectedOldEncryptedPrv: string }[];
  }

  function sentBodies(): SentBulkBody[] {
    return send.getCalls().map((call) => call.args[0] as SentBulkBody);
  }

  function key(id: string, overrides: Partial<Keychain> = {}): Keychain {
    return { id, pub: `pub-${id}`, type: 'independent', encryptedPrv: `enc:prv-${id}`, ...overrides };
  }

  function stubListPages(pages: Keychain[][]): sinon.SinonStub {
    const listStub = sinon.stub(keychains, 'list');
    listStub.callsFake(async (params: ListKeychainOptions = {}) => {
      const pageIndex = params.prevId === undefined ? 0 : Number(params.prevId);
      return {
        keys: pages[pageIndex],
        nextBatchPrevId: pageIndex + 1 < pages.length ? String(pageIndex + 1) : undefined,
      };
    });
    return listStub;
  }

  beforeEach(function () {
    sessionEncrypt = sinon.stub().callsFake(async (plaintext: string) => `enc:${plaintext}`);
    sessionDestroy = sinon.spy();
    createEncryptionSession = sinon.stub().resolves({ encrypt: sessionEncrypt, destroy: sessionDestroy });
    decryptStub = sinon.stub().callsFake(async ({ input, password }: { input: string; password: string }) => {
      if (password !== OLD_PASSWORD) {
        throw new Error('incorrect password');
      }
      if (!input.startsWith('enc:')) {
        throw new Error('incorrect password');
      }
      return input.slice('enc:'.length);
    });
    send = sinon.stub().returns({ result: sinon.stub().resolves({ updates: [] }) });
    put = sinon.stub().returns({ send });
    url = sinon.stub().callsFake((path: string) => path);
    // BitGoBase and IBaseCoin are large surfaces; the tests only exercise these members.
    const bitgo = {
      decrypt: decryptStub,
      createEncryptionSession,
      encrypt: sinon.stub().resolves('new-envelope'),
      put,
      url,
      setRequestTracer: sinon.stub(),
    } as unknown as BitGoBase;
    const baseCoin = {
      url: sinon.stub().callsFake((path: string) => path),
      generateKeyPair: sinon.stub(),
    } as unknown as IBaseCoin;
    keychains = new Keychains(bitgo, baseCoin);
  });

  it('walks all pages, rotates every envelope-bearing key and persists with one batch PUT', async function () {
    const listStub = stubListPages([
      [key('root-ecdsa-user'), key('msig-child', { encryptedPrv: undefined })],
      [key('root-eddsa-user'), key('mpc-child-user')],
    ]);
    send.returns({ result: sinon.stub().resolves({ updates: [{ keyId: 'x', updated: true }] }) });

    const response = await keychains.updatePassword({
      oldPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      safeId: SAFE_ID,
    });

    // the walk is safe-scoped and paginated
    sinon.assert.calledWith(listStub.getCall(0), { limit: 500, prevId: undefined, safeId: SAFE_ID });
    sinon.assert.calledWith(listStub.getCall(1), { limit: 500, prevId: '1', safeId: SAFE_ID });

    // one shared session, one Argon2
    sinon.assert.calledOnce(createEncryptionSession);
    sinon.assert.calledWith(createEncryptionSession, NEW_PASSWORD, undefined);

    // keychains without an encryptedPrv are skipped; every rotation carries compare-and-swap
    const bodies = sentBodies();
    bodies.length.should.equal(1);
    bodies[0].updates.map((u) => u.keyId).should.deepEqual(['root-ecdsa-user', 'root-eddsa-user', 'mpc-child-user']);
    for (const update of bodies[0].updates) {
      update.encryptedPrv.should.equal(`enc:prv-${update.keyId}`);
      update.expectedOldEncryptedPrv.should.equal(`enc:prv-${update.keyId}`);
    }
    sinon.assert.calledOnce(put);
    sinon.assert.calledWith(url, '/key/bulk', 2);

    // the batch response is passed through
    response.updates.should.deepEqual([{ keyId: 'x', updated: true }]);

    // the SDK-owned session is destroyed afterwards
    sinon.assert.calledOnce(sessionDestroy);
  });

  it('fails fast on the first undecryptable envelope with zero writes', async function () {
    stubListPages([[key('good-1'), key('stale', { encryptedPrv: 'corrupt-envelope' }), key('good-2')]]);

    await keychains
      .updatePassword({ oldPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD, safeId: SAFE_ID })
      .should.be.rejectedWith(/stale/);

    sinon.assert.notCalled(put);
    sinon.assert.calledOnce(sessionDestroy);
  });

  it('rejects with IncorrectPasswordError naming the offending key', async function () {
    stubListPages([[key('stale', { encryptedPrv: 'corrupt-envelope' })]]);

    try {
      await keychains.updatePassword({ oldPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD, safeId: SAFE_ID });
      throw new Error('expected updatePassword to reject');
    } catch (e) {
      (e as IncorrectPasswordError).name.should.equal('IncorrectPasswordError');
      (e as IncorrectPasswordError).message.should.match(/failed to decrypt keychain stale with the old passphrase/);
    }
  });

  it('rejects with IncorrectPasswordError when the old passphrase does not match', async function () {
    stubListPages([[key('root-1')]]);

    await keychains
      .updatePassword({ oldPassword: 'totally-wrong', newPassword: NEW_PASSWORD, safeId: SAFE_ID })
      .should.be.rejectedWith(IncorrectPasswordError);

    sinon.assert.notCalled(put);
  });

  it('re-encrypts through a caller-provided session without destroying it', async function () {
    stubListPages([[key('root-1')]]);
    const encryptedByCaller: string[] = [];
    let callerDestroyed = false;
    const callerSession: IEncryptionSession = {
      encrypt: async (plaintext: string) => {
        encryptedByCaller.push(plaintext);
        return 'caller-session-envelope';
      },
      decrypt: async () => '',
      destroy: () => {
        callerDestroyed = true;
      },
    };

    await keychains.updatePassword({
      oldPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      safeId: SAFE_ID,
      encryptionSession: callerSession,
    });

    sinon.assert.notCalled(createEncryptionSession);
    encryptedByCaller.should.deepEqual(['prv-root-1']);
    callerDestroyed.should.equal(false);
  });

  it('passes an explicit encryptionVersion to the session factory', async function () {
    stubListPages([[key('root-1')]]);

    await keychains.updatePassword({
      oldPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      safeId: SAFE_ID,
      encryptionVersion: 1,
    });

    sinon.assert.calledOnce(createEncryptionSession);
    sinon.assert.calledWith(createEncryptionSession, NEW_PASSWORD, 1);
  });

  it('chunks the batch past the server transaction budget and merges the responses', async function () {
    const page = Array.from({ length: 501 }, (_, i) => key(`key-${i}`));
    stubListPages([page]);
    send.callsFake((body: SentBulkBody) => ({
      result: sinon.stub().resolves({ updates: body.updates.map((u) => ({ keyId: u.keyId, updated: true })) }),
    }));

    const response = await keychains.updatePassword({
      oldPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      safeId: SAFE_ID,
    });

    sinon.assert.calledTwice(put);
    sentBodies()[0].updates.length.should.equal(500);
    sentBodies()[1].updates.length.should.equal(1);
    response.updates.length.should.equal(501);
  });

  it('rotates nothing and issues no PUT when the safe has no encrypted keys', async function () {
    stubListPages([[key('msig-child', { encryptedPrv: undefined }), key('placeholder', { encryptedPrv: undefined })]]);

    const response = await keychains.updatePassword({
      oldPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      safeId: SAFE_ID,
    });

    response.updates.should.deepEqual([]);
    sinon.assert.notCalled(put);
    sinon.assert.notCalled(createEncryptionSession);
  });

  it('rejects a non-string safeId', async function () {
    // deliberate: proves the runtime guard rejects a non-string safeId
    const unsafeId = 42 as unknown as string;

    await keychains
      .updatePassword({ oldPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD, safeId: unsafeId })
      .should.be.rejectedWith('Expecting parameter string: safeId but found number');
  });

  it('keeps legacy mode write-free', async function () {
    // getEncryptionVersion re-parses the old envelope in the legacy path, so it must be JSON
    const legacyKey = key('user-key', { encryptedPrv: JSON.stringify({ v: 1 }) });
    decryptStub.callsFake(async () => 'prv-user-key');
    sinon.stub(keychains, 'list').resolves({ keys: [legacyKey], nextBatchPrevId: undefined });

    const changedKeys = await keychains.updatePassword({ oldPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD });

    changedKeys.should.deepEqual({ 'pub-user-key': 'new-envelope' });
    sinon.assert.notCalled(put);
  });
});

describe('Keychains.list safeId filter', function () {
  it('forwards safeId as a query parameter', async function () {
    const query = sinon.stub();
    const chain = { query, result: sinon.stub().resolves({ keys: [] }) };
    query.returns(chain);
    // BitGoBase and IBaseCoin are large surfaces; the tests only exercise these members.
    const get = sinon.stub().returns(chain);
    // BitGoBase and IBaseCoin are large surfaces; the tests only exercise these members.
    const bitgo = { get } as unknown as BitGoBase;
    const baseCoin = { url: sinon.stub().callsFake((path: string) => path) } as unknown as IBaseCoin;
    const listKeychains = new Keychains(bitgo, baseCoin);

    await listKeychains.list({ safeId: 'safe-123' });

    sinon.assert.calledWith(get, '/key');
    sinon.assert.calledWith(query, { safeId: 'safe-123' });
  });
});
