import * as _ from 'lodash';

import * as nock from 'nock';
import fixtures from '../../fixtures/staking/stakingWallet';

import {
  Enterprise,
  Environments,
  Keychains,
  StakingWallet,
  Wallet,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';

describe('non-TSS Staking Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let baseCoin;
  let enterprise;
  let stakingWallet: StakingWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('avaxp');
    baseCoin.keychains();
    enterprise = new Enterprise(bitgo, baseCoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });
    const walletData = {
      id: 'walletId',
      coin: 'avaxp',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    const wallet = new Wallet(bitgo, baseCoin, walletData);
    stakingWallet = wallet.toStakingWallet();
  });

  describe('buildSignAndSend', function () {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.verifyAndRestore();
    });

    it('should build, sign and send transaction', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY', fixtures.buildParams);

      // BUILD
      nock(microservicesUri)
        .get(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`)
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const txPrebuild = {
        walletId: stakingWallet.walletId,
        txHex: 'hex',
        buildParams: transaction.buildParams,
      };
      prebuildTransaction.resolves(txPrebuild);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams);

      // SIGN
      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keyChain = {
        id: 'id',
        pub: 'pub',
      };
      getKeysForSigning.resolves([keyChain]);
      getKeysForSigning.calledOnce;

      const signTransaction = sandbox.stub(Wallet.prototype, 'signTransaction');
      const signed = {
        halfSigned: {
          txHex: 'hex',
          payload: 'payload',
          txBase64: 'base64',
        },
      };
      signTransaction.resolves(signed);
      signTransaction.calledOnceWithExactly({
        txPrebuild: txPrebuild,
        walletPassphrase: walletPassphrase,
        keychain: keyChain,
      });

      // SEND
      nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`,
          _.matches(signed))
        .reply(200, transaction);

      const stakingTransaction = await stakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction,
      );

      stakingTransaction.should.deepEqual(transaction);
    });

    it('should throw error when buildParams are not expanded', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY');

      // BUILD
      nock(microservicesUri)
        .get(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`)
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      await stakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction,
      ).should.rejectedWith(`Staking transaction ${transaction.id} build params not expanded`);
    });

  });
});
