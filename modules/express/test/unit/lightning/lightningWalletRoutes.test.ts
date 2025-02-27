import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import {
  handleListLightningInvoices,
  handleUpdateLightningWalletCoinSpecific,
} from '../../../src/lightning/lightningWalletRoutes';
import { BitGo } from 'bitgo';
import { InvoiceInfo } from '@bitgo/abstract-lightning';

describe('Lightning Wallet Routes', () => {
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

  describe('List Lightning Invoices', () => {
    it('should successfully list lightning invoices', async () => {
      const queryParams = {
        status: 'open',
        limit: '10',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockResponse: InvoiceInfo[] = [
        {
          invoice: 'lntb100u1p3h2jk3pp5...',
          paymentHash: 'abc123',
          valueMsat: 10000n,
          walletId: 'testWalletId',
          status: 'open',
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const listInvoicesSpy = sinon.stub().resolves(mockResponse);
      const mockLightningWallet = {
        listInvoices: listInvoicesSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
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
        query: queryParams,
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handleListLightningInvoices(req);

      should(result).deepEqual(mockResponse);
      should(listInvoicesSpy).be.calledOnce();
      const [firstArg] = listInvoicesSpy.getCall(0).args;

      should(firstArg).have.property('status', 'open');
      should(firstArg).have.property('limit', 10n);
      should(firstArg.startDate).be.instanceOf(Date);
      should(firstArg.endDate).be.instanceOf(Date);
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        status: 'invalidStatus',
        limit: 'notANumber',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        query: invalidQuery,
      });
      req.bitgo = bitgo;

      await should(handleListLightningInvoices(req)).be.rejectedWith(
        /Invalid query parameters for listing lightning invoices: Invalid value '"invalidStatus"' supplied to InvoiceQuery\.status\.0, expected "open"/
      );
    });
  });

  describe('Update Wallet Coin Specific', () => {
    it('should successfully update wallet coin specific data', async () => {
      const inputParams = {
        signerMacaroon: 'encrypted-macaroon-data',
        signerHost: 'signer.example.com',
        passphrase: 'wallet-password-123',
      };

      const expectedResponse = {
        coinSpecific: {
          updated: true,
        },
      };

      const updateStub = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        updateWalletCoinSpecific: updateStub,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
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

      const result = await lightningRoutes.handleUpdateLightningWalletCoinSpecific(req);

      should(result).deepEqual(expectedResponse);
      should(updateStub).be.calledOnce();
      const [firstArg] = updateStub.getCall(0).args;
      should(firstArg).have.property('signerMacaroon', 'encrypted-macaroon-data');
      should(firstArg).have.property('signerHost', 'signer.example.com');
      should(firstArg).have.property('passphrase', 'wallet-password-123');
    });

    it('should throw error when passphrase is missing', async () => {
      const invalidParams = {
        signerMacaroon: 'encrypted-data',
        signerHost: 'signer.example.com',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: invalidParams,
      });
      req.bitgo = bitgo;

      await should(handleUpdateLightningWalletCoinSpecific(req)).be.rejectedWith(
        'Invalid request body to update lightning wallet coin specific'
      );
    });

    it('should handle invalid request body', async () => {
      const invalidParams = {
        signerHost: 12345, // invalid type
        passphrase: 'valid-pass',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: invalidParams,
      });
      req.bitgo = bitgo;

      await should(handleUpdateLightningWalletCoinSpecific(req)).be.rejectedWith(
        'Invalid request body to update lightning wallet coin specific'
      );
    });
  });
});
