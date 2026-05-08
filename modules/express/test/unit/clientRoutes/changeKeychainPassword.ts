import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { handleKeychainChangePassword } from '../../../src/clientRoutes';
import { BitGo } from 'bitgo';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { decodeOrElse } from '@bitgo/sdk-core';
import { KeychainChangePasswordResponse } from '../../../src/typedRoutes/api/v2/keychainChangePassword';
import * as assert from 'assert';
import { ApiResponseError } from '../../../src/errors';

describe('Change Wallet Password', function () {
  const id = '23423423423423';
  const oldPassword = 'oldPasswordString';
  const newPassword = 'newPasswordString';

  const keychainBaseCoinStub = {
    keychains: () => ({ updateSingleKeychainPassword: () => Promise.resolve({ result: 'stubbed' }) }),
  };

  it('should change wallet password', async function () {
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

  describe('ofc wallet test', function () {
    it('should change ofc multi-user-key wallet password', async function () {
      const keychainStub = {
        baseCoin: keychainBaseCoinStub,
        coinSpecific: {
          ofc: {
            features: ['multi-user-key'],
          },
        },
        pub: 'pub',
      };

      const coinStub = {
        keychains: () => ({
          get: () => Promise.resolve(keychainStub),
          updateSingleKeychainPassword: () => ({ result: 'stubbed' }),
        }),
        url: () => 'url',
      };

      const sendStub = sinon.stub().resolves({ result: '200 OK' });
      const stubBitgo = sinon.createStubInstance(BitGo as any, {
        coin: coinStub,
      });
      stubBitgo['put'] = sinon.stub().returns({
        send: sendStub,
      });

      const coin = 'ofc';
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
      sinon.assert.calledWith(sendStub, { encryptedPrv: sinon.match.any, pub: 'pub' });
    });

    it('should change ofc non multi-user-key wallet password', async function () {
      const keychainStub = {
        baseCoin: keychainBaseCoinStub,
        coinSpecific: {
          ofc: {
            features: [],
          },
        },
        pub: 'pub',
      };

      const coinStub = {
        keychains: () => ({
          get: () => Promise.resolve(keychainStub),
          updateSingleKeychainPassword: () => ({ result: 'stubbed' }),
        }),
        url: () => 'url',
      };

      const sendStub = sinon.stub().resolves({ result: '200 OK' });
      const stubBitgo = sinon.createStubInstance(BitGo as any, {
        coin: coinStub,
      });
      stubBitgo['put'] = sinon.stub().returns({
        send: sendStub,
      });

      const coin = 'ofc';
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
      sinon.assert.calledWith(sendStub, { encryptedPrv: sinon.match.any, pub: 'pub' });
    });

    it('should throw updating ofc multi-user-key without a valid pub', async function () {
      const keychainStub = {
        baseCoin: keychainBaseCoinStub,
        coinSpecific: {
          ofc: {
            features: ['multi-user-key'],
          },
        },
      };

      const coinStub = {
        keychains: () => ({
          get: () => Promise.resolve(keychainStub),
          updateSingleKeychainPassword: () => ({ result: 'stubbed' }),
        }),
        url: () => 'url',
      };

      const sendStub = sinon.stub().resolves({ result: '200 OK' });
      const stubBitgo = sinon.createStubInstance(BitGo as any, {
        coin: coinStub,
      });
      stubBitgo['put'] = sinon.stub().returns({
        send: sendStub,
      });

      const coin = 'ofc';
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

      await assert.rejects(
        async () => await handleKeychainChangePassword(mockRequest),
        (err: ApiResponseError) =>
          err.status === 500 &&
          err.message === `Unexpected missing field "keychain.pub". Please contact support@bitgo.com for more details`
      );
    });
  });
});
