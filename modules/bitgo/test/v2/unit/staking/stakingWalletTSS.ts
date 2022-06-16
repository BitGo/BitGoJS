import * as _ from 'lodash';

import * as nock from 'nock';
import fixtures from '../../fixtures/staking/stakingWallet';

import {
  Enterprise,
  Environments,
  Keychains,
  StakingWallet,
  TssUtils,
  Wallet,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';

import * as sinon from 'sinon';

describe('TSS Staking Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let baseCoin;
  let enterprise;
  let stakingWallet: StakingWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('near');
    baseCoin.keychains();
    enterprise = new Enterprise(bitgo, baseCoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'TSS Test Enterprise' });
    const tssWalletData = {
      id: 'walletIdTss',
      coin: 'near',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    const wallet = new Wallet(bitgo, baseCoin, tssWalletData);
    stakingWallet = wallet.toStakingWallet();
  });

  describe('buildSignAndSend', function () {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.verifyAndRestore();
    });

    it('should throw error when txRequestId is not defined', async function () {
      const transaction = fixtures.transaction('READY');
      transaction.txRequestId = undefined;
      await stakingWallet.buildSignAndSend(
        { walletPassphrase: 'passphrase' },
        transaction,
      ).should.rejectedWith('txRequestId is required to sign and send');
    });

    it('should build, sign and send transaction', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY');
      const deleteSignatureShares = sandbox.stub(TssUtils.prototype, 'deleteSignatureShares');
      deleteSignatureShares.resolves([]);
      deleteSignatureShares.calledOnceWithExactly(transaction.id);

      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keyChain = {
        id: 'id',
        pub: 'pub',
      };
      getKeysForSigning.resolves([keyChain]);
      getKeysForSigning.calledOnce;

      const signTransaction = sandbox.stub(Wallet.prototype, 'signTransaction');
      signTransaction.resolves({ txRequestId: fixtures.txRequestId });
      signTransaction.calledOnceWithExactly({
        txPrebuild: {
          txRequestId: fixtures.txRequestId,
        },
        walletPassphrase: walletPassphrase,
        keychain: keyChain,
      });

      nock(microservicesUri)
        .post(`/api/staking/v1/${stakingWallet.coin}/wallets/${stakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`,
          _.matches({ txRequestId: fixtures.txRequestId }))
        .reply(200, transaction);

      const stakingTransaction = await stakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction,
      );

      stakingTransaction.should.deepEqual(transaction);
    });

  });
});
