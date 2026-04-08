import nock = require('nock');
import should = require('should');
import fixtures from '../../fixtures/staking/stakingWallet';

import {
  Enterprise,
  Environments,
  Keychain,
  Keychains,
  StakingRequest,
  StakingWallet,
  TssUtils,
  Wallet,
  P2pClaimSsvRewardsResponse,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';

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

  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.verifyAndRestore();
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
          delegationId: 'delegation',
          type: 'CLAIM_REWARDS',
        })
        .reply(201, expected);

      const stakingRequest = await stakingWallet.claimRewards({
        amount: '1',
        clientId: 'clientId',
        delegationId: 'delegation',
      });

      should.exist(stakingRequest);

      stakingRequest.should.deepEqual(expected);
      msScope.isDone().should.be.True();
    });
  });

  describe('claimSsvRewards', function () {
    const withdrawalAddress = '0xDeadBeef0000000000000000000000000000cafe';
    const p2pResponse: P2pClaimSsvRewardsResponse = {
      netAmount: '900000000000000000',
      fee: '100000000000000000',
      claimedAmount: '1000000000000000000',
      transaction: {
        to: '0xSsvProxyContract0000000000000000000000ab',
        data: '0xabcdef',
        value: '0',
      },
    };

    it('should call P2P API then create a CLAIM_SSV_REWARDS staking request', async function () {
      const expectedStakingRequest = fixtures.stakingRequest([]);

      // 1. P2P claim endpoint
      const p2pScope = nock(microservicesUri)
        .get(`/api/v1/eth/staking/ssv/p2p/claim`)
        .query({ withdrawalAddress })
        .reply(200, p2pResponse);

      // 2. Create staking request
      const stakeScope = nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`, {
          clientId: 'clientId',
          withdrawalAddress,
          transaction: p2pResponse.transaction,
          netAmount: p2pResponse.netAmount,
          fee: p2pResponse.fee,
          claimedAmount: p2pResponse.claimedAmount,
          type: 'CLAIM_SSV_REWARDS',
        })
        .reply(201, expectedStakingRequest);

      // 3. getTransactionsReadyToSign → GET staking request (no READY transactions)
      const getScope = nock(microservicesUri)
        .get(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${expectedStakingRequest.id}`
        )
        .reply(200, expectedStakingRequest);

      const stakingRequest = await stakingWallet.claimSsvRewards({
        withdrawalAddress,
        clientId: 'clientId',
        walletPassphrase: 'passphrase',
      });

      should.exist(stakingRequest);
      stakingRequest.should.deepEqual(expectedStakingRequest);
      p2pScope.isDone().should.be.True();
      stakeScope.isDone().should.be.True();
      getScope.isDone().should.be.True();
    });

    it('should build, sign and send READY transactions after creating the staking request', async function () {
      const readyTransaction = fixtures.transaction('READY', fixtures.buildParams, false);
      const expectedStakingRequest = fixtures.stakingRequest([readyTransaction]);

      // 1. P2P claim endpoint
      nock(microservicesUri)
        .get(`/api/v1/eth/staking/ssv/p2p/claim`)
        .query({ withdrawalAddress })
        .reply(200, p2pResponse);

      // 2. Create staking request
      nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests`)
        .reply(201, expectedStakingRequest);

      // 3. getTransactionsReadyToSign → GET staking request (has one READY transaction)
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${expectedStakingRequest.id}`
        )
        .reply(200, expectedStakingRequest);

      // 4. buildSignAndSend → expand build params
      const expandedTransaction = { ...readyTransaction, buildParams: fixtures.buildParams };
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${readyTransaction.stakingRequestId}/transactions/${readyTransaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, expandedTransaction);

      // 5. Stub prebuildTransaction to avoid real ETH tx building
      const txPrebuild = { txHex: 'hex', buildParams: fixtures.buildParams };
      const prebuildStub = sandbox.stub(Wallet.prototype, 'prebuildTransaction').resolves(txPrebuild);

      // 6. Skip transaction validation (mock data is not a valid transaction)
      sandbox.stub(StakingWallet.prototype, 'validateBuiltStakingTransaction' as never).resolves();

      // 7. Stub getKeysForSigning and signTransaction
      const keyChain: Keychain = { id: 'id', pub: 'pub', type: 'independent' };
      sandbox.stub(Keychains.prototype, 'getKeysForSigning').resolves([keyChain]);
      const signed = { halfSigned: { txHex: 'hex' } };
      const signStub = sandbox.stub(Wallet.prototype, 'signTransaction').resolves(signed);

      // 8. Send signed transaction
      const sentTransaction = { ...readyTransaction, status: 'DELIVERED' };
      nock(microservicesUri)
        .post(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${readyTransaction.stakingRequestId}/transactions/${readyTransaction.id}`
        )
        .reply(200, sentTransaction);

      const stakingRequest = await stakingWallet.claimSsvRewards({
        withdrawalAddress,
        walletPassphrase: 'passphrase',
      });

      should.exist(stakingRequest);
      stakingRequest.should.deepEqual(expectedStakingRequest);
      prebuildStub.calledOnce.should.be.True();
      signStub.calledOnce.should.be.True();
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

  describe('prebuildSelfManagedStakingTransaction', function () {
    it('should prebuild self-managed staking transaction', async function () {
      const transaction = fixtures.transaction('READY', fixtures.buildParams, false);
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const deleteSignatureShares = sandbox.stub(TssUtils.prototype, 'deleteSignatureShares');
      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const build = sandbox.stub(StakingWallet.prototype, 'build');
      const txPrebuild = {
        walletId: stakingWallet.walletId,
        txHex: 'hex',
        buildParams: transaction.buildParams,
      };
      prebuildTransaction.resolves(txPrebuild);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams);
      const formattedParams = {
        ...fixtures.buildParams,
        coin: stakingWallet.coin,
        walletId: stakingWallet.walletId,
        walletType: stakingWallet.wallet.type(),
        preview: true,
      };
      const stakingTransaction = await stakingWallet.prebuildSelfManagedStakingTransaction(transaction);
      sandbox.assert.calledOnce(prebuildTransaction);
      sandbox.assert.notCalled(build);
      sandbox.assert.notCalled(deleteSignatureShares);

      const expected = await stakingWallet.wallet.prebuildTransaction(formattedParams);
      stakingTransaction.should.deepEqual(expected);
      should.exist(stakingTransaction);
    });
    it('should prebuild self-managed staking transaction - no build params', async function () {
      const transaction = fixtures.transaction('READY', undefined, true);
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const deleteSignatureShares = sandbox.stub(TssUtils.prototype, 'deleteSignatureShares');
      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const build = sandbox.stub(StakingWallet.prototype, 'build');
      const txPrebuild = {
        walletId: stakingWallet.walletId,
        txHex: 'hex',
      };
      prebuildTransaction.resolves(txPrebuild);
      if (transaction.txRequestId) {
        deleteSignatureShares.calledOnceWithExactly(transaction.txRequestId);
      }
      const formattedParams = {
        ...fixtures.buildParams,
        coin: stakingWallet.coin,
        walletId: stakingWallet.walletId,
        walletType: stakingWallet.wallet.type(),
        preview: true,
      };
      const stakingTransaction = await stakingWallet.prebuildSelfManagedStakingTransaction(transaction);
      sandbox.assert.calledOnce(prebuildTransaction);
      sandbox.assert.notCalled(build);
      sandbox.assert.calledOnce(deleteSignatureShares);

      const expected = await stakingWallet.wallet.prebuildTransaction(formattedParams);

      stakingTransaction.should.deepEqual(expected);
      should.exist(stakingTransaction);
    });
  });
});
