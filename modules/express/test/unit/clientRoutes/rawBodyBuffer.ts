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
import { app as expressApp } from '../../../src/expressApp';
import { redirectRequest } from '../../../src/clientRoutes';
import { BitGo } from 'bitgo';

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
  });

  describe('redirectRequest with rawBodyBuffer', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
      sandbox.restore();
    });

    it('should use rawBodyBuffer when available for POST requests', async () => {
      const bitgo = {
        post: sandbox.stub(),
      } as unknown as BitGo;

      // Simulate raw body with specific whitespace
      const rawBodyWithWhitespace = '{"address":  "tb1qtest",   "amount":100000}';
      const req = {
        body: { address: 'tb1qtest', amount: 100000 },
        rawBodyBuffer: Buffer.from(rawBodyWithWhitespace),
        headers: { 'content-type': 'application/json' },
        params: {},
      } as unknown as express.Request;

      let capturedBody: string | undefined;
      let capturedContentType: string | undefined;

      const mockRequest = {
        set: sandbox.stub().callsFake((header: string, value: string) => {
          if (header === 'Content-Type') {
            capturedContentType = value;
          }
          return mockRequest;
        }),
        send: sandbox.stub().callsFake((body: string) => {
          capturedBody = body;
          return mockRequest;
        }),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.post as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'POST', 'https://example.com/api', req, () => undefined);

      capturedBody!.should.equal(rawBodyWithWhitespace);
      capturedContentType!.should.equal('application/json');
    });

    it('should handle empty body (0-length buffer)', async () => {
      const bitgo = {
        post: sandbox.stub(),
      } as unknown as BitGo;

      const req = {
        body: {},
        rawBodyBuffer: Buffer.from(''),
        headers: { 'content-type': 'application/json' },
        params: {},
      } as unknown as express.Request;

      let capturedBody: string | undefined;

      const mockRequest = {
        set: sandbox.stub().returnsThis(),
        send: sandbox.stub().callsFake((body: string) => {
          capturedBody = body;
          return mockRequest;
        }),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.post as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'POST', 'https://example.com/api', req, () => undefined);

      // Should send empty string, not "{}"
      capturedBody!.should.equal('');
    });

    it('should fall back to req.body when rawBodyBuffer is undefined', async () => {
      const bitgo = {
        post: sandbox.stub(),
      } as unknown as BitGo;

      const req = {
        body: { address: 'tb1qtest', amount: 100000 },
        // No rawBodyBuffer
        headers: { 'content-type': 'application/json' },
        params: {},
      } as unknown as express.Request;

      let capturedBody: unknown;

      const mockRequest = {
        set: sandbox.stub().returnsThis(),
        send: sandbox.stub().callsFake((body: unknown) => {
          capturedBody = body;
          return mockRequest;
        }),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.post as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'POST', 'https://example.com/api', req, () => undefined);

      // Should fall back to parsed body object
      capturedBody!.should.deepEqual({ address: 'tb1qtest', amount: 100000 });
    });

    it('should preserve original Content-Type header from client', async () => {
      const bitgo = {
        post: sandbox.stub(),
      } as unknown as BitGo;

      const req = {
        body: { data: 'test' },
        rawBodyBuffer: Buffer.from('{"data":"test"}'),
        headers: { 'content-type': 'application/json; charset=utf-8' },
        params: {},
      } as unknown as express.Request;

      let capturedContentType: string | undefined;

      const mockRequest = {
        set: sandbox.stub().callsFake((header: string, value: string) => {
          if (header === 'Content-Type') {
            capturedContentType = value;
          }
          return mockRequest;
        }),
        send: sandbox.stub().returnsThis(),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.post as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'POST', 'https://example.com/api', req, () => undefined);

      // Should preserve original Content-Type including charset
      capturedContentType!.should.equal('application/json; charset=utf-8');
    });

    it('should use rawBodyBuffer for PUT requests', async () => {
      const bitgo = {
        put: sandbox.stub(),
      } as unknown as BitGo;

      const rawBody = '{"update":"value"}';
      const req = {
        body: { update: 'value' },
        rawBodyBuffer: Buffer.from(rawBody),
        headers: { 'content-type': 'application/json' },
        params: {},
      } as unknown as express.Request;

      let capturedBody: string | undefined;

      const mockRequest = {
        set: sandbox.stub().returnsThis(),
        send: sandbox.stub().callsFake((body: string) => {
          capturedBody = body;
          return mockRequest;
        }),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.put as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'PUT', 'https://example.com/api', req, () => undefined);

      capturedBody!.should.equal(rawBody);
    });

    it('should use rawBodyBuffer for DELETE requests', async () => {
      const bitgo = {
        del: sandbox.stub(),
      } as unknown as BitGo;

      const rawBody = '{"id":"123"}';
      const req = {
        body: { id: '123' },
        rawBodyBuffer: Buffer.from(rawBody),
        headers: { 'content-type': 'application/json' },
        params: {},
      } as unknown as express.Request;

      let capturedBody: string | undefined;

      const mockRequest = {
        set: sandbox.stub().returnsThis(),
        send: sandbox.stub().callsFake((body: string) => {
          capturedBody = body;
          return mockRequest;
        }),
        result: sandbox.stub().resolves({ success: true }),
        res: { statusCode: 200 },
      };

      (bitgo.del as sinon.SinonStub).returns(mockRequest);

      await redirectRequest(bitgo, 'DELETE', 'https://example.com/api', req, () => undefined);

      capturedBody!.should.equal(rawBody);
    });
  });
});
