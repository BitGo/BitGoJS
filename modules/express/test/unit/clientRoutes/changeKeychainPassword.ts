import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleKeychainChangePassword } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Change Wallet Password', function () {
  it('should change wallet password', async function () {
    const keychainBaseCoinStub = {
      keychains: () => ({ updateSingleKeychainPassword: () => Promise.resolve({ result: 'stubbed' }) }),
    };
    const keychainStub = {
      baseCoin: keychainBaseCoinStub,
    };

    const coinStub = {
      keychains: () => ({
        get: () => Promise.resolve(keychainStub),
        updateSingleKeychainPassword: () => ({ result: 'stubbed' }),
      }),
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

    const result = await handleKeychainChangePassword(mockRequest as express.Request & typeof mockRequest);
    ({ result: '200 OK' }).should.be.eql(result);
  });
});
