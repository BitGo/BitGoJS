import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import * as express from 'express';

import { handleV2CreateAddress } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';

describe('Create Address', () => {
  function createAddressMocks(res) {
    const createAddressStub = sinon.stub().returns(res);
    const walletStub = { createAddress: createAddressStub };
    const coinStub = {
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    return {
      bitgoStub: sinon.createStubInstance(BitGo as any, { coin: coinStub }),
      createAddressStub,
    };
  }

  it('should return the address object', async () => {
    const res = { address: 'addressdata' };
    const { bitgoStub } = createAddressMocks(res);
    const req = {
      bitgo: bitgoStub,
      params: {
        coin: 'tbtc',
        id: '23423423423423',
      },
      query: {},
      body: {
        chain: 0,
      },
    } as unknown as express.Request;

    await handleV2CreateAddress(req).should.be.resolvedWith(res);
  });
});
