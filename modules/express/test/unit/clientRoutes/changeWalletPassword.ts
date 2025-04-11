import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleWalletChangePassword } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Change Wallet Password', function () {
  it('should change wallet password', async function () {
    const walletBaseCoinStub = {
      keychains: () => ({ updateSingleKeychainPassword: () => Promise.resolve({ result: 'stubbed' }) }),
    };
    const walletStub = {
      getEncryptedUserKeychain: () => Promise.resolve({}),
      baseCoin: walletBaseCoinStub,
    };

    const coinStub = {
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
      url: () => 'url',
    };

    const stubBitgo = sinon.createStubInstance(BitGo as any, {
      coin: coinStub,
    });
    stubBitgo['put'] = sinon.stub().returns({
      send: () => ({
        result: '200 OK',
      }),
    });

    const mockRequest = {
      bitgo: stubBitgo,
      params: {
        coin: 'talgo',
        id: '23423423423423',
      },
      body: {
        oldPassword: 'oldPasswordString',
        newPassword: 'newPasswordString',
      },
    };

    const result = await handleWalletChangePassword(mockRequest as express.Request & typeof mockRequest);
    ({ result: '200 OK' }).should.be.eql(result);
  });
});
