import * as _ from 'lodash';

import * as nock from 'nock';
import fixtures from '../../fixtures/staking/stakingWallet';

import { Enterprise, Environments, Keychain, Keychains, StakingWallet, Wallet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';

describe('non-TSS Staking Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let ethBaseCoin;
  let maticBaseCoin;
  let btcBaseCoin;
  let enterprise;
  let ethWalletData: any;
  let btcWalletData: any;
  let btcDescriptorWalletData: any;
  let ethStakingWallet: StakingWallet;
  let maticStakingWallet: StakingWallet;
  let btcStakingWallet: StakingWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    ethBaseCoin = bitgo.coin('eth');
    ethBaseCoin.keychains();
    maticBaseCoin = bitgo.coin('matic');
    maticBaseCoin.keychains();
    btcBaseCoin = bitgo.coin('btc');
    btcBaseCoin.keychains();

    enterprise = new Enterprise(bitgo, ethBaseCoin, {
      id: '5cf940949449412d00f53b3d92dbcaa3',
      name: 'Test Enterprise',
    });
    ethWalletData = {
      id: 'walletId',
      coin: 'eth',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
      coinSpecific: { walletVersion: 2 },
    };
    const maticWalletData = {
      id: 'maticWalletId',
      coin: 'matic',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
    };
    btcWalletData = {
      id: 'btcWalletId',
      coin: 'btc',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
      coinSpecific: {},
    };
    btcDescriptorWalletData = {
      id: 'btcDescriptorWalletId',
      coin: 'btc',
      enterprise: enterprise.id,
      keys: ['5b3424f91bf349930e340175'],
      coinSpecific: {},
    };
    const ethWallet = new Wallet(bitgo, ethBaseCoin, ethWalletData);
    const maticWallet = new Wallet(bitgo, maticBaseCoin, maticWalletData);
    const btcWallet = new Wallet(bitgo, btcBaseCoin, btcWalletData);
    ethStakingWallet = ethWallet.toStakingWallet();
    maticStakingWallet = maticWallet.toStakingWallet();
    btcStakingWallet = btcWallet.toStakingWallet();
  });

  const sandbox = sinon.createSandbox();

  afterEach(function () {
    sandbox.verifyAndRestore();
  });

  describe('buildSignAndSend', function () {
    it('should build, sign and send transaction', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY', fixtures.buildParams);

      // BUILD
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${ethStakingWallet.coin}/wallets/${ethStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const txPrebuild = {
        walletId: ethStakingWallet.walletId,
        txHex: 'hex',
        buildParams: transaction.buildParams,
      };
      prebuildTransaction.resolves(txPrebuild);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams);

      // SIGN
      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keyChain: Keychain = {
        id: 'id',
        pub: 'pub',
        type: 'independent',
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
        .post(
          `/api/staking/v1/${ethStakingWallet.coin}/wallets/${ethStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`,
          _.matches(signed)
        )
        .reply(200, transaction);

      const stakingTransaction = await ethStakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction
      );

      stakingTransaction.should.deepEqual(transaction);
    });

    it('should throw error when buildParams are not expanded', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY');

      // BUILD
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${ethStakingWallet.coin}/wallets/${ethStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      await ethStakingWallet
        .buildSignAndSend({ walletPassphrase: walletPassphrase }, transaction)
        .should.rejectedWith(`Staking transaction ${transaction.id} build params not expanded`);
    });
  });

  describe('token buildSignAndSend', function () {
    afterEach(function () {
      sandbox.verifyAndRestore();
    });

    it('should build, sign and send transaction', async function () {
      const walletPassphrase = 'passphrase';
      const transaction = fixtures.transaction('READY', fixtures.buildParams);

      // BUILD
      nock(microservicesUri)
        .get(
          `/api/staking/v1/${maticStakingWallet.coin}/wallets/${maticStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const txPrebuild = {
        walletId: maticStakingWallet.walletId,
        txHex: 'hex',
        buildParams: transaction.buildParams,
      };
      prebuildTransaction.resolves(txPrebuild);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams);

      // SIGN
      const getKeysForSigning = sandbox.stub(Keychains.prototype, 'getKeysForSigning');
      const keyChain: Keychain = {
        id: 'id',
        pub: 'pub',
        type: 'independent',
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

      const type = maticStakingWallet.wallet.baseCoin.tokenConfig?.type;
      const coin = maticStakingWallet.wallet.baseCoin.tokenConfig?.coin;
      // get wallet for building and signing
      nock(microservicesUri).get(`/api/v2/${coin}/wallet/${maticStakingWallet.walletId}`).reply(200, ethWalletData);
      // SEND
      nock(microservicesUri)
        .post(
          `/api/staking/v1/${type}/wallets/${maticStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`,
          _.matches(signed)
        )
        .reply(200, transaction);

      const stakingTransaction = await maticStakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction
      );

      stakingTransaction.should.deepEqual(transaction);
    });
  });

  describe('BTC staking', function () {
    it('btc delegation transaction', async function () {
      const transaction = fixtures.transaction('READY', fixtures.buildParams, false);

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${btcStakingWallet.coin}/wallets/${btcStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      const descriptor = sandbox.stub(StakingWallet.prototype, <any>'getDescriptorWallet');
      await btcStakingWallet.build(transaction);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams).should.be.true;
      descriptor.notCalled.should.be.true;
    });

    it('btc undelegation transaction', async function () {
      const transaction = fixtures.transaction('READY', fixtures.btcUnstakingBuildParams, false, 'UNDELEGATE_WITHDRAW');

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${btcStakingWallet.coin}/wallets/${btcStakingWallet.walletId}/requests/${transaction.stakingRequestId}/transactions/${transaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, transaction);
      nock(microservicesUri)
        .get(`/api/v2/btc/wallet/${btcDescriptorWalletData.id}`)
        .reply(200, btcDescriptorWalletData);

      const prebuildTransaction = sandbox.stub(Wallet.prototype, 'prebuildTransaction');
      await btcStakingWallet.build(transaction);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams).should.be.true;
    });
  });
});
