import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { handleKeychainChangePassword } from '../../../src/clientRoutes';
import { BitGo } from 'bitgo';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { decodeOrElse } from '@bitgo/sdk-core';
import { KeychainChangePasswordResponse } from '../../../src/typedRoutes/api/v2/keychainChangePassword';

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

    const coin = 'talgo';
    const id = '23423423423423';
    const oldPassword = 'oldPasswordString';
    const newPassword = 'newPasswordString';
    const mockRequest = {
      bitgo: stubBitgo,
      params: {
        coin,
        id,
      },
      body: {
        oldPassword,
        newPassword,
      },
      decoded: {
        oldPassword,
        newPassword,
        coin,
        id,
      },
    } as unknown as ExpressApiRouteRequest<'express.keychain.changePassword', 'post'>;

    const result = await handleKeychainChangePassword(mockRequest);
    decodeOrElse('KeychainChangePasswordResponse200', KeychainChangePasswordResponse[200], result, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });
    ({ result: '200 OK' }).should.be.eql(result);
  });
});
