import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { handleGetChannelBackup } from '../../../src/lightning/lightningBackupRoutes';
import { BackupResponse } from '@bitgo/abstract-lightning';
import { BitGo } from 'bitgo';

describe('Lightning Backup Routes', () => {
  const coin = 'tlnbtc';

  const mockRequestObject = (params: { params?: any; query?: any; bitgo?: any }) => {
    const req: Partial<express.Request> = {};
    req.params = params.params || {};
    req.query = params.query || {};
    req.bitgo = params.bitgo;
    return req as express.Request;
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('Get Channel Backup', () => {
    it('should successfully get channel backup', async () => {
      const expectedResponse: BackupResponse = {
        chanPoints: [
          {
            fundingTxid: 'abc123',
            outputIndex: 1,
          },
        ],
        multiChanBackup: 'base64EncodedBackupData',
      };

      const getBackupStub = sinon.stub().resolves(expectedResponse);
      const mockLightningWallet = {
        getChannelBackup: getBackupStub,
      };

      const walletStub = {
        baseCoin: {
          getChain: () => 'tlnbtc',
        },
      };
      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningBackupRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handleGetChannelBackup(req);

      should(result).deepEqual(expectedResponse);
      should(getBackupStub).be.calledOnce();
    });

    it('should handle wallet not found error', async () => {
      const coinStub = {
        wallets: () => ({
          get: sinon.stub().rejects(new Error('Wallet not found')),
        }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const req = mockRequestObject({
        params: { id: 'nonexistentWalletId', coin },
        bitgo: stubBitgo,
      });

      await should(handleGetChannelBackup(req)).be.rejectedWith('Wallet not found');
    });
  });
});
