import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import {
  handleListLightningInvoices,
  handleUpdateLightningWalletCoinSpecific,
  handleGetLightningTransaction,
  handleGetLightningInvoice,
  handleGetLightningPayment,
  handleListLightningPayments,
} from '../../../src/lightning/lightningWalletRoutes';
import { BitGo } from 'bitgo';
import { InvoiceInfo, PaymentInfo, Transaction } from '@bitgo/abstract-lightning';
import { ApiResponseError } from '../../../src/errors';

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

  beforeEach(() => {
    const walletStub = {};
    const coinStub = {
      wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
    };
    bitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });
  });

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

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        query: queryParams,
        bitgo,
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

      const walletStub = {};
      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        query: invalidQuery,
        bitgo: stubBitgo,
      });

      await should(handleListLightningInvoices(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).containEql('Invalid query parameters for listing lightning invoices');
          should(error.message).containEql('Invalid value');
          should(error.message).containEql('invalidStatus');
        });
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

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          updateWalletCoinSpecific: updateStub,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: inputParams,
        bitgo,
      });

      const result = await lightningRoutes.handleUpdateLightningWalletCoinSpecific(req);

      should(result).deepEqual(expectedResponse);
      should(updateStub).be.calledOnce();
      const args = updateStub.getCall(0).args;
      should(args?.length).greaterThanOrEqual(2);
      const secondArg = args[1];
      should(secondArg).have.property('signerMacaroon', 'encrypted-macaroon-data');
      should(secondArg).have.property('signerHost', 'signer.example.com');
      should(secondArg).have.property('passphrase', 'wallet-password-123');
    });

    it('should throw error when passphrase is missing', async () => {
      const invalidParams = {
        signerMacaroon: 'encrypted-data',
        signerHost: 'signer.example.com',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: invalidParams,
        bitgo,
      });

      await should(handleUpdateLightningWalletCoinSpecific(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).equal('Invalid request body to update lightning wallet coin specific');
        });
    });

    it('should handle invalid request body', async () => {
      const invalidParams = {
        signerHost: 12345, // invalid type
        passphrase: 'valid-pass',
      };

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        body: invalidParams,
        bitgo,
      });

      await should(handleUpdateLightningWalletCoinSpecific(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).equal('Invalid request body to update lightning wallet coin specific');
        });
    });
  });

  describe('List Lightning Transactions', () => {
    it('should successfully list lightning transactions', async () => {
      const query = {
        limit: '25',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
      };

      const mockTransactions = [
        {
          id: 'tx1',
          normalizedTxHash: 'hash1',
          blockHeight: 100,
          blockHash: 'blockhash1',
          blockPosition: 1,
          date: new Date(),
          confirmations: 10,
          entries: [
            {
              inputs: 1,
              outputs: 1,
              value: 1000,
              valueString: '1000',
              address: 'addr1',
            },
          ],
          inputs: [
            {
              id: 'input1',
              value: 1100,
              valueString: '1100',
            },
          ],
          outputs: [
            {
              id: 'output1',
              value: 1000,
              valueString: '1000',
            },
          ],
          size: 250,
          fee: 100,
          feeString: '100',
          hex: '0x1234',
        },
      ];

      const listTransactionsSpy = sinon.stub().resolves(mockTransactions);
      const mockLightningWallet = {
        listTransactions: listTransactionsSpy,
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
        query: query,
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handleListLightningTransactions(req);

      should(result).deepEqual(mockTransactions);
      should(listTransactionsSpy).be.calledOnce();
      const [firstArg] = listTransactionsSpy.getCall(0).args;
      should(firstArg).have.property('limit', BigInt(25));
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      const listTransactionsSpy = sinon.stub().rejects(serviceError);
      const mockLightningWallet = {
        listTransactions: listTransactionsSpy,
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
        query: {},
        bitgo: stubBitgo,
      });

      await should(lightningRoutes.handleListLightningTransactions(req)).be.rejectedWith(serviceError);
    });
  });

  describe('Get Lightning Transaction', () => {
    it('should successfully get a lightning transaction', async () => {
      const mockTransaction: Transaction = {
        id: 'testId',
        blockHeight: 100,
        date: new Date(),
        normalizedTxHash: 'hash123',
        blockHash: 'blockHash123',
        blockPosition: 1,
        inputs: [
          {
            id: 'input1',
            address: 'address1',
            value: 1000,
            valueString: '1000',
            wallet: undefined,
          },
        ],
        inputIds: ['input1'],
        outputs: [
          {
            id: 'output1',
            address: 'address2',
            value: 900,
            valueString: '900',
            wallet: undefined,
          },
        ],
        entries: [
          {
            inputs: 1,
            outputs: 1,
            value: 1000,
            valueString: '1000',
            address: 'address1',
            wallet: undefined,
          },
        ],
        size: 200,
        fee: 100,
        feeString: '100',
        hex: '0x123',
        confirmations: 6,
        label: undefined,
      };

      const getTransactionSpy = sinon.stub().resolves(mockTransaction);
      const mockLightningWallet = {
        getTransaction: getTransactionSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin, txid: 'tx1' },
        bitgo,
      });

      const result = await lightningRoutes.handleGetLightningTransaction(req);

      should(result).deepEqual(mockTransaction);
      should(getTransactionSpy).be.calledOnce();
      should(getTransactionSpy.firstCall.args[0]).equal('tx1');
    });

    it('should handle missing txid parameter', async () => {
      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo,
      });

      await should(handleGetLightningTransaction(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).equal(
            "Invalid transaction parameters: Invalid value 'undefined' supplied to TransactionParams.txid, expected string."
          );
        });
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Transaction not found');
      const getTransactionSpy = sinon.stub().rejects(serviceError);
      const mockLightningWallet = {
        getTransaction: getTransactionSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin, txid: 'tx1' },
        bitgo,
      });

      await should(lightningRoutes.handleGetLightningTransaction(req)).be.rejectedWith(serviceError);
    });
  });

  describe('Get Lightning Invoice', () => {
    it('should successfully get a lightning invoice', async () => {
      const mockInvoice: InvoiceInfo = {
        invoice: 'lntb100u1p3h2jk3pp5...',
        paymentHash: 'abc123',
        valueMsat: 10000n,
        walletId: 'testWalletId',
        status: 'open',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const getInvoiceSpy = sinon.stub().resolves(mockInvoice);
      const mockLightningWallet = {
        getInvoice: getInvoiceSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin, paymentHash: 'abc123' },
        bitgo,
      });

      const result = await lightningRoutes.handleGetLightningInvoice(req);

      should(result).deepEqual(mockInvoice);
      should(getInvoiceSpy).be.calledOnce();
      should(getInvoiceSpy.firstCall.args[0]).equal('abc123');
    });

    it('should handle missing paymentHash parameter', async () => {
      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo,
      });

      await should(handleGetLightningInvoice(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).equal(
            "Invalid invoice parameters: Invalid value 'undefined' supplied to PaymentHashParams.paymentHash, expected string."
          );
        });
    });
  });

  describe('Get Lightning Payment', () => {
    it('should successfully get a lightning payment', async () => {
      const mockPayment: PaymentInfo = {
        paymentHash: 'hash123',
        walletId: 'wallet123',
        txRequestId: 'txRequest123',
        status: 'settled' as const,
        invoice: 'invoice123',
        feeLimitMsat: 1000n,
        destination: 'dest123',
        updatedAt: new Date(),
        createdAt: new Date(),
        amountMsat: 10000n,
        failureReason: undefined,
      };

      const getPaymentSpy = sinon.stub().resolves(mockPayment);
      const mockLightningWallet = {
        getPayment: getPaymentSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin, paymentHash: 'hash123' },
        bitgo,
      });

      const result = await lightningRoutes.handleGetLightningPayment(req);

      should(result).deepEqual(mockPayment);
      should(getPaymentSpy).be.calledOnce();
      should(getPaymentSpy.firstCall.args[0]).equal('hash123');
    });

    it('should handle missing paymentHash parameter', async () => {
      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo,
      });

      await should(handleGetLightningPayment(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).equal(
            "Invalid payment parameters: Invalid value 'undefined' supplied to PaymentHashParams.paymentHash, expected string."
          );
        });
    });
  });

  describe('List Lightning Payments', () => {
    it('should successfully list lightning payments', async () => {
      const query = {
        status: 'settled',
        limit: '25',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
      };

      const mockPayments: PaymentInfo[] = [
        {
          paymentHash: 'hash123',
          walletId: 'wallet123',
          txRequestId: 'txRequest123',
          status: 'settled',
          invoice: 'invoice123',
          feeLimitMsat: 1000n,
          destination: 'dest123',
          updatedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
          amountMsat: 10000n,
        },
        {
          paymentHash: 'hash456',
          walletId: 'wallet123',
          txRequestId: 'txRequest456',
          status: 'settled',
          invoice: 'invoice456',
          feeLimitMsat: 2000n,
          destination: 'dest456',
          updatedAt: new Date('2024-01-16'),
          createdAt: new Date('2024-01-16'),
          amountMsat: 20000n,
        },
      ];

      const listPaymentsSpy = sinon.stub().resolves(mockPayments);
      const mockLightningWallet = {
        listPayments: listPaymentsSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        query: query,
        bitgo,
      });

      const result = await lightningRoutes.handleListLightningPayments(req);

      should(result).deepEqual(mockPayments);
      should(listPaymentsSpy).be.calledOnce();
      const [firstArg] = listPaymentsSpy.getCall(0).args;
      should(firstArg).have.property('status', 'settled');
      should(firstArg).have.property('limit', BigInt(25));
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
        bitgo,
      });

      await should(handleListLightningPayments(req))
        .be.rejectedWith(ApiResponseError)
        .then((error) => {
          should(error.status).equal(400);
          should(error.message).containEql('Invalid query parameters for listing lightning payments');
        });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      const listPaymentsSpy = sinon.stub().rejects(serviceError);
      const mockLightningWallet = {
        listPayments: listPaymentsSpy,
      };

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningWalletRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        query: {},
        bitgo,
      });

      await should(lightningRoutes.handleListLightningPayments(req)).be.rejectedWith(serviceError);
    });
  });
});
