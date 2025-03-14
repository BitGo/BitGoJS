import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { handlePayLightningInvoice } from '../../../src/lightning/lightningInvoiceRoutes';
import { PayInvoiceResponse } from '@bitgo/abstract-lightning';
import { BitGo } from 'bitgo';

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

  describe('Pay Lightning Invoice', () => {
    it('should successfully pay a lightning invoice', async () => {
      const inputParams = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amountMsat: '10000',
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

      const payInvoiceStub = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        payInvoice: payInvoiceStub,
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
      should(payInvoiceStub).be.calledOnce();
      const [firstArg] = payInvoiceStub.getCall(0).args;

      // we decode the amountMsat string to bigint, it should be in bigint format when passed to payInvoice
      should(firstArg).have.property('amountMsat', BigInt(10000));
      should(firstArg).have.property('invoice', inputParams.invoice);
      should(firstArg).have.property('passphrase', 'wallet-password-12345');
    });

    it('should throw an error if the passphrase is missing in the request params', async () => {
      const inputParams = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmv...',
        amountMsat: '10000',
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
        amountMsat: '10000',
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
