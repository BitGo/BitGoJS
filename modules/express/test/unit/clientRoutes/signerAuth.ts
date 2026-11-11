/**
 * Tests for signer-mode route authentication, uniform wallet errors and the
 * per-walletId failure lockout (WAL-2458).
 */
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import * as assert from 'assert';
import * as sinon from 'sinon';
import nock from 'nock';
import * as fsSync from 'fs';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as express from 'express';
import * as request from 'supertest';

import { BitGo, CustomSigningFunction } from 'bitgo';
import { DefaultConfig } from '../../../src/config';
import {
  createCustomSigningFunction,
  handleV2OFCSignPayloadInExtSigningMode,
  requireSignerAuth,
} from '../../../src/clientRoutes';
import { ApiResponseError } from '../../../src/errors';
import { setupAgent, SIGNER_AUTH_SECRET } from '../../lib/testutil';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';

describe('Signer route authentication (WAL-2458)', function () {
  describe('requireSignerAuth middleware', function () {
    const config = { ...DefaultConfig, signerAuthSecret: SIGNER_AUTH_SECRET };

    // test doubles standing in for express objects
    interface ResponseDouble {
      status: sinon.SinonStub;
      send: sinon.SinonStub;
    }
    const makeRes = (): ResponseDouble => ({ status: sinon.stub().returnsThis(), send: sinon.stub().returnsThis() });
    const makeReq = (headers: Record<string, string | string[]>) => ({ headers } as unknown as express.Request);

    it('rejects requests without the signer auth header with a generic 401', function () {
      const res = makeRes();
      const next = sinon.spy();
      requireSignerAuth(config)(makeReq({}), res as unknown as express.Response, next);
      assert.strictEqual(res.status.calledWith(401), true);
      assert.strictEqual(res.send.calledWith({ error: 'unauthorized' }), true);
      sinon.assert.notCalled(next);
    });

    it('rejects requests with a wrong secret with a generic 401', function () {
      const res = makeRes();
      const next = sinon.spy();
      requireSignerAuth(config)(
        makeReq({ 'x-auth-signer': 'not-the-secret' }),
        res as unknown as express.Response,
        next
      );
      assert.strictEqual(res.status.calledWith(401), true);
      sinon.assert.notCalled(next);
    });

    it('passes requests presenting the shared secret', function () {
      const res = makeRes();
      const next = sinon.spy();
      requireSignerAuth(config)(
        makeReq({ 'x-auth-signer': SIGNER_AUTH_SECRET }),
        res as unknown as express.Response,
        next
      );
      assert.strictEqual(res.status.called, false);
      sinon.assert.calledOnce(next);
    });

    it('fails closed when no secret is configured', function () {
      const res = makeRes();
      const next = sinon.spy();
      requireSignerAuth({ ...DefaultConfig, signerAuthSecret: undefined })(
        makeReq({ 'x-auth-signer': 'anything' }),
        res as unknown as express.Response,
        next
      );
      assert.strictEqual(res.status.calledWith(401), true);
      sinon.assert.notCalled(next);
    });
  });

  describe('signer-mode routes', function () {
    const signerFilePath = path.join(os.tmpdir(), `signerAuth-${process.pid}-${Date.now()}.json`);
    let agent: request.SuperAgentTest;

    before(function () {
      fsSync.writeFileSync(signerFilePath, JSON.stringify({ someWalletId: 'encrypted' }));
      agent = setupAgent({ signerMode: true, signerFileSystemPath: signerFilePath });
    });

    after(function () {
      try {
        fsSync.unlinkSync(signerFilePath);
      } catch {
        // ignore
      }
    });

    // body passing codec validation, so the auth middleware is what rejects it
    const validSignBody = {
      txPrebuild: {
        walletId: 'someWalletId',
        txHex:
          '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      },
    };

    it('returns 401 for requests without the signer auth header, before any handler runs', async function () {
      const res = await agent.post('/api/v2/btc/sign').set('Content-Type', 'application/json').send(validSignBody);
      assert.strictEqual(res.status, 401);
      assert.deepStrictEqual(res.body, { error: 'unauthorized' });
    });

    it('returns 401 for requests with a wrong secret', async function () {
      const res = await agent
        .post('/api/v2/btc/sign')
        .set('Content-Type', 'application/json')
        .set('X-Auth-Signer', 'wrong-secret')
        .send(validSignBody);
      assert.strictEqual(res.status, 401);
    });

    it('lets authenticated requests reach the route handler', async function () {
      const res = await agent
        .post('/api/v2/btc/sign')
        .set('Content-Type', 'application/json')
        .set('X-Auth-Signer', SIGNER_AUTH_SECRET)
        .send({});
      // reaching the handler means the request is no longer rejected by the
      // auth middleware; the invalid body fails validation instead
      assert.notStrictEqual(res.status, 401);
    });
  });

  describe('uniform wallet errors and lockout', function () {
    const bitgo = new BitGo({ env: 'test' });
    const uniformityWalletId = `uniformity${process.pid}${Date.now()}`;
    const lockoutWalletId = `lockout${process.pid}${Date.now()}`;
    const junkLengthWalletId = `${'x'.repeat(600)}${Date.now()}`;
    let validPrv: string;

    before(async function () {
      const encryptedPrvByWallet: [string, string][] = [
        [uniformityWalletId, 'signer-auth-test-priv-1'],
        [lockoutWalletId, 'signer-auth-test-priv-2'],
        [junkLengthWalletId, 'signer-auth-test-priv-3'],
      ];
      const entries: [string, string][] = [];
      for (const [walletId, input] of encryptedPrvByWallet) {
        const encryptedPrv = await bitgo.encrypt({
          password: 'correct-wallet-passphrase',
          input,
          encryptionVersion: 1,
        });
        entries.push([walletId, encryptedPrv]);
      }
      validPrv = JSON.stringify(Object.fromEntries(entries));
    });

    const makeReq = (walletId: string) =>
      ({
        bitgo,
        body: { walletId, payload: { any: 'payload' } },
        config: { signerFileSystemPath: 'signerFileSystemPath' },
      } as unknown as ExpressApiRouteRequest<'express.v2.ofc.extSignPayload', 'post'>);

    it('returns the same error for an unknown wallet and a wrong passphrase', async function () {
      const readFileStub = sinon.stub(fs, 'readFile').resolves(validPrv);

      // unknown walletId: not in the key file and no env passphrase configured
      const noEnvStub = sinon.stub(process, 'env').value({});
      let unknownWalletError: unknown;
      try {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq('unknownwalletid0000000000000000'));
      } catch (e) {
        unknownWalletError = e;
      }
      noEnvStub.restore();

      // wrong passphrase: wallet present in the key file, env passphrase set but wrong
      const wrongPassphraseEnvStub = sinon
        .stub(process, 'env')
        .value({ [`WALLET_${uniformityWalletId}_PASSPHRASE`]: 'wrong-passphrase' });
      let wrongPassphraseError: unknown;
      try {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(uniformityWalletId));
      } catch (e) {
        wrongPassphraseError = e;
      }
      wrongPassphraseEnvStub.restore();
      readFileStub.restore();

      const unknownWallet = unknownWalletError as ApiResponseError;
      const wrongPassphrase = wrongPassphraseError as ApiResponseError;
      assert.ok(unknownWallet instanceof ApiResponseError);
      assert.ok(wrongPassphrase instanceof ApiResponseError);
      assert.strictEqual(unknownWallet.status, 400);
      assert.strictEqual(wrongPassphrase.status, 400);
      assert.strictEqual(unknownWallet.message, wrongPassphrase.message);
    });

    it('locks a walletId out after repeated failures without further key access', async function () {
      const readFileStub = sinon.stub(fs, 'readFile').resolves(validPrv);
      const envStub = sinon
        .stub(process, 'env')
        .value({ [`WALLET_${lockoutWalletId}_PASSPHRASE`]: 'wrong-passphrase' });

      for (let attempt = 0; attempt < 5; attempt++) {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
          'unable to sign for the specified wallet'
        );
      }

      // locked out: same uniform error, but the key file is not read and the
      // key is not decrypted anymore
      const decryptSpy = sinon.spy(bitgo, 'decrypt');
      await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
        'unable to sign for the specified wallet'
      );
      sinon.assert.notCalled(decryptSpy);
      assert.strictEqual(readFileStub.callCount, 5);
      decryptSpy.restore();

      readFileStub.restore();
      envStub.restore();
    });

    it('expires lockouts after the lockout window', async function () {
      const readFileStub = sinon.stub(fs, 'readFile').resolves(validPrv);
      const envStub = sinon
        .stub(process, 'env')
        .value({ [`WALLET_${lockoutWalletId}_PASSPHRASE`]: 'wrong-passphrase' });

      for (let attempt = 0; attempt < 5; attempt++) {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
          'unable to sign for the specified wallet'
        );
      }

      const decryptSpy = sinon.spy(bitgo, 'decrypt');
      const clock = sinon.useFakeTimers(Date.now());
      clock.tick(15 * 60 * 1000 + 1000);

      // the lockout and the failure history have expired: the failure path
      // runs again and reaches decryption
      await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
        'unable to sign for the specified wallet'
      );
      sinon.assert.calledOnce(decryptSpy);
      clock.restore();
      decryptSpy.restore();

      readFileStub.restore();
      envStub.restore();
    });

    it('never locks out absurdly long walletIds, and does not track them', async function () {
      const readFileStub = sinon.stub(fs, 'readFile').resolves(validPrv);
      const envStub = sinon
        .stub(process, 'env')
        .value({ [`WALLET_${junkLengthWalletId}_PASSPHRASE`]: 'wrong-passphrase' });

      const decryptSpy = sinon.spy(bitgo, 'decrypt');
      for (let attempt = 0; attempt < 6; attempt++) {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(junkLengthWalletId)).should.be.rejectedWith(
          'unable to sign for the specified wallet'
        );
      }
      // untracked, so never locked out: every attempt reached decryption
      sinon.assert.callCount(decryptSpy, 6);
      decryptSpy.restore();

      readFileStub.restore();
      envStub.restore();
    });

    it('keeps throttling real wallets after floods of unknown walletIds', async function () {
      const readFileStub = sinon.stub(fs, 'readFile').resolves(validPrv);
      const envStub = sinon.stub(process, 'env').value({});

      // 2000 attacker-chosen unknown walletIds: the failure map is capped, so
      // this must neither grow memory without limit nor break throttling
      for (let attempt = 0; attempt < 2000; attempt++) {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(`floodwallet${attempt}`)).should.be.rejectedWith(
          'unable to sign for the specified wallet'
        );
      }

      envStub.value({ [`WALLET_${lockoutWalletId}_PASSPHRASE`]: 'wrong-passphrase' });
      for (let attempt = 0; attempt < 5; attempt++) {
        await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
          'unable to sign for the specified wallet'
        );
      }
      const decryptSpy = sinon.spy(bitgo, 'decrypt');
      await handleV2OFCSignPayloadInExtSigningMode(makeReq(lockoutWalletId)).should.be.rejectedWith(
        'unable to sign for the specified wallet'
      );
      sinon.assert.notCalled(decryptSpy);
      decryptSpy.restore();

      readFileStub.restore();
      envStub.restore();
    });
  });

  describe('online express client forwards', function () {
    const signerUrl = 'http://external-signer.example';

    // other suites in this directory toggle the global nock interceptor; use it
    // for these tests, then leave it exactly as it was found
    let nockWasActive = false;
    before(function () {
      nockWasActive = nock.isActive();
      if (!nockWasActive) {
        nock.activate();
      }
    });

    after(function () {
      nock.cleanAll();
      if (!nockWasActive) {
        nock.restore();
      }
    });

    // test double for the signing params shape
    const makeSigningParams = () =>
      ({
        coin: { getChain: () => 'btc' },
        txPrebuild: { walletId: 'walletid', txHex: 'tx' },
        pubs: [],
      } as unknown as Parameters<CustomSigningFunction>[0]);
    it('attaches the signer auth header when a secret is configured', async function () {
      const nockScope = nock(signerUrl)
        .post('/api/v2/btc/sign')
        .matchHeader('x-auth-signer', SIGNER_AUTH_SECRET)
        .reply(200, { txHex: 'signed-tx' });

      const signingFunction = createCustomSigningFunction(signerUrl, { signerAuthSecret: SIGNER_AUTH_SECRET });
      const result = await signingFunction(makeSigningParams());
      assert.deepStrictEqual(result, { txHex: 'signed-tx' });
      nockScope.done();
    });

    it('omits the header when no secret is configured', async function () {
      const nockScope = nock(signerUrl)
        .post('/api/v2/btc/sign')
        .matchHeader('x-auth-signer', (value: string | undefined) => value === undefined)
        .reply(200, { txHex: 'signed-tx' });

      const signingFunction = createCustomSigningFunction(signerUrl);
      const result = await signingFunction(makeSigningParams());
      assert.deepStrictEqual(result, { txHex: 'signed-tx' });
      nockScope.done();
    });

    it('applies TLS client material when configured', async function () {
      const pemDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'signer-tls-'));
      const keyPath = path.join(pemDir, 'client-key.pem');
      const certPath = path.join(pemDir, 'client-cert.pem');
      const caPath = path.join(pemDir, 'ca.pem');
      fsSync.writeFileSync(keyPath, 'not-a-real-key');
      fsSync.writeFileSync(certPath, 'not-a-real-cert');
      fsSync.writeFileSync(caPath, 'not-a-real-ca');

      const nockScope = nock(signerUrl)
        .post('/api/v2/btc/sign')
        .matchHeader('x-auth-signer', SIGNER_AUTH_SECRET)
        .reply(200, { txHex: 'signed-tx' });

      // nock intercepts below the TLS layer, so the request still flows: this
      // exercises reading the configured PEM files and attaching them to the
      // outbound request without breaking it
      const signingFunction = createCustomSigningFunction(signerUrl, {
        signerAuthSecret: SIGNER_AUTH_SECRET,
        signerClientKeyPath: keyPath,
        signerClientCertPath: certPath,
        signerClientCaPath: caPath,
      });
      const result = await signingFunction(makeSigningParams());
      assert.deepStrictEqual(result, { txHex: 'signed-tx' });
      nockScope.done();

      fsSync.rmSync(pemDir, { recursive: true, force: true });
    });
  });
});
