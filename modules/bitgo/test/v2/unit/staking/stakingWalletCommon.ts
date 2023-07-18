import * as should from 'should';
import * as nock from 'nock';
import fixtures from '../../fixtures/staking/stakingWallet';

import { Enterprise, Environments, StakingRequest, StakingWallet, Wallet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';

describe('Staking Wallet Common', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let baseCoin;
  let enterprise;
  let stakingWallet: StakingWallet;

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
    const wallet = new Wallet(bitgo, baseCoin, walletData);
    stakingWallet = wallet.toStakingWallet();
  });

  describe('stake', function () {
    it('should call staking-service to stake', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          amount: '1',
          clientId: 'clientId',
          type: 'STAKE',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.stake({
        amount: '1',
        clientId: 'clientId',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });

    it('should call staking-service to stake with optional parameters', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          amount: '1',
          clientId: 'clientId',
          type: 'STAKE',
          validator: '123',
          durationSeconds: '60',
        })
        .reply(201, expected);

      const options = {
        amount: '1',
        clientId: 'clientId',
        validator: '123',
        durationSeconds: '60',
      };
      const stakingRequest = await stakingWallet.stake(options);

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });

    it('should call staking-service to stake with optional stakeMany parameters', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          clientId: 'clientId',
          type: 'STAKE',
          delegationRequests: [
            { amount: '1', validator: '123' },
            { amount: '2', validator: '456' },
          ],
          durationSeconds: '60',
        })
        .reply(201, expected);

      const options = {
        clientId: 'clientId',
        delegationRequests: [
          { amount: '1', validator: '123' },
          { amount: '2', validator: '456' },
        ],
        durationSeconds: '60',
      };
      const stakingRequest = await stakingWallet.stake(options);

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('unstake', function () {
    it('should call staking-service to unstake', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          amount: '1',
          clientId: 'clientId',
          type: 'UNSTAKE',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.unstake({
        amount: '1',
        clientId: 'clientId',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('switch validator', function () {
    it('should call staking-service to switch validator', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          amount: '1',
          clientId: 'clientId',
          validator: 'validator',
          delegationId: 'delegation',
          type: 'SWITCH_VALIDATOR',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.switchValidator({
        amount: '1',
        clientId: 'clientId',
        validator: 'validator',
        delegationId: 'delegation',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('claim rewards', function () {
    it('should call staking-service to claim rewards', async function () {
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          amount: '1',
          clientId: 'clientId',
          type: 'CLAIM_REWARDS',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.claimRewards({
        amount: '1',
        clientId: 'clientId',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('cancelStakingRequest', function () {
    it('should call staking-service to cancel staking request', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expected = {
        ...fixtures.stakingRequest([fixtures.transaction('REJECTED')]),
        status: 'REJECTED',
      };
      const msScope = nock(microservicesUri)
        .delete(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${stakingRequestId}`)
        .reply(200, expected);

      const stakingRequest = await stakingWallet.cancelStakingRequest(stakingRequestId);

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('getStakingRequest', function () {
    it('should call staking-service to get staking request', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expected = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = nock(microservicesUri)
        .get(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${stakingRequestId}`)
        .reply(200, expected);

      const stakingRequest = await stakingWallet.getStakingRequest(stakingRequestId);

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('getTransactionsReadyToSign', function () {
    function mockGetStakingRequest(stakingRequestId: string, expected: StakingRequest) {
      return nock(microservicesUri)
        .get(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${stakingRequestId}`)
        .reply(200, expected);
    }

    it('should return allSigningComplete false when no transactions exist', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expected = fixtures.stakingRequest([]);
      const msScope = mockGetStakingRequest(stakingRequestId, expected);

      const transactionsReadyToSign = await stakingWallet.getTransactionsReadyToSign(stakingRequestId);

      should.exist(transactionsReadyToSign);
      transactionsReadyToSign.allSigningComplete.should.be.False();
      transactionsReadyToSign.transactions.should.be.empty();

      msScope.isDone().should.be.True();
    });

    it('should return allSigningComplete true and 0 transactions when only a CONFIRMED transaction exists', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expected = fixtures.stakingRequest([fixtures.transaction('CONFIRMED')]);
      const msScope = mockGetStakingRequest(stakingRequestId, expected);

      const transactionsReadyToSign = await stakingWallet.getTransactionsReadyToSign(stakingRequestId);

      should.exist(transactionsReadyToSign);
      transactionsReadyToSign.allSigningComplete.should.be.True();
      transactionsReadyToSign.transactions.should.be.empty();

      msScope.isDone().should.be.True();
    });

    it('should return allSigningComplete false and 0 transactions when only a NEW transaction exists', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expectedStakingRequest = fixtures.stakingRequest([fixtures.transaction('NEW')]);
      const msScope = mockGetStakingRequest(stakingRequestId, expectedStakingRequest);

      const transactionsReadyToSign = await stakingWallet.getTransactionsReadyToSign(stakingRequestId);

      should.exist(transactionsReadyToSign);
      transactionsReadyToSign.allSigningComplete.should.be.False();
      transactionsReadyToSign.transactions.should.be.empty();

      msScope.isDone().should.be.True();
    });

    it('should return allSigningComplete false and 1 transactions when only a READY transaction exists', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expectedTransaction = fixtures.transaction('READY');
      const expectedStakingRequest = fixtures.stakingRequest([expectedTransaction]);
      const msScope = mockGetStakingRequest(stakingRequestId, expectedStakingRequest);

      const transactionsReadyToSign = await stakingWallet.getTransactionsReadyToSign(stakingRequestId);

      should.exist(transactionsReadyToSign);
      transactionsReadyToSign.allSigningComplete.should.be.False();
      transactionsReadyToSign.transactions.should.containEql(expectedTransaction);

      msScope.isDone().should.be.True();
    });

    it('should return allSigningComplete false and 1 transaction when NEW and READY transaction exists', async function () {
      const stakingRequestId = '8638284a-dab2-46b9-b07f-21109a6e7220';
      const expectedTransaction = fixtures.transaction('READY');
      const expectedStakingRequest = fixtures.stakingRequest([expectedTransaction, fixtures.transaction('NEW')]);
      const msScope = mockGetStakingRequest(stakingRequestId, expectedStakingRequest);

      const transactionsReadyToSign = await stakingWallet.getTransactionsReadyToSign(stakingRequestId);

      should.exist(transactionsReadyToSign);
      transactionsReadyToSign.allSigningComplete.should.be.False();
      transactionsReadyToSign.transactions.should.containEql(expectedTransaction);

      msScope.isDone().should.be.True();
    });
  });
});
