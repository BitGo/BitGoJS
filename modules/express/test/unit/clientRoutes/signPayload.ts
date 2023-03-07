import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { Request } from 'express';
import { handleV2OFCSignPayload } from '../../../src/clientRoutes';

import { BitGo, BaseCoin, Wallet, Wallets } from 'bitgo';

describe('Sign an arbitrary payload with trading account key', function () {
  const coin = 'ofc';
  const payload = {
    this: {
      is: {
        a: 'payload',
      },
    },
  };
  const signature = 'signedPayload123';
  const walletId = 'myWalletId';

  const walletStub = sinon.createStubInstance(
    Wallet as any,
    {
      id: walletId,
      coin: sinon.stub().returns(coin),
      toTradingAccount: sinon.stub().returns({
        signPayload: sinon.stub().returns(signature),
      }),
    },
  );

  const walletsStub = sinon.createStubInstance(
    Wallets as any,
    {
      get: sinon.stub().resolves(walletStub),
    }
  );

  const coinStub = sinon.createStubInstance(
    BaseCoin as any,
    ({ wallets: sinon.stub().returns(walletsStub) })
  );

  const bitGoStub = sinon.createStubInstance(
    BitGo as any,
    { coin: sinon.stub().returns(coinStub) }
  );

  before(() => {
    process.env['WALLET_myWalletId_PASSPHRASE'] = 'mypass';
  });

  it('should return a signed payload', async function () {
    const expectedResponse = {
      payload: JSON.stringify(payload),
      signature,
    };
    const req = {
      bitgo: bitGoStub,
      body: {
        payload,
        walletId,
      },
      query: {},
    } as unknown as Request;
    await handleV2OFCSignPayload(req).should.be.resolvedWith(expectedResponse);
  });
});
