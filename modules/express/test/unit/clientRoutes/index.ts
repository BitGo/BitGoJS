import 'should';
import * as sinon from 'sinon';
import * as express from 'express';
import { ApiResponseError, BitGo } from 'bitgo';
import { promiseWrapper, redirectRequest } from '../../../src/clientRoutes';

describe('common methods', () => {
  const sandbox = sinon.createSandbox();
  describe('redirectRequest', () => {
    let bitgo: BitGo;
    let req: express.Request;
    let next: express.NextFunction;

    beforeEach(() => {
      bitgo = new BitGo({ env: 'test' });
      req = {
        body: {},
        params: {},
        headers: {},
        bitgo,
      } as express.Request;
      next = () => undefined;
    });

    afterEach(() => {
      sandbox.verifyAndRestore();
    });

    it('should handle GET request and return status and body', async () => {
      const url = 'https://example.com/api';
      const response = { res: { statusCode: 200 }, result: async () => ({ success: true }) };
      sandbox
        .stub(bitgo, 'get')
        .withArgs(url)
        .returns(response as any);

      const result = await redirectRequest(bitgo, 'GET', url, req, next);
      result.status.should.equal(200);
      result.body.should.deepEqual({ success: true });
    });

    it('should handle POST request and return status and body', async () => {
      const url = 'https://example.com/api';
      req.body = { data: 'test' };
      const response = { res: { statusCode: 201 }, result: async () => ({ success: true }) };
      sandbox
        .stub(bitgo, 'post')
        .withArgs(url)
        .returns({ send: () => response } as any);

      const result = await redirectRequest(bitgo, 'POST', url, req, next);
      result.status.should.equal(201);
      result.body.should.deepEqual({ success: true });
    });

    it('should forward X-BitGo-OTP header when present', async () => {
      const url = 'https://example.com/api';
      const setStub = sandbox.stub();
      const response = { res: { statusCode: 200 }, result: async () => ({ success: true }), set: setStub };
      sandbox
        .stub(bitgo, 'get')
        .withArgs(url)
        .returns(response as any);

      req.headers = { 'x-bitgo-otp': '123456' } as any;
      const result = await redirectRequest(bitgo, 'GET', url, req, next);
      result.status.should.equal(200);
      setStub.calledWith('x-bitgo-otp', '123456').should.be.true();
    });

    it('should not forward X-BitGo-OTP header when not present', async () => {
      const url = 'https://example.com/api';
      const setStub = sandbox.stub();
      const response = { res: { statusCode: 200 }, result: async () => ({ success: true }), set: setStub };
      sandbox
        .stub(bitgo, 'get')
        .withArgs(url)
        .returns(response as any);

      req.headers = {} as any;
      const result = await redirectRequest(bitgo, 'GET', url, req, next);
      result.status.should.equal(200);
      setStub.calledWith('x-bitgo-otp').should.be.false();
    });

    it('should handle error response and return status and body', async () => {
      const url = 'https://example.com/api';
      const response = {
        result: async () => {
          throw new ApiResponseError('Bad Request', 400);
        },
      };
      sandbox
        .stub(bitgo, 'get')
        .withArgs(url)
        .returns(response as any);

      await redirectRequest(bitgo, 'GET', url, req, next).should.be.rejectedWith(ApiResponseError, {
        message: 'Bad Request',
        status: 400,
      });
    });
  });

  describe('promiseWrapper', () => {
    afterEach(() => {
      sandbox.restore();
    });
    it('should handle successful request', async () => {
      const handler = sandbox.stub().resolves({ status: 200, body: { success: true } });
      const req: any = {};
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      res.status.calledWith(200).should.be.true();
      res.send.calledWith({ success: true }).should.be.true();
    });

    it('should handle successful request with status 202', async () => {
      const handler = sandbox.stub().resolves({ status: 202, body: { success: true } });
      const req: any = {};
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      res.status.calledWith(202).should.be.true();
      res.send.calledWith({ success: true }).should.be.true();
    });

    it('should handle successful request with default status', async () => {
      const handler = sandbox.stub().resolves({ success: true });
      const req: any = {};
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      res.status.calledWith(200).should.be.true();
      res.send.calledWith({ success: true }).should.be.true();
    });

    it('should handle error request', async () => {
      const handler = sandbox.stub().rejects(new Error('Test error'));
      const req: any = {};
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      res.status.calledWith(500).should.be.true();
      res.send.calledWithMatch((result: any) => result.message === 'Test error').should.be.true();
    });

    it('should have name field on error request', async () => {
      const handler = sandbox.stub().throws({ message: 'Test error' });
      const req: any = {};
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      res.status.calledWith(500).should.be.true();
      res.send.calledWithMatch((result: any) => result.name === 'BitGoExpressError').should.be.true();
    });

    it('should redact signing secrets from error responses and logs', async () => {
      const privateKey = 'private-key-value';
      const walletPassphrase = 'wallet-passphrase-value';
      const error = Object.assign(new Error(`failed with ${privateKey} and ${walletPassphrase}`), {
        result: { prv: privateKey, walletPassphrase },
      });
      const handler = sandbox.stub().rejects(error);
      const req: any = {
        body: {
          prv: privateKey,
          walletPassphrase,
        },
      };
      const res: any = {
        status: sandbox.stub().returnsThis(),
        send: sandbox.stub().returnsThis(),
      };
      const next = sandbox.stub();
      const consoleLog = sandbox.stub(console, 'log');

      await promiseWrapper(handler)(req, res, next);

      const response = res.send.firstCall.args[0];
      response.message.should.equal('failed with [REDACTED] and [REDACTED]');
      response.prv.should.equal('[REDACTED]');
      response.walletPassphrase.should.equal('[REDACTED]');
      JSON.stringify(response).should.not.containEql(privateKey);
      JSON.stringify(response).should.not.containEql(walletPassphrase);
      consoleLog.args.flat().join(' ').should.not.containEql(privateKey);
      consoleLog.args.flat().join(' ').should.not.containEql(walletPassphrase);
    });
    it('should handle circular request bodies while redacting errors', async () => {
      const passphrase = 'circular-passphrase';
      const requestBody: { credentials: { passphrase: string }; self?: unknown } = {
        credentials: { passphrase },
      };
      requestBody.self = requestBody;
      const errorResult: { secret: string; self?: unknown } = { secret: passphrase };
      errorResult.self = errorResult;
      const handler = sandbox
        .stub()
        .rejects(Object.assign(new Error(`failed with ${passphrase}`), { result: errorResult }));
      const req = { body: requestBody } as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;

      const next: express.NextFunction = () => undefined;
      await promiseWrapper(handler)(req, res, next);

      status.calledWith(500).should.be.true();
      send.firstCall.args[0].message.should.equal('failed with [REDACTED]');
      send.firstCall.args[0].secret.should.equal('[REDACTED]');
      send.firstCall.args[0].self.should.equal('[Circular]');
    });

    it('should redact short sensitive values in a single pass', async () => {
      // attack-shaped body: many 1-3 character values under sensitive keys,
      // chosen as substrings of the [REDACTED] replacement token
      const handler = sandbox.stub().rejects(new Error('failed with a sensitive message'));
      const req = {
        body: Object.fromEntries(
          ['e', '[', 'RE', 'ED', ']', 'D]', 'A', 'CT'].map((v, i) => [`k${i}`, { password: v }])
        ),
      } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();
      const consoleLog = sandbox.stub(console, 'log');

      await promiseWrapper(handler)(req, res, next);

      // short values are redacted too, and the single-pass scan cannot amplify:
      // the message is mangled but stays bounded
      status.calledWith(500).should.be.true();
      const response = send.firstCall.args[0];
      response.message.should.equal('fail[REDACTED]d with a s[REDACTED]nsitiv[REDACTED] m[REDACTED]ssag[REDACTED]');
      JSON.stringify(response).should.not.containEql('sensitive message');
      consoleLog.args.flat().join(' ').should.not.containEql('sensitive message');
    });

    it('should redact the passphrase normally when short junk values are present', async () => {
      const passphrase = 'real-wallet-passphrase';
      const handler = sandbox.stub().rejects(new Error(`failed with ${passphrase}`));
      const req = {
        body: {
          walletPassphrase: passphrase,
          ...Object.fromEntries(['e', '[', 'RE', 'ED]'].map((v, i) => [`k${i}`, { password: v }])),
        },
      } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      // short junk values no longer degrade the response: the real message is
      // returned with the passphrase redacted (the junk 'e' is redacted as well)
      send.firstCall.args[0].message.should.equal('fail[REDACTED]d with [REDACTED]');
    });

    it('should redact secrets containing special characters literally', async () => {
      const secret = 'p@$$w0rd.*+?(x)';
      const handler = sandbox.stub().rejects(new Error(`failed with ${secret}`));
      const req = { body: { walletPassphrase: secret } } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      send.firstCall.args[0].message.should.equal('failed with [REDACTED]');
    });

    it('should redact overlapping secrets as a single token', async () => {
      const handler = sandbox.stub().rejects(new Error('failed with REDACTED] token'));
      const req = {
        body: Object.fromEntries([
          ['password', 'REDA'],
          ['prv', 'REDACTED]'],
        ]),
      } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      // the union of the overlapping matches is replaced as one token
      send.firstCall.args[0].message.should.equal('failed with [REDACTED] token');
    });

    it('should not leak the tail of a secret overlapped by a shorter one', async () => {
      const handler = sandbox.stub().rejects(new Error('failed with abcdef'));
      const req = {
        body: {
          prv: 'cdef',
          password: 'abc',
        },
      } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      // 'abc' matches first, but the replacement extends over 'cdef' which
      // starts inside its span, so no part of either secret leaks
      const response = send.firstCall.args[0];
      response.message.should.equal('failed with [REDACTED]');
      JSON.stringify(response).should.not.containEql('cdef');
      JSON.stringify(response).should.not.containEql('abcdef');
    });

    it('should stay linear when one secret matches many times and another never', async function () {
      // regression for the quadratic rescan: an absent secret must not be
      // re-searched once per match of the present secret
      const hugeMessage = 'a'.repeat(200000);
      const handler = sandbox.stub().rejects(new Error(hugeMessage));
      const req = {
        body: {
          password: 'aaaa',
          nested: { secret: 'zzzz-not-present-anywhere' },
        },
      } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();
      sandbox.stub(console, 'log');

      const startedAt = Date.now();
      await promiseWrapper(handler)(req, res, next);
      const elapsedMs = Date.now() - startedAt;

      status.calledWith(500).should.be.true();
      send.firstCall.args[0].message.should.equal('[REDACTED]'.repeat(50000));
      elapsedMs.should.be.below(10000);
    });

    it('should redact every sensitive value the client sent, however many', async () => {
      const secrets = Array.from({ length: 500 }, (_, i) => `passphrase-number-${i}`);
      const handler = sandbox.stub().rejects(new Error(`failed with ${secrets[0]} and ${secrets[499]} only`));
      const body = Object.fromEntries(secrets.map((v, i) => [`k${i}`, { password: v }]));
      const req = { body } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      send.firstCall.args[0].message.should.equal('failed with [REDACTED] and [REDACTED] only');
    });

    it('should not treat empty sensitive values as secrets', async () => {
      const handler = sandbox.stub().rejects(new Error('plain failure message'));
      const req = { body: { walletPassphrase: '' } } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      // an empty sensitive value carries no secret and is not collected
      send.firstCall.args[0].message.should.equal('plain failure message');
    });

    it('should still redact full-length encrypted key material', async () => {
      const encryptedPrv = `{"iv":"${'a'.repeat(
        32
      )}","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","ct":"${'b'.repeat(2048)}"}`;
      const handler = sandbox.stub().rejects(new Error(`failed to decrypt ${encryptedPrv}`));
      const req = { body: { encryptedprv: encryptedPrv } } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { status, send } as unknown as express.Response;
      const next = sandbox.stub();

      await promiseWrapper(handler)(req, res, next);

      send.firstCall.args[0].message.should.equal('failed to decrypt [REDACTED]');
      JSON.stringify(send.firstCall.args[0]).should.not.containEql(encryptedPrv);
    });

    it('should return a generic 500 when building the error response itself fails', async () => {
      // a thrown object containing a BigInt makes JSON.stringify throw inside
      // handleRequestHandlerError
      const handler = sandbox.stub().rejects({ message: 'weird', value: 10n });
      const req = { body: {} } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { headersSent: false, status, send } as unknown as express.Response;
      const next = sandbox.stub();
      const consoleLog = sandbox.stub(console, 'log');

      // resolves instead of escaping as an unhandled rejection, which would
      // leave the request hanging until the connect timeout
      await promiseWrapper(handler)(req, res, next);

      status.calledWith(500).should.be.true();
      send.calledWith({ message: 'internal error' }).should.be.true();
      consoleLog.args.flat().join(' ').should.not.containEql('weird');
    });

    it('should not attempt a second response when headers were already sent', async () => {
      const handler = sandbox.stub().rejects({ message: 'weird', value: 10n });
      const req = { body: {} } as unknown as express.Request;
      const status = sandbox.stub().returnsThis();
      const send = sandbox.stub().returnsThis();
      const res = { headersSent: true, status, send } as unknown as express.Response;
      const next = sandbox.stub();
      const consoleLog = sandbox.stub(console, 'log');

      await promiseWrapper(handler)(req, res, next);

      status.called.should.be.false();
      send.called.should.be.false();
      consoleLog.args.flat().join(' ').should.containEql('TypeError');
    });
  });
});
