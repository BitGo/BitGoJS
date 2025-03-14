import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { handleUpdateLightningWalletCoinSpecific } from '../../../src/lightning/lightningWalletRoutes';
import { BitGo } from 'bitgo';
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
});
