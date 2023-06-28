import * as _ from 'lodash';

import * as nock from 'nock';
import fixtures from '../../fixtures/staking/stakingWallet';

import { Enterprise, Environments, Keychain, Keychains, StakingWallet, TssUtils, Wallet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';

import * as sinon from 'sinon';

describe('TSS Staking Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let nearBaseCoin;
  let ethBaseCoin;
  let atomBaseCoin;
  let enterprise;
  let ethWalletData: any;
  let nearStakingWallet: StakingWallet;
  let ethStakingWallet: StakingWallet;
  let atomStakingWallet: StakingWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    nearBaseCoin = bitgo.coin('near');
    nearBaseCoin.keychains();
    ethBaseCoin = bitgo.coin('eth');
    ethBaseCoin.keychains();
    atomBaseCoin = bitgo.coin('atom');
    atomBaseCoin.keychains();
    enterprise = new Enterprise(bitgo, nearBaseCoin, {
      id: '5cf940949449412d00f53b3d92dbcaa3',
      name: 'TSS Test Enterprise',
    });
    const tssWalletData = {
      id: 'walletIdTss',
      coin: 'near',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    const nearWallet = new Wallet(bitgo, nearBaseCoin, tssWalletData);
    nearStakingWallet = nearWallet.toStakingWallet();

    ethWalletData = {
      id: 'walletId',
      coin: 'eth',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
      coinSpecific: { walletVersion: 3 },
    };
    const ethWallet = new Wallet(bitgo, ethBaseCoin, ethWalletData);
    ethStakingWallet = ethWallet.toStakingWallet();

    const atomWallet = new Wallet(bitgo, atomBaseCoin, { ...tssWalletData, coin: 'atom' });
    atomStakingWallet = atomWallet.toStakingWallet();
  });

  describe('buildSignAndSend', function () {
    const sandbox = sinon.createSandbox();

    afterEach(function () {
      sandbox.verifyAndRestore();
    });

    it('should throw error when txRequestId is not defined', async function () {
      const transaction = fixtures.transaction('READY');
      transaction.txRequestId = undefined;
      await nearStakingWallet
        .buildSignAndSend({ walletPassphrase: 'passphrase' }, transaction)
        .should.rejectedWith('txRequestId is required to sign and send');
    });

    it('should build, sign and send transaction', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY');
      const deleteSignatureShares = sandbox.stub(TssUtils.prototype, 'deleteSignatureShares');
      deleteSignatureShares.resolves([]);
      deleteSignatureShares.calledOnceWithExactly(transaction.id);

      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keyChain: Keychain = {
        id: 'id',
        pub: 'pub',
        type: 'tss',
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
        .post(
          `/api/staking/v1/${nearStakingWallet.coin}/wallets/${nearStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`,
          _.matches({ txRequestId: fixtures.txRequestId })
        )
        .reply(200, transaction);

      const stakingTransaction = await nearStakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction
      );

      stakingTransaction.should.deepEqual(transaction);
    });

    it('should build and sign but not send transaction for ETH TSS or ECDSA based TSS Coin', async function () {
      [ethStakingWallet, atomStakingWallet].forEach(async (ecdsaStakingWallet) => {
        const walletPassphrase = 'passphrase';
        const transaction = fixtures.transaction('READY');
        const deleteSignatureShares = sandbox.stub(TssUtils.prototype, 'deleteSignatureShares');
        deleteSignatureShares.resolves([]);
        deleteSignatureShares.calledOnceWithExactly(transaction.id);

        const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
        const keyChain: Keychain = {
          id: 'id',
          pub: 'pub',
          type: 'tss',
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

        const stakingTransaction = await ecdsaStakingWallet.buildSignAndSend(
          { walletPassphrase: walletPassphrase },
          transaction
        );

        stakingTransaction.should.deepEqual(transaction);
      });
    });
  });
});
