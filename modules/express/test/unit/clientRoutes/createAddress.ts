import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { handleV2CreateAddress } from '../../../src/clientRoutes';

import { BitGo } from 'bitgo';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { CreateAddressResponse } from '../../../src/typedRoutes/api/v2/createAddress';
import { decodeOrElse } from '@bitgo/sdk-core';

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
        walletId: '23423423423423',
      },
      query: {},
      body: {
        chain: 0,
      },
      decoded: {
        coin: 'tbtc',
        walletId: '23423423423423',
        chain: 0,
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.wallet.createAddress', 'post'>;

    const result = await handleV2CreateAddress(req).should.be.resolvedWith(res);
    decodeOrElse('express.v2.wallet.createAddress', CreateAddressResponse[200], result, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });
  });
});
