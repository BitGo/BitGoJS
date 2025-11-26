import * as sinon from 'sinon';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { handleV2EnableTokens } from '../../../src/clientRoutes';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';

import { BitGo } from 'bitgo';

describe('Enable tokens', () => {
  it('should enable tokens', async () => {
    const walletStub = { sendTokenEnablements: async () => Promise.resolve('success') };
    const coinStub = {
      wallets: () => ({ get: () => Promise.resolve(walletStub) }),
    };
    const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

    const mockRequest = {
      bitgo: stubBitgo,
      decoded: {
        coin: 'tbtc',
        id: '23423423423423',
      },
      body: {
        enableTokens: [{ name: 'tsol:usdc' }, { name: 'tsol:usdt' }],
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.wallet.enableTokens', 'post'>;

    await handleV2EnableTokens(mockRequest).should.be.resolvedWith('success');
  });
});
