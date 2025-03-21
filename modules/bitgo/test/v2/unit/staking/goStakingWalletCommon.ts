import * as nock from 'nock';
import * as should from 'should';
import fixtures from '../../fixtures/staking/goStakingWallet';

import { Enterprise, Environments, GoStakingWallet, Wallet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';
import { OfcToken } from '../../../../src/v2/coins';
import { tokens } from '@bitgo/statics';

describe('Go Staking Wallet Common', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let baseCoin;
  let enterprise;
  let stakingWallet: GoStakingWallet;
  const coin = 'tsol';

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('ofc');
    baseCoin.keychains();
    const ofcToken = tokens.testnet.ofc.tokens.filter((token) => token.type === `ofc${coin}`)[0];
    const tokenConstructor = OfcToken.createTokenConstructor(ofcToken);
    bitgo.register('ofc', OfcToken.createInstance);
    bitgo.register(ofcToken.type, tokenConstructor);

    enterprise = new Enterprise(bitgo, baseCoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });
    const walletData = {
      id: 'walletId',
      coin: 'ofc',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    const wallet = new Wallet(bitgo, baseCoin, walletData);
    stakingWallet = wallet.toGoStakingWallet();
  });

  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.verifyAndRestore();
  });

  describe('stake', function () {
    it('should call go-staking-service to stake', async function () {
      const preview = fixtures.previewGoStakingRequest(coin);
      const msScope1 = nock(microservicesUri)
        .post(`/api/go-staking/v1/${coin}/accounts/${stakingWallet.accountId}/requests/preview`, {
          amount: '1',
          clientId: 'clientId',
          type: 'STAKE',
        })
        .reply(201, preview);

      const expected = fixtures.finalizeGoStakingRequest(coin, 'STAKE');
      const msScope2 = nock(microservicesUri)
        .post(`/api/go-staking/v1/${coin}/accounts/${stakingWallet.accountId}/requests/finalize`, {
          amount: '1',
          clientId: 'clientId',
          frontTransferSendRequest: {
            halfSigned: {
              payload: preview.payload,
            },
          },
          type: 'STAKE',
        })
        .reply(201, expected);
      nock(microservicesUri).get(`/api/v2/ofc/key/${stakingWallet.wallet.keyIds()[0]}`).reply(200, {
        id: stakingWallet.wallet.keyIds()[0],
        pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        source: 'user',
        encryptedPrv:
          '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
        coinSpecific: {},
      });

      const stakingRequest = await stakingWallet.stake(coin, {
        amount: '1',
        clientId: 'clientId',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope1.isDone().should.be.True();
      msScope2.isDone().should.be.True();
    });
  });

  describe('unstake', function () {
    it('should call go-staking-service to unstake', async function () {
      const expected = fixtures.finalizeGoStakingRequest(coin, 'UNSTAKE');
      const msScope = nock(microservicesUri)
        .post(`/api/go-staking/v1/${coin}/accounts/${stakingWallet.accountId}/requests/finalize`, {
          amount: '1',
          clientId: 'clientId',
          type: 'UNSTAKE',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.unstake(coin, {
        amount: '1',
        clientId: 'clientId',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('getGoStakingRequest', function () {
    it('should call gostaking-service to get go staking request', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expected = fixtures.finalizeGoStakingRequest(coin, 'STAKE');
      const msScope = nock(microservicesUri)
        .get(`/api/go-staking/v1/${coin}/accounts/${stakingWallet.accountId}/requests/${stakingRequestId}`)
        .reply(200, expected);

      const stakingRequest = await stakingWallet.getGoStakingRequest(coin, stakingRequestId);

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });
});
