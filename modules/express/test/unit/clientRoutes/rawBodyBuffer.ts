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
});
