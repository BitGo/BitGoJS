import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { handlePayLightningInvoice, handleCreateLightningInvoice } from '../../../src/lightning/lightningInvoiceRoutes';
import { Invoice, PayInvoiceResponse } from '@bitgo/abstract-lightning';
import { BitGo } from 'bitgo';
import * as assert from 'node:assert';

describe('Lightning Invoice Routes', () => {
  let bitgo;
  const coin = 'tlnbtc';

  const mockRequestObject = (params: { body?: any; params?: any; query?: any; bitgo?: any }) => {
    const req: Partial<express.Request> = {};
    req.body = params.body || {};
    req.params = params.params || {};
    req.query = params.query || {};
    req.bitgo = params.bitgo;
    return req as express.Request;
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('Create Lightning Invoice', () => {
    it('should successfully create a lightning invoice', async () => {
      const inputParams = {
        valueMsat: '10000',
        memo: 'test invoice',
        expiry: 3600,
      };

      const expectedResponse = {
        valueMsat: 10000n,
        memo: 'test invoice',
        paymentHash: 'abc123',
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        walletId: 'testWalletId',
        status: 'open' as const,
        expiresAt: new Date('2025-02-21T10:00:00.000Z'),
      };

      const createInvoiceSpy = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        createInvoice: createInvoiceSpy,
      };

      // Mock the module import
      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningInvoiceRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const walletStub = {};
      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };

      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handleCreateLightningInvoice(req);

      should(result).deepEqual(Invoice.encode(expectedResponse));
      const decodedResult = Invoice.decode(result);
      assert('right' in decodedResult);
      should(decodedResult.right).deepEqual(expectedResponse);
      sinon.assert.calledOnce(createInvoiceSpy);
      const [firstArg] = createInvoiceSpy.getCall(0).args;

      should(firstArg).have.property('valueMsat', BigInt(10000));
      should(firstArg).have.property('memo', 'test invoice');
      should(firstArg).have.property('expiry', 3600);
    });

    it('should fail when valueMsat is missing from request', async () => {
      const inputParams = {
        memo: 'test invoice',
        expiry: 3600,
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      await should(handleCreateLightningInvoice(req)).be.rejectedWith(
        /^Invalid request body to create lightning invoice/
      );
    });
  });

  describe('Pay Lightning Invoice', () => {
    it('should successfully pay a lightning invoice', async () => {
      const inputParams = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amountMsat: 10000n,
        passphrase: 'wallet-password-12345',
        randomParamThatWontBreakDecoding: 'randomValue',
      };

      const expectedResponse: PayInvoiceResponse = {
        paymentStatus: {
          paymentHash: 'xyz789',
          status: 'settled',
        },
        txRequestState: 'delivered',
        txRequestId: '123',
      };

      const payStub = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        pay: payStub,
      };

      // Mock the module import
      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningInvoiceRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const walletStub = {};
      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handlePayLightningInvoice(req);

      should(result).deepEqual(expectedResponse);
      sinon.assert.calledOnce(payStub);
      const [firstArg] = payStub.getCall(0).args;

      // we decode the amountMsat string to bigint, it should be in bigint format when passed to payInvoice
      should(firstArg).have.property('amountMsat', BigInt(10000));
      should(firstArg).have.property('invoice', inputParams.invoice);
      should(firstArg).have.property('passphrase', 'wallet-password-12345');
    });

    it('should throw an error if the passphrase is missing in the request params', async () => {
      const inputParams = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amountMsat: 10000n,
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      await should(handlePayLightningInvoice(req)).be.rejectedWith('Invalid request body to pay lightning invoice');
    });

    it('should throw an error if the invoice is missing in the request params', async () => {
      const inputParams = {
        amountMsat: 10000n,
        passphrase: 'wallet-password-12345',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
      });
      req.bitgo = bitgo;

      await should(handlePayLightningInvoice(req)).be.rejectedWith(/^Invalid request body to pay lightning invoice/);
    });
  });
});
