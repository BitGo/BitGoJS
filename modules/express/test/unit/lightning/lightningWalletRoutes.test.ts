import * as sinon from 'sinon';
import should from 'should';
import { BitGo } from 'bitgo';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';

describe('Lightning Wallet Routes', () => {
  let bitgo;
  const coin = 'tlnbtc';

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

      const req = {
        params: { id: 'testWalletId', coin },
        body: inputParams,
        decoded: {
          id: 'testWalletId',
          coin,
          ...inputParams,
        },
        bitgo,
      } as unknown as ExpressApiRouteRequest<'express.wallet.update', 'put'>;

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
  });
});
