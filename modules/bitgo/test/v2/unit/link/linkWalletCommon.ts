import * as should from 'should';
import * as nock from 'nock';
import fixtures from '../../fixtures/link/linkWallet';

import {
  Enterprise,
  Environments,
  LinkWallet,
  Wallet,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';

describe('Link Wallet Common', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let baseCoin;
  let enterprise;
  let wallet:Wallet;
  let linkWallet: LinkWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('eth');
    baseCoin.keychains();
    enterprise = new Enterprise(bitgo, baseCoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });
    const walletData = {
      id: 'walletId',
      coin: 'eth',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    linkWallet = wallet.toLinkWallet();
  });

  describe('transfer', function () {
    it('should call the external exchange service to transfer', async function () {
      const expected = fixtures.transfer('READY');
      const msScope = nock(microservicesUri)
        .post(`/api/external-exchange/v1/enterprise/${enterprise.id}/transfers`, {
          walletId: wallet.id(),
          coin: baseCoin.getChain(),
          amount: '1',
          connectionId: '123',
        })
        .reply(200, expected);

      const transferRequest = await linkWallet.transfer({
        amount: '1',
        connectionId: '123',
      });

      should.exist(transferRequest);

      transferRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });

  });

});
