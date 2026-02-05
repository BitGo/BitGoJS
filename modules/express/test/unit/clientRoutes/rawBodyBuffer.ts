/**
 * Tests for raw body buffer capture functionality
 * This ensures exact bytes are preserved for v4 HMAC authentication
 * @prettier
 */
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import * as sinon from 'sinon';
import * as express from 'express';
import { agent as supertest, Response } from 'supertest';
import { BitGo } from 'bitgo';
import { app as expressApp } from '../../../src/expressApp';
import { redirectRequest } from '../../../src/clientRoutes';

describe('Raw Body Buffer Capture', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.verifyAndRestore();
  });

  describe('body-parser verify callback', () => {
    let agent: ReturnType<typeof supertest>;

    beforeEach(() => {
      const app = expressApp({
        env: 'test',
        disableProxy: true,
      } as any);

      // Add a test route that returns the rawBodyBuffer info
      app.post('/test/rawbody', (req: express.Request, res: express.Response) => {
        res.json({
          hasRawBodyBuffer: !!req.rawBodyBuffer,
          rawBodyBufferLength: req.rawBodyBuffer?.length || 0,
          rawBodyBufferContent: req.rawBodyBuffer?.toString('utf-8') || null,
          parsedBody: req.body,
          bodyKeysCount: Object.keys(req.body || {}).length,
        });
      });

      // Add a test route for HMAC verification
      app.post('/test/hmac-check', (req: express.Request, res: express.Response) => {
        const rawBytes = req.rawBodyBuffer;
        const reSerializedBytes = Buffer.from(JSON.stringify(req.body));

        res.json({
          rawBytesHex: rawBytes?.toString('hex') || null,
          reSerializedBytesHex: reSerializedBytes.toString('hex'),
          bytesMatch: rawBytes?.toString('hex') === reSerializedBytes.toString('hex'),
          rawLength: rawBytes?.length || 0,
          reSerializedLength: reSerializedBytes.length,
        });
      });

      // Add a test route for HMAC chain simulation
      app.post('/test/hmac-chain', (req: express.Request, res: express.Response) => {
        const clientBytes = req.rawBodyBuffer;
        const parsedAndSerialized = Buffer.from(JSON.stringify(req.body));

        res.json({
          clientBytesPreserved: !!clientBytes,
          wouldHmacMatch: clientBytes?.toString('hex') === parsedAndSerialized.toString('hex'),
          recommendation: clientBytes ? 'Use rawBodyBuffer for HMAC' : 'Missing rawBodyBuffer',
        });
      });

      agent = supertest(app);
    });

    it('should capture raw body buffer on POST requests', async () => {
      const testBody = { address: 'tb1qtest', amount: 100000 };

      const res: Response = await agent.post('/test/rawbody').set('Content-Type', 'application/json').send(testBody);

      res.status.should.equal(200);
      res.body.hasRawBodyBuffer.should.equal(true);
      res.body.rawBodyBufferLength.should.be.greaterThan(0);
      res.body.parsedBody.should.deepEqual(testBody);
    });

    it('should preserve exact bytes including whitespace', async () => {
      // JSON with extra whitespace that would be lost during parse/re-serialize
      const bodyWithWhitespace = '{"address":  "tb1qtest",   "amount":100000}';

      const res: Response = await agent
        .post('/test/rawbody')
        .set('Content-Type', 'application/json')
        .send(bodyWithWhitespace);

      res.status.should.equal(200);
      // Raw buffer should preserve the exact whitespace
      res.body.rawBodyBufferContent.should.equal(bodyWithWhitespace);
      // Parsed body should have the correct values
      res.body.parsedBody.address.should.equal('tb1qtest');
      res.body.parsedBody.amount.should.equal(100000);
    });

    it('should preserve exact key ordering', async () => {
      // JSON with specific key ordering
      const bodyWithOrdering = '{"z_last":"last","a_first":"first","m_middle":"middle"}';

      const res: Response = await agent
        .post('/test/rawbody')
        .set('Content-Type', 'application/json')
        .send(bodyWithOrdering);

      res.status.should.equal(200);
      // Raw buffer should preserve exact key ordering
      res.body.rawBodyBufferContent.should.equal(bodyWithOrdering);
    });

    it('should handle empty body', async () => {
      const res: Response = await agent.post('/test/rawbody').set('Content-Type', 'application/json').send({});

      res.status.should.equal(200);
      res.body.hasRawBodyBuffer.should.equal(true);
      res.body.rawBodyBufferLength.should.equal(2); // "{}"
    });

    it('should handle large JSON body', async () => {
      // Create a large object
      const largeBody: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeBody[`key_${i}`] = `value_${i}_${'x'.repeat(100)}`;
      }

      const res: Response = await agent.post('/test/rawbody').set('Content-Type', 'application/json').send(largeBody);

      res.status.should.equal(200);
      res.body.hasRawBodyBuffer.should.equal(true);
      res.body.rawBodyBufferLength.should.be.greaterThan(100000);
      res.body.bodyKeysCount.should.equal(1000);
    });

    it('should handle nested JSON objects', async () => {
      const nestedBody = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const res: Response = await agent.post('/test/rawbody').set('Content-Type', 'application/json').send(nestedBody);

      res.status.should.equal(200);
      res.body.hasRawBodyBuffer.should.equal(true);
      res.body.parsedBody.level1.level2.level3.value.should.equal('deep');
    });

    it('should handle special characters in JSON', async () => {
      const bodyWithSpecialChars = '{"message":"Hello\\nWorld\\t!","emoji":"🚀"}';

      const res: Response = await agent
        .post('/test/rawbody')
        .set('Content-Type', 'application/json')
        .send(bodyWithSpecialChars);

      res.status.should.equal(200);
      res.body.rawBodyBufferContent.should.equal(bodyWithSpecialChars);
      res.body.parsedBody.message.should.equal('Hello\nWorld\t!');
      res.body.parsedBody.emoji.should.equal('🚀');
    });

    it('should ensure raw bytes are identical between client and server', async () => {
      // Test case 1: Standard JSON (might match after re-serialization)
      const standardBody = { a: 1, b: 2 };
      const res1: Response = await agent
        .post('/test/hmac-check')
        .set('Content-Type', 'application/json')
        .send(standardBody);

      res1.status.should.equal(200);
      res1.body.rawBytesHex.should.be.ok();

      // Test case 2: JSON with whitespace (should NOT match after re-serialization)
      const bodyWithWhitespace = '{"a":  1,  "b":  2}';
      const res2: Response = await agent
        .post('/test/hmac-check')
        .set('Content-Type', 'application/json')
        .send(bodyWithWhitespace);

      res2.status.should.equal(200);
      // Raw bytes should be different from re-serialized
      res2.body.bytesMatch.should.equal(false);
      // This proves why we need raw body capture for HMAC!
      res2.body.rawLength.should.be.greaterThan(res2.body.reSerializedLength);
    });

    it('should preserve raw bytes for HMAC calculation across the request chain', async () => {
      // Simulate a realistic wallet/send request with specific formatting
      const walletSendBody =
        '{"address":"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh","amount":1000000,"walletPassphrase":"test"}';

      const res: Response = await agent
        .post('/test/hmac-chain')
        .set('Content-Type', 'application/json')
        .send(walletSendBody);

      res.status.should.equal(200);
      res.body.clientBytesPreserved.should.equal(true);
      res.body.recommendation.should.equal('Use rawBodyBuffer for HMAC');
    });
  });

  describe('redirectRequest with rawBodyBuffer', () => {
    let bitgo: BitGo;
    let req: express.Request;

    beforeEach(() => {
      bitgo = new BitGo({ env: 'test' });
      req = {
        body: { address: 'tb1qtest', amount: 100000 },
        params: {},
        bitgo,
      } as unknown as express.Request;
    });

    it('should use rawBodyBuffer when available for POST requests', async () => {
      const url = 'https://example.com/api';
      const rawBody = Buffer.from('{"address":"tb1qtest","amount":100000}');
      req.rawBodyBuffer = rawBody;

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'post')
        .withArgs(url)
        .returns({
          set: sandbox.stub().returns({
            send: (body: any) => {
              capturedBody = body;
              return {
                res: { statusCode: 200 },
                result: async () => ({ success: true }),
              };
            },
          }),
        } as any);

      await redirectRequest(bitgo, 'POST', url, req, () => undefined);

      // The captured body should be the raw buffer, not the parsed object
      Buffer.isBuffer(capturedBody).should.be.true();
      capturedBody.toString('utf-8').should.equal('{"address":"tb1qtest","amount":100000}');
    });

    it('should fall back to req.body when rawBodyBuffer is not available', async () => {
      const url = 'https://example.com/api';
      // No rawBodyBuffer set

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'post')
        .withArgs(url)
        .returns({
          send: (body: any) => {
            capturedBody = body;
            return {
              res: { statusCode: 200 },
              result: async () => ({ success: true }),
            };
          },
        } as any);

      await redirectRequest(bitgo, 'POST', url, req, () => undefined);

      // The captured body should be the parsed object
      capturedBody.should.deepEqual({ address: 'tb1qtest', amount: 100000 });
    });

    it('should fall back to req.body when rawBodyBuffer is empty', async () => {
      const url = 'https://example.com/api';
      req.rawBodyBuffer = Buffer.alloc(0); // Empty buffer

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'post')
        .withArgs(url)
        .returns({
          send: (body: any) => {
            capturedBody = body;
            return {
              res: { statusCode: 200 },
              result: async () => ({ success: true }),
            };
          },
        } as any);

      await redirectRequest(bitgo, 'POST', url, req, () => undefined);

      // Should fall back to parsed body since rawBodyBuffer is empty
      capturedBody.should.deepEqual({ address: 'tb1qtest', amount: 100000 });
    });

    it('should use rawBodyBuffer for PUT requests', async () => {
      const url = 'https://example.com/api';
      const rawBody = Buffer.from('{"update":"data"}');
      req.rawBodyBuffer = rawBody;
      req.body = { update: 'data' };

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'put')
        .withArgs(url)
        .returns({
          set: sandbox.stub().returns({
            send: (body: any) => {
              capturedBody = body;
              return {
                res: { statusCode: 200 },
                result: async () => ({ success: true }),
              };
            },
          }),
        } as any);

      await redirectRequest(bitgo, 'PUT', url, req, () => undefined);

      Buffer.isBuffer(capturedBody).should.be.true();
      capturedBody.toString('utf-8').should.equal('{"update":"data"}');
    });

    it('should use rawBodyBuffer for PATCH requests', async () => {
      const url = 'https://example.com/api';
      const rawBody = Buffer.from('{"patch":"data"}');
      req.rawBodyBuffer = rawBody;
      req.body = { patch: 'data' };

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'patch')
        .withArgs(url)
        .returns({
          set: sandbox.stub().returns({
            send: (body: any) => {
              capturedBody = body;
              return {
                res: { statusCode: 200 },
                result: async () => ({ success: true }),
              };
            },
          }),
        } as any);

      await redirectRequest(bitgo, 'PATCH', url, req, () => undefined);

      Buffer.isBuffer(capturedBody).should.be.true();
    });

    it('should use rawBodyBuffer for DELETE requests', async () => {
      const url = 'https://example.com/api';
      const rawBody = Buffer.from('{"delete":"data"}');
      req.rawBodyBuffer = rawBody;
      req.body = { delete: 'data' };

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'del')
        .withArgs(url)
        .returns({
          set: sandbox.stub().returns({
            send: (body: any) => {
              capturedBody = body;
              return {
                res: { statusCode: 200 },
                result: async () => ({ success: true }),
              };
            },
          }),
        } as any);

      await redirectRequest(bitgo, 'DELETE', url, req, () => undefined);

      Buffer.isBuffer(capturedBody).should.be.true();
    });

    it('should use rawBodyBuffer for OPTIONS requests', async () => {
      const url = 'https://example.com/api';
      const rawBody = Buffer.from('{"options":"data"}');
      req.rawBodyBuffer = rawBody;
      req.body = { options: 'data' };

      let capturedBody: any;
      sandbox
        .stub(bitgo, 'options')
        .withArgs(url)
        .returns({
          set: sandbox.stub().returns({
            send: (body: any) => {
              capturedBody = body;
              return {
                res: { statusCode: 200 },
                result: async () => ({ success: true }),
              };
            },
          }),
        } as any);

      await redirectRequest(bitgo, 'OPTIONS', url, req, () => undefined);

      Buffer.isBuffer(capturedBody).should.be.true();
    });

    it('should not affect GET requests (no body)', async () => {
      const url = 'https://example.com/api';

      const mockGet = sandbox
        .stub(bitgo, 'get')
        .withArgs(url)
        .returns({
          res: { statusCode: 200 },
          result: async () => ({ success: true }),
        } as any);

      await redirectRequest(bitgo, 'GET', url, req, () => undefined);

      mockGet.calledOnce.should.be.true();
    });
  });
});
