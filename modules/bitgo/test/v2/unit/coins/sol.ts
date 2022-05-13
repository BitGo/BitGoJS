import * as sinon from 'sinon';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as testData from '../../fixtures/coins/sol';
import * as should from 'should';
import * as resources from '@bitgo/account-lib/test/resources/sol/sol';
import * as _ from 'lodash';
import * as accountLib from '@bitgo/account-lib';
import { Sol, Tsol } from '../../../../src/v2/coins/';
import { Wallet } from '../../../../src';
import { TssUtils } from '../../../../src/v2/internal/tssUtils';

describe('SOL:', function () {
  let bitgo;
  let basecoin;
  let keyPair;
  let newTxPrebuild;
  let newTxParams;
  let newTxParamsWithError;
  let newTxParamsWithExtraData;
  const badAddresses = resources.addresses.invalidAddresses;
  const goodAddresses = resources.addresses.validAddresses;

  const keypair = {
    pub: resources.accountWithSeed.publicKey,
    prv: resources.accountWithSeed.privateKey.base58,
  };
  const txPrebuild = {
    recipients: [
      {
        address: 'lionteste212',
        amount: '1000',
      },
    ],
    txBase64: resources.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
    txInfo: {
      feePayer: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      nonce: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
    },
    txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
    isVotingTransaction: false,
    coin: 'tsol',
  };
  const txParams = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const memo = { value: 'test memo' };
  const durableNonce = {
    walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
  };
  const errorDurableNonce = {
    walletNonceAddress: '8YM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
  };
  const txParamsWithError = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42mMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const txParamsWithExtraData = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
        data: undefined,
      },
    ],
  };
  const errorMemo = { value: 'different memo' };
  const errorFeePayer = '5hr5fisPi6DXCuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe';
  const factory = accountLib.register('tsol', accountLib.Sol.TransactionBuilderFactory);
  const wallet = new accountLib.Sol.KeyPair(resources.authAccount).getKeys();
  const stakeAccount = new accountLib.Sol.KeyPair(resources.stakeAccount).getKeys();
  const blockHash = resources.blockHashes.validBlockHashes[0];
  const amount = '10000';
  const validator = resources.validator;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol');
    keyPair = basecoin.generateKeyPair(resources.accountWithSeed.seed);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
    newTxParamsWithError = () => {
      return _.cloneDeep(txParamsWithError);
    };
    newTxParamsWithExtraData = () => {
      return _.cloneDeep(txParamsWithExtraData);
    };
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);
  });

  it('should retun the right info', function() {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Sol');
    basecoin.getBaseFactor().should.equal(1000000000);
  });
  describe('verify transactions', () => {
    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: {
        rootAddress: wallet.pub,
      },
      multisigType: 'tss',
    };
    const walletObj = new Wallet(bitgo, basecoin, walletData);

    it('should verify transactions', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify consolidate transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.consolidateId = 'consolidateId';

      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: stakeAccount.pub,
        },
        multisigType: 'tss',
      };
      const walletWithDifferentAddress = new Wallet(bitgo, basecoin, walletData);

      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletWithDifferentAddress });
      validTransaction.should.be.true();
    });

    it('should handle txBase64 and txHex interchangeably', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = txPrebuild.txBase64;
      txPrebuild.txBase64 = undefined;
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should convert serialized hex string to base64', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = Buffer.from(txPrebuild.txBase64, 'base64').toString('hex');
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should fail verify transactions when have different memo', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo: errorMemo, errorFeePayer, wallet: walletObj }).should.be.rejectedWith('Tx memo does not match with expected txParams recipient memo');
    });

    it('should fail verify transactions when have different durableNonce', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, errorDurableNonce, wallet: walletObj }).should.be.rejectedWith('Tx durableNonce does not match with param durableNonce');
    });

    it('should fail verify transactions when have different feePayer', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: stakeAccount.pub,
        },
        multisigType: 'tss',
      };
      const walletWithDifferentAddress = new Wallet(bitgo, basecoin, walletData);

      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletWithDifferentAddress }).should.be.rejectedWith('Tx fee payer is not the wallet root address');
    });

    it('should fail verify transactions when have different recipients', async function () {
      const txParams = newTxParamsWithError();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, errorFeePayer, wallet: walletObj }).should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txParams = newTxParamsWithExtraData();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, durableNonce, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify activate staking transaction', async function () {
      const tx = await factory
        .getStakingActivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .validator(validator.pub)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [
        {
          address: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
          amount: amount,
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify withdraw staking transaction', async function () {
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [
        {
          address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          amount: amount,
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify deactivate staking transaction', async function () {
      const tx = await factory
        .getStakingDeactivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [];
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj });
      validTransaction.should.equal(true);
    });

    it('should verify create associated token account transaction', async function () {
      const tx = await factory
        .getAtaInitializationBuilder()
        .mint('tsol:orca')
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = blockHash;
      txParams.recipients = [];
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, wallet: walletObj });
      validTransaction.should.equal(true);
    });
  });


  it('should accept valid address', (function () {
    goodAddresses.forEach(addr => {
      basecoin.isValidAddress(addr).should.equal(true);
    });
  }));

  it('should reject invalid address', (function () {
    badAddresses.forEach(addr => {
      basecoin.isValidAddress(addr).should.equal(false);
    });
  }));

  it('should check valid pub keys', (function () {
    keyPair.should.have.property('pub');
    basecoin.isValidPub(keyPair.pub).should.equal(true);
  }));

  it('should check an invalid pub keys', (function () {
    const badPubKey = keyPair.pub.slice(0, keyPair.pub.length - 1) + '-';
    basecoin.isValidPub(badPubKey).should.equal(false);
  }));

  it('should check valid prv keys', (function () {
    keyPair.should.have.property('prv');
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  }));

  it('should check an invalid prv keys', (function () {
    const badPrvKey = keyPair.prv ? keyPair.prv.slice(0, keyPair.prv.length - 1) + '-' : undefined;
    basecoin.isValidPrv(badPrvKey).should.equal(false);
  }));

  describe('Parse Transactions:', () => {
    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: 305000,
        }],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: 305000,
        }],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
          amount: 310000,
        }],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
          amount: 310000,
        }],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain a signed transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain an unsigned wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });

    it('should explain a signed wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });

    it('should explain activate staking transaction', async function () {
      const tx = await factory
        .getStakingActivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .validator(validator.pub)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingActivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
            amount: '10000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain deactivate staking transaction', async function () {
      const tx = await factory
        .getStakingDeactivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingDeactivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain withdraw staking transaction', async function () {
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingWithdraw',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain create ATA transaction', async function () {
      const tokenName = 'tsol:orca';
      const rentExemptAmount = '3000000';
      const tx = await factory
        .getAtaInitializationBuilder()
        .sender(wallet.pub)
        .nonce(blockHash)
        .mint(tokenName)
        .rentExemptAmount(rentExemptAmount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
        tokenAccountRentExemptAmount: rentExemptAmount,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'AssociatedTokenAccountInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: rentExemptAmount,
        outputs: [
          {
            address: '9nEfQqahxpyYP5RPExt9TGssPmV5MxjEw9YjGWmepMAt',
            amount: rentExemptAmount,
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      });
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should handle txHex and txBase64 interchangeably', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      });
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should throw invalid transaction when sign with public key', async function () {
      await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.publicKey,
      }).should.be.rejectedWith('Invalid key');
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(
        keypair,
        'signed message',
      );
      signed.toString('base64').should.equal('s+7d/8aW/twfM/0wLSKOGxd9+LhDIiz/g0FfJ39ylJhQIkjK0RYPm/Y+gdeJ5DIy6K6h6gCXXESDomlv12DBBQ==');
    });
    it('shouldnt sign message when message is undefined', async function () {
      await basecoin.signMessage(
        keypair,
      ).should.be.rejectedWith('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined');
    });
  });

  describe('Get Signing Payload', () => {

    it('should return a valid signing payload', async function () {
      const factory = accountLib.register(basecoin.getChain(), accountLib.Sol.TransactionBuilderFactory);
      const rebuiltSignablePayload = (await factory.from(resources.TRANSFER_UNSIGNED_TX_WITH_MEMO).build()).signablePayload;
      const signingPayload = await basecoin.getSignablePayload(resources.TRANSFER_UNSIGNED_TX_WITH_MEMO);
      signingPayload.should.be.deepEqual(rebuiltSignablePayload);
    });
  });

  describe('Presign transaction', () => {
    const txRequestId = 'txRequestId';
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.verifyAndRestore();
    });

    it('should rebuild tx request for hot wallets', async () => {
      const rebuiltTx = {
        txRequestId,
        unsignedTxs: [{
          serializedTxHex: 'deadbeef',
          signableHex: 'serializedTxHex',
          derivationPath: 'm/0',
        }],
      };

      const stubTssUtils = sandbox.createStubInstance(TssUtils);
      stubTssUtils.deleteSignatureShares.resolves([]);
      stubTssUtils.getTxRequest.resolves(rebuiltTx);

      const hotWallet = {
        type: 'hot',
      };
      const presignedTransaction = await basecoin.presignTransaction({
        walletData: hotWallet,
        tssUtils: stubTssUtils,
        txPrebuild: {
          txRequestId,
        },
      });

      presignedTransaction.walletData.should.deepEqual(hotWallet);
      presignedTransaction.txPrebuild.should.deepEqual(rebuiltTx);
      presignedTransaction.txHex.should.equal(rebuiltTx.unsignedTxs[0].serializedTxHex);
    });

    it('should do nothing for non-hot wallets', async () => {
      const coldWallet = {
        type: 'cold',
      };

      const presignedTransaction = await basecoin.presignTransaction({
        walletData: coldWallet,
      });
      presignedTransaction.should.deepEqual({
        walletData: coldWallet,
      });
    });

    it('should error if txRequestId is missing', async () => {
      const hotWallet = {
        type: 'hot',
      };
      await basecoin.presignTransaction({
        walletData: hotWallet,
        txPrebuild: {},
      }).should.rejectedWith('Missing txRequestId');
    });
  });
});
