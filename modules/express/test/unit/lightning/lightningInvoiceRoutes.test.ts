import * as sinon from 'sinon';
import * as should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import * as express from 'express';
import { handleCreateLightningInvoice, handlePayLightningInvoice } from '../../../src/lightning/lightningInvoiceRoutes';

describe('Lightning Invoice Routes', () => {
  let bitgo;
  let basecoin;
  const coin = 'tlnbtc';

  const mockResponseObject = () => {
    const res: Partial<express.Response> = {};
    res.status = sinon.stub().returns(res);
    res.send = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res as express.Response;
  };

  const mockRequestObject = (params: { body?: any; params?: any; query?: any }) => {
    const req: Partial<express.Request> = {};
    req.body = params.body || {};
    req.params = params.params || {};
    req.query = params.query || {};
    return req as express.Request;
  };

  before(() => {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(coin);
  });

  describe('Create Lightning Invoice', () => {
    it('should successfully create a lightning invoice', async () => {
      const inputParams = {
        amount: '10000',
        memo: 'test invoice',
        expirySeconds: '3600',
      };

      //need to change it to real response for testing, for now they are just placeholders
      const expectedResponse = {
        value: 10000,
        memo: 'test invoice',
        paymentHash: 'abc123',
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        walletId: 'testWalletId',
        status: 'open',
        expiresAt: '2025-02-21T10:00:00.000Z',
      };

      const createInvoiceSpy = sinon.stub().resolves(expectedResponse);
      const walletStub = {
        lightning: sinon.stub().returns({
          createInvoice: createInvoiceSpy,
        }),
      };

      sinon.stub(basecoin.wallets(), 'get').resolves(walletStub);

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      const res = mockResponseObject();
      const result = await handleCreateLightningInvoice(req, res);

      should(result).deepEqual(expectedResponse);
      should(createInvoiceSpy).be.calledOnce();
      should(createInvoiceSpy).be.calledWith({
        value: 10000,
        memo: 'test invoice',
        expirySeconds: 3600,
      });
    });
  });

  describe('Pay Lightning Invoice', () => {
    it('should successfully pay a lightning invoice', async () => {
      const inputParams = {
        paymentRequest: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amount: '10000',
        maxFeeRate: '1000',
      };

      //need to change it to real response for testing, for now they are just placeholders
      const expectedResponse = {
        paymentHash: 'xyz789',
        status: 'complete',
        transfer: {
          id: 'transfer123',
          coin: 'tlnbtc',
          value: '10000',
          state: 'confirmed',
        },
      };

      const payInvoiceSpy = sinon.stub().resolves(expectedResponse);
      const walletStub = {
        lightning: sinon.stub().returns({
          payInvoice: payInvoiceSpy,
        }),
      };

      sinon.stub(basecoin.wallets(), 'get').resolves(walletStub);

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      const res = mockResponseObject();
      const result = await handlePayLightningInvoice(req, res);

      should(result).deepEqual(expectedResponse);
      should(payInvoiceSpy).be.calledOnce();
      should(payInvoiceSpy).be.calledWith({
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amount: 10000,
        maxFeeRate: 1000,
      });
    });

    it('should handle API errors when paying invoice', async () => {
      const inputParams = {
        paymentRequest: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amount: '10000',
      };

      const error = new Error('payment failed');
      const payInvoiceSpy = sinon.stub().rejects(error);
      const walletStub = {
        lightning: sinon.stub().returns({
          payInvoice: payInvoiceSpy,
        }),
      };

      sinon.stub(basecoin.wallets(), 'get').resolves(walletStub);

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      const res = mockResponseObject();
      await should(handlePayLightningInvoice(req, res)).be.rejectedWith('payment failed');
    });
  });

  afterEach(() => {
    sinon.restore();
  });
});
