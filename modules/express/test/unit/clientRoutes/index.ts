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
  });
});
