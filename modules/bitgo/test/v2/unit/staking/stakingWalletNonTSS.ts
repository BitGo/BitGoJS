import * as _ from 'lodash';

import nock = require('nock');
import fixtures from '../../fixtures/staking/stakingWallet';
import * as opethFixtures from '../../fixtures/staking/topethStakingFixtures';
import * as avaxpStakingFixtures from '../../fixtures/staking/tavaxpStakingFixtures';

import {
  Enterprise,
  Environments,
  Keychain,
  Keychains,
  PrebuildTransactionResult,
  StakingTransaction,
  StakingWallet,
  Wallet,
  WalletCoinSpecific,
  WalletData,
} from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import * as sinon from 'sinon';

describe('non-TSS Staking Wallet', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let ethBaseCoin;
  let maticBaseCoin;
  let btcBaseCoin;
  let topethWctBaseCoin;
  let tavaxpBaseCoin;
  let enterprise;
  let ethWalletData: any;
  let btcWalletData: any;
  let topethWctStakingWalletData: WalletData;
  let tavaxpStakingWalletData: WalletData;
  let btcDescriptorWalletData: any;
  let ethStakingWallet: StakingWallet;
  let maticStakingWallet: StakingWallet;
  let btcStakingWallet: StakingWallet;
  let topethWctStakingWallet: StakingWallet;
  let tavaxpStakingWallet: StakingWallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    ethBaseCoin = bitgo.coin('eth');
    ethBaseCoin.keychains();
    maticBaseCoin = bitgo.coin('matic');
    maticBaseCoin.keychains();
    btcBaseCoin = bitgo.coin('btc');
    btcBaseCoin.keychains();
    topethWctBaseCoin = bitgo.coin('topeth:wct');
    tavaxpBaseCoin = bitgo.coin('tavaxp');

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

    topethWctStakingWalletData = {
      approvalsRequired: 0,
      balance: 0,
      balanceString: '',
      coinSpecific: {} as WalletCoinSpecific,
      confirmedBalance: 0,
      confirmedBalanceString: '',
      keys: [],
      label: '',
      multisigType: 'onchain',
      pendingApprovals: [],
      spendableBalance: 0,
      spendableBalanceString: '',
      id: 'topethWctStakingWalletId',
      coin: 'topeth:wct',
      enterprise: enterprise.id,
    };

    tavaxpStakingWalletData = {
      approvalsRequired: 0,
      balance: 0,
      balanceString: '',
      coinSpecific: {} as WalletCoinSpecific,
      confirmedBalance: 0,
      confirmedBalanceString: '',
      keys: [],
      label: '',
      multisigType: 'onchain',
      pendingApprovals: [],
      spendableBalance: 0,
      spendableBalanceString: '',
      id: 'tavaxpStakingWalletId',
      coin: 'tavaxp',
      enterprise: enterprise.id,
    };

    const ethWallet = new Wallet(bitgo, ethBaseCoin, ethWalletData);
    const maticWallet = new Wallet(bitgo, maticBaseCoin, maticWalletData);
    const btcWallet = new Wallet(bitgo, btcBaseCoin, btcWalletData);
    topethWctStakingWallet = new Wallet(bitgo, topethWctBaseCoin, topethWctStakingWalletData).toStakingWallet();
    tavaxpStakingWallet = new Wallet(bitgo, tavaxpBaseCoin, tavaxpStakingWalletData).toStakingWallet();

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

      // skipping validation because mock data is not a valid transaction
      sinon.stub(StakingWallet.prototype, <any>'validateBuiltStakingTransaction').resolves();

      const stakingTransaction = await ethStakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction
      );

      stakingTransaction.should.deepEqual(transaction);
      sinon.restore();
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

      // skipping validation because mock data is not a valid transaction
      sinon.stub(StakingWallet.prototype, <any>'validateBuiltStakingTransaction').resolves();
      const stakingTransaction = await maticStakingWallet.buildSignAndSend(
        { walletPassphrase: walletPassphrase },
        transaction
      );

      stakingTransaction.should.deepEqual(transaction);
      sinon.restore();
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
      const descriptor = sandbox.stub(StakingWallet.prototype, 'getDescriptorWallet' as any);
      await btcStakingWallet.build(transaction);
      prebuildTransaction.calledOnceWithExactly(transaction.buildParams).should.be.true;
      descriptor.notCalled.should.be.true;
    });

    it('btc undelegation transaction', async function () {
      const transaction = fixtures.transaction('READY', fixtures.btcUnstakingBuildParams, false, 'undelegate_withdraw');

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

  describe('Opeth:WCT Staking', function () {
    it('should skip transaction validation when skipTransactionVerification is true', async function () {
      const unsignedTransaction: PrebuildTransactionResult = {
        walletId: topethWctStakingWallet.walletId,
        ...opethFixtures.unsignedStakingTransaction,
        // Using a modified txHex that would normally cause validation to fail
        txHex:
          '0x02f9019083aa37dc718206a882089e83030d40941d1a245741bd7d603747a23d30f4c91682a2992680b901643912521500000000000000000000000086bb6dca2cd6f9a0189c478bbb8f7ee2fef07c89000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000067ebedc3000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000140d63efb5b24314f6f62dbadb383dba2e49d7ee0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0808080',
      } as PrebuildTransactionResult;
      const stakingTransaction: StakingTransaction = opethFixtures.updatedStakingRequest;

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${topethWctStakingWallet.coin}/wallets/${topethWctStakingWallet.walletId}/requests/${stakingTransaction.stakingRequestId}/transactions/${stakingTransaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, stakingTransaction);

      nock(microservicesUri)
        .get(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}`)
        .reply(200, topethWctStakingWalletData);

      nock(microservicesUri)
        .post(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}/tx/build`)
        .reply(200, unsignedTransaction);

      // Mock the sign method to verify we reach it without validation error
      const signStub = sinon.stub(topethWctStakingWallet, 'sign').resolves({
        transaction: stakingTransaction,
        signed: { halfSigned: { txHex: 'signed-hex' } },
      });

      // Mock validateBuiltStakingTransaction to verify it's not called
      const validateStub = sinon.stub(StakingWallet.prototype, <any>'validateBuiltStakingTransaction');

      // Call buildAndSign with skipTransactionVerification=true
      await topethWctStakingWallet.buildAndSign(
        {
          walletPassphrase: 'passphrase',
          transactionVerificationOptions: { skipTransactionVerification: true },
        },
        stakingTransaction
      );

      // Verify that validation was skipped
      validateStub.called.should.be.false;
      signStub.calledOnce.should.be.true;

      // Restore stubs
      validateStub.restore();
      signStub.restore();
    });

    it('should return true for isSendCallRequired for topethWctStakingWallet', function () {
      // Access the private method using type assertion
      const isSendCallRequired = (topethWctStakingWallet as any).isSendCallRequired();

      // Check that isSendCallRequired returns true because this is not ETH TSS
      isSendCallRequired.should.equal(true);
    });

    it('should build and validate transaction', async function () {
      const unsignedTransaction: PrebuildTransactionResult = {
        walletId: topethWctStakingWallet.walletId,
        ...opethFixtures.unsignedStakingTransaction,
      } as PrebuildTransactionResult;
      const stakingTransaction: StakingTransaction = opethFixtures.updatedStakingRequest;

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${topethWctStakingWallet.coin}/wallets/${topethWctStakingWallet.walletId}/requests/${stakingTransaction.stakingRequestId}/transactions/${stakingTransaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, stakingTransaction);

      nock(microservicesUri)
        .get(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}`)
        .reply(200, topethWctStakingWalletData);

      nock(microservicesUri)
        .post(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}/tx/build`)
        .reply(200, unsignedTransaction);

      // tx validation happens before signing, so we can skip it
      sinon.stub(topethWctStakingWallet, 'sign').resolves();

      await topethWctStakingWallet.buildAndSign({ walletPassphrase: 'passphrase' }, stakingTransaction);
    });

    it('should throw an error if unsigned transaction does not match the staking transaction', async function () {
      const unsignedTransaction: PrebuildTransactionResult = {
        walletId: topethWctStakingWallet.walletId,
        ...opethFixtures.unsignedStakingTransaction,
        txHex:
          '0x02f9019083aa37dc718206a882089e83030d40941d1a245741bd7d603747a23d30f4c91682a2992680b901643912521500000000000000000000000086bb6dca2cd6f9a0189c478bbb8f7ee2fef07c89000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000067ebedc3000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000140d63efb5b24314f6f62dbadb383dba2e49d7ee0000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0808080',
      } as PrebuildTransactionResult;
      const stakingTransaction: StakingTransaction = opethFixtures.updatedStakingRequest;

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${topethWctStakingWallet.coin}/wallets/${topethWctStakingWallet.walletId}/requests/${stakingTransaction.stakingRequestId}/transactions/${stakingTransaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, stakingTransaction);

      nock(microservicesUri)
        .get(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}`)
        .reply(200, topethWctStakingWalletData);

      nock(microservicesUri)
        .post(`/api/v2/topeth/wallet/${topethWctStakingWallet.walletId}/tx/build`)
        .reply(200, unsignedTransaction);

      const expectedErrorMessage =
        'Staking transaction validation failed before signing: ' +
        'Unexpected recipient address found in built transaction: 0x86bb6dca2cd6f9a0189c478bbb8f7ee2fef07c89; ' +
        'Expected recipient address not found in built transaction: 0x75bb6dca2cd6f9a0189c478bbb8f7ee2fef07c78';

      await topethWctStakingWallet
        .buildAndSign({ walletPassphrase: 'passphrase' }, stakingTransaction)
        .should.be.rejectedWith(expectedErrorMessage);
    });
  });

  describe('TAVAXP Staking', function () {
    it('should build and validate transaction', async function () {
      const unsignedTransaction: PrebuildTransactionResult = {
        walletId: tavaxpStakingWallet.walletId,
        ...avaxpStakingFixtures.unsignedStakingTransaction,
      } as PrebuildTransactionResult;
      const stakingTransaction: StakingTransaction = avaxpStakingFixtures.updatedStakingRequest;

      nock(microservicesUri)
        .get(
          `/api/staking/v1/${tavaxpStakingWallet.coin}/wallets/${tavaxpStakingWallet.walletId}/requests/${stakingTransaction.stakingRequestId}/transactions/${stakingTransaction.id}`
        )
        .query({ expandBuildParams: true })
        .reply(200, stakingTransaction);

      nock(microservicesUri)
        .get(`/api/v2/tavaxp/wallet/${tavaxpStakingWallet.walletId}`)
        .reply(200, tavaxpStakingWalletData);

      nock(microservicesUri)
        .post(`/api/v2/tavaxp/wallet/${tavaxpStakingWallet.walletId}/tx/build`)
        .reply(200, unsignedTransaction);

      // tx validation happens before signing, so we can skip it
      sinon.stub(tavaxpStakingWallet, 'sign').resolves();

      await tavaxpStakingWallet.buildAndSign({ walletPassphrase: 'passphrase' }, stakingTransaction);
    });
  });
});
