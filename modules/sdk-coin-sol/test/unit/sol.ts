import { BitGoAPI } from '@bitgo/sdk-api';
import { MPCSweepTxs, MPCTx, MPCTxs, TssUtils, TxRequest, Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import assert from 'assert';
import * as _ from 'lodash';
import * as should from 'should';
import * as sinon from 'sinon';
import { KeyPair, Sol, Tsol } from '../../src';
import { Transaction } from '../../src/lib';
import { AtaInit, InstructionParams, TokenTransfer } from '../../src/lib/iface';
import { getAssociatedTokenAccountAddress } from '../../src/lib/utils';
import * as testData from '../fixtures/sol';
import * as resources from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';

describe('SOL:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Sol;
  let keyPair;
  let newTxPrebuild;
  let newTxPrebuildTokenTransfer;
  let newTxParams;
  let newTxParamsWithError;
  let newTxParamsWithExtraData;
  let newTxParamsTokenTransfer;
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
  const txPrebuildTokenTransfer = {
    recipients: [
      {
        address: 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg',
        amount: '1',
      },
    ],
    txHex: resources.TOKEN_TRANSFER_TO_NATIVE_UNSIGNED_TX_HEX,
    txInfo: {
      feePayer: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
      nonce: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
    },
    txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
    isVotingTransaction: false,
    coin: 'tsol',
  };
  const txParamsTokenTransfer = {
    txPrebuild,
    recipients: [
      {
        address: 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg',
        amount: '1',
      },
    ],
  };
  const errorMemo = { value: 'different memo' };
  const errorFeePayer = '5hr5fisPi6DXCuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe';
  const factory = getBuilderFactory('tsol');
  const wallet = new KeyPair(resources.authAccount).getKeys();
  const stakeAccount = new KeyPair(resources.stakeAccount).getKeys();
  const blockHash = resources.blockHashes.validBlockHashes[0];
  const amount = '10000';
  const validator = resources.validator;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sol', Tsol.createInstance);
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Tsol;
    keyPair = basecoin.generateKeyPair(resources.accountWithSeed.seed);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxPrebuildTokenTransfer = () => {
      return _.cloneDeep(txPrebuildTokenTransfer);
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
    newTxParamsTokenTransfer = () => {
      return _.cloneDeep(txParamsTokenTransfer);
    };
  });

  it('should instantiate the coin', async function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);
  });

  it('should retun the right info', function () {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Solana');
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
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
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

      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletWithDifferentAddress,
      } as any);
      validTransaction.should.be.true();
    });

    it('should handle txBase64 and txHex interchangeably', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = txPrebuild.txBase64;
      txPrebuild.txBase64 = undefined;
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should convert serialized hex string to base64', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = Buffer.from(txPrebuild.txBase64, 'base64').toString('hex');
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail verify transactions when have different memo', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo: errorMemo, errorFeePayer, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx memo does not match with expected txParams recipient memo');
    });

    it('should fail verify transactions when have different durableNonce', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, durableNonce: errorDurableNonce, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx durableNonce does not match with param durableNonce');
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

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletWithDifferentAddress } as any)
        .should.be.rejectedWith('Tx fee payer is not the wallet root address');
    });

    it('should fail verify transactions when have different recipients', async function () {
      const txParams = newTxParamsWithError();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, errorFeePayer, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify token transaction with native address recipient', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      const feePayerWalletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
        },
        multisigType: 'tss',
      };
      const feePayerWallet = new Wallet(bitgo, basecoin, feePayerWalletData);
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: feePayerWallet,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should succeed to verify token transaction with leading zero recipient amount', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '0001', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      const feePayerWalletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
        },
        multisigType: 'tss',
      };
      const feePayerWallet = new Wallet(bitgo, basecoin, feePayerWalletData);
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: feePayerWallet,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail to verify token transaction with different recipient tokenName', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdt' }]; // Different tokenName, should fail to verify tx
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify token transaction with different recipient amounts', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '2', tokenName: 'tsol:usdt' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify token transaction with different native address', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvX'; // Native SOL address, different than tx recipients
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txParams = newTxParamsWithExtraData();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
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
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
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
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
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
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify create associated token account transaction', async function () {
      const tx = await factory
        .getAtaInitializationBuilder()
        .mint('tsol:usdc')
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
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });
  });

  it('should accept valid address', function () {
    goodAddresses.forEach((addr) => {
      basecoin.isValidAddress(addr).should.equal(true);
    });
  });

  it('should reject invalid address', function () {
    badAddresses.forEach((addr) => {
      basecoin.isValidAddress(addr).should.equal(false);
    });
  });

  it('should check valid pub keys', function () {
    keyPair.should.have.property('pub');
    basecoin.isValidPub(keyPair.pub).should.equal(true);
  });

  it('should check an invalid pub keys', function () {
    const badPubKey = keyPair.pub.slice(0, keyPair.pub.length - 1) + '-';
    basecoin.isValidPub(badPubKey).should.equal(false);
  });

  it('should check valid prv keys', function () {
    keyPair.should.have.property('prv');
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  });

  it('should check an invalid prv keys', function () {
    const badPrvKey = keyPair.prv ? keyPair.prv.slice(0, keyPair.prv.length - 1) + '-' : undefined;
    basecoin.isValidPrv(badPrvKey as string).should.equal(false);
  });

  describe('Parse Transactions:', () => {
    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 305000,
          },
        ],
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
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 305000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned wallet init transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: 310000,
          },
        ],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed wallet init transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: 310000,
          },
        ],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned transfer token transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transferToken.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 5000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
      });
    });

    it('should parse a signed transfer token transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transferToken.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 5000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
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
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
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
        id: '2XFxGfXddKWnqGaMAsfNL8HgXqDvjBL2Ae28KWrRvg9bQBmCrpHYVDacuZFeAUyYwjXG6ey2jTARX5VQCnj7SF4L',
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
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
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
        id: '7TkU8wLgXDeLFbVydtg6mqMsp9GatsetitSngysgjxFhofKSUcLPBoKPHciLeGEfJFMsqezpZmGRSFQTBy7ZDsg',
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

    it('should explain an unsigned token transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transferToken.unsigned,
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
        outputAmount: '0',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '12f6D3WubGVeQoH2m8kTvvcrasWdXWwtVzUCyRNDZxA2',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain a signed token transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transferToken.signed,
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
        id: '335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '12f6D3WubGVeQoH2m8kTvvcrasWdXWwtVzUCyRNDZxA2',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
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
      const tokenName = 'tsol:usdc';
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
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '3005000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain create multi ATA transaction', async function () {
      const recipients = [
        {
          ownerAddress: wallet.pub,
          tokenName: 'tsol:usdc',
        },
        {
          ownerAddress: durableNonce.walletNonceAddress,
          tokenName: 'tsol:ray',
        },
      ];
      const rentExemptAmount = '3000000';
      const tx = await factory
        .getAtaInitializationBuilder()
        .sender(wallet.pub)
        .nonce(blockHash)
        .enableToken(recipients[0])
        .enableToken(recipients[1])
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
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '6005000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain an unsigned token transfer with ATA creation transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.tokenTransferWithAtaCreation.unsigned,
        feeInfo: {
          fee: '5000',
        },
        tokenAccountRentExemptAmount: '3000000',
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
        outputAmount: '0',
        outputs: [
          {
            address: '2eKjVtzV3oPTXFdtRSDj3Em9k1MV7k8WjKkBszQUwizS',
            amount: '10000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: { fee: '3005000', feeRate: 5000 },
        memo: undefined,
        blockhash: '27E3MXFvXMUNYeMJeX1pAbERGsJfUbkaZTfgMgpmNN5g',
        durableNonce: undefined,
      });
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder' as any), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder' as any), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      const signed: any = await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      } as any);
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should handle txHex and txBase64 interchangeably', async function () {
      const signed: any = await basecoin.signTransaction({
        txPrebuild: {
          txHex: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      } as any);
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should throw invalid transaction when sign with public key', async function () {
      await basecoin
        .signTransaction({
          txPrebuild: {
            txBase64: resources.RAW_TX_UNSIGNED,
            keys: [resources.accountWithSeed.publicKey.toString()],
          },
          prv: resources.accountWithSeed.publicKey,
        } as any)
        .should.be.rejectedWith('Invalid key');
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(keypair, 'signed message');
      signed
        .toString('base64')
        .should.equal('s+7d/8aW/twfM/0wLSKOGxd9+LhDIiz/g0FfJ39ylJhQIkjK0RYPm/Y+gdeJ5DIy6K6h6gCXXESDomlv12DBBQ==');
    });
    it('shouldnt sign message when message is undefined', async function () {
      await basecoin
        .signMessage(keypair, undefined as any)
        .should.be.rejectedWith(
          'The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined'
        );
    });
  });

  describe('Get Signing Payload', () => {
    it('should return a valid signing payload', async function () {
      const factory = getBuilderFactory(basecoin.getChain());
      const rebuiltSignablePayload = (await factory.from(resources.TRANSFER_UNSIGNED_TX_WITH_MEMO).build())
        .signablePayload;
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
      const rebuiltTx: TxRequest = {
        txRequestId,
        unsignedTxs: [
          {
            serializedTxHex: 'deadbeef',
            signableHex: 'serializedTxHex',
            derivationPath: 'm/0',
          },
        ],
        transactions: [],
        date: new Date().toISOString(),
        intent: {
          intentType: 'payment',
        },
        latest: true,
        state: 'pendingUserSignature',
        walletType: 'hot',
        walletId: 'walletId',
        policiesChecked: true,
        version: 1,
        userId: 'userId',
      };

      const stubTssUtils = sandbox.createStubInstance(TssUtils);
      stubTssUtils.deleteSignatureShares.resolves([]);
      stubTssUtils.getTxRequest.resolves(rebuiltTx);

      const hotWallet = {
        type: 'hot',
      };
      const presignedTransaction: any = await basecoin.presignTransaction({
        walletData: hotWallet,
        tssUtils: stubTssUtils,
        txPrebuild: {
          txRequestId,
        },
      } as any);

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
      } as any);
      presignedTransaction.should.deepEqual({
        walletData: coldWallet,
      });
    });

    it('should error if txRequestId is missing', async () => {
      const hotWallet = {
        type: 'hot',
      };
      await basecoin
        .presignTransaction({
          walletData: hotWallet,
          txPrebuild: {},
        } as any)
        .should.rejectedWith('Missing txRequestId');
    });
  });

  describe('Recover Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tsol');
    const usdtMintAddress = '9cgpBeNZ2HnLda7NWaaU1i3NyTstk2c4zCMUcoAGsi9C';

    beforeEach(() => {
      const callBack = sandBox.stub(Sol.prototype, 'getDataFromNode' as keyof Sol);

      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getLatestBlockhash',
            params: [
              {
                commitment: 'finalized',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getBlockhashResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getFees',
          },
        })
        .resolves(testData.SolResponses.getFeesResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getMinimumBalanceForRentExemption',
            params: [165],
          },
        })
        .resolves(testData.SolResponses.getMinimumBalanceForRentExemptionResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKey],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKeyNoFunds],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseNoFunds);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKeyM1Derivation],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseM1Derivation);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKeyM2Derivation],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseM2Derivation);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKeyWithManyTokens],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseM2Derivation);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.closeATAkeys.closeAtaAddress],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseM2Derivation);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.closeATAkeys.bs58EncodedPublicKey],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseM2Derivation);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getAccountInfo',
            params: [
              testData.keys.durableNoncePubKey,
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getAccountInfoResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.keys.destinationPubKey,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponseNoAccounts);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.accountInfo.bs58EncodedPublicKey,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponseNoAccounts);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.keys.destinationPubKey2,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress0,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponse2);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress4,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponse3);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.wrwUser.walletAddress0],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should take OVC output and generate a signed sweep transaction', async function () {
      const params = testData.ovcResponse;
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        'AvR+L909kzRq6NuaUe9F6Jt97MOiFs7jpW8MuOrwz4EbKF40d31dci/bgLTq4gpk/Hh3s5cA8FtbLkDQr15PqAE7yd8LOXvsLtO2REqMM/OCZ8wItfsqfTfia2xIfibRW3wHgw63jiaojbXeSqaYajJ/Ca7YwBUz5blydI3fYLgPAgECBsLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHxPX1mHv+JqpmAT79ltNjYPK0M2yR+ZMln7VgUTBWFNQvLqE/j/nXlY2/JpxuNr/fXLXEPeS04dPvt9qz1dAoYEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAADpiH20cxLj7KnOaoI5ANNoPxYjs472FdjDeMPft3kXdAgQDAgUBBAQAAAAEAgADDAIAAADwopo7AAAAAA=='
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(0);
      recoveryTxn.lastScanIndex.should.equal(0);
    });

    it('should take consolidation OVC output and generate multiple signed sweep transactions', async function () {
      const params = testData.ovcResponse2;
      const recoveryTxn = await basecoin.createBroadcastableSweepTransaction(params);
      recoveryTxn.transactions[0].serializedTx.should.equal(
        'AtQPLzOmLuKwHY6N5XoJIZK/T7W10uYWm/MRte3GFUdl+w3gHLjSa9H66WSfFNubQxIPckxJDyltkP7ksLDf9QgBNJM2UWbBUH5wT0JJHILlhCs33HX8DeE/8Tdsw6tGfZoMhCnSKv6TPWtBxy7Sb6sW8ksCUPnAWuHGGKmgjEMBAgECBmLrqxJrY2kbN/tcrQw3P8P15OljFGabFJAKBrUO1grNBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHxPX1mHv+JqpmAT79ltNjYPK0M2yR+ZMln7VgUTBWFNQsLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAIZQniiS73D6mwfpnfhVMC4lyYJtRSrmoZpF7yIlUdIDAgQDAgUBBAQAAAAEAgADDAIAAADwPc0dAAAAAA=='
      );
      recoveryTxn.transactions[0].scanIndex.should.equal(1);
      recoveryTxn.transactions[1].serializedTx.should.equal(
        'AuLhOA5zmOBZR85lo+nKdTopVwJAMrMp6NW+8UnGNsSBSpBkqfWZQqSg9s+7aTlXezm5vxol+Pl6t7PpVNTOHwLcp9xJp3TFHdivEbhwJKldR4Ny+pasoFx+Bgk8q6g1iNiq7XSi1Ov3bs7euMkTj7nDRFqP8lv7xLTcvrBm9OQJAgECBp14ImBCdmVROlw0UveYS1MvG/ljCRI3MJTFmsxuXEoWBRo0vIrNQ4djl2+Wh2EVBQ9zgoVTVm0RHXrIv/6/WHw0hyxvpVwtIx9/zeX2O16eTrY+aKIh1mdKg4MMg0eyxMLVtfT7mpvNii8wPk0G942N7TAHE/RW2iq/8LPqAYWqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGp9UXGSxWjuCKhF9z0peIzwNcMUWyGrNE2AYuqUAAAC7ws1XFslinwgtpISUViVWIVTHyD2Q0qj24YjKmrAmXAgQDAgUBBAQAAAAEAgADDAIAAADwPc0dAAAAAA=='
      );
      recoveryTxn.transactions[1].scanIndex.should.equal(2);
      recoveryTxn.lastScanIndex.should.equal(20);
    });

    it('should recover a txn for non-bitgo recoveries (latest blockhash)', async function () {
      // Latest Blockhash Recovery (BitGo-less)
      const latestBlockHashTxn = await basecoin.recover({
        userKey: testData.keys.userKey,
        backupKey: testData.keys.backupKey,
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        walletPassphrase: testData.keys.walletPassword,
      });
      latestBlockHashTxn.should.not.be.empty();
      latestBlockHashTxn.should.hasOwnProperty('serializedTx');
      latestBlockHashTxn.should.hasOwnProperty('scanIndex');
      should.equal((latestBlockHashTxn as MPCTx).scanIndex, 0);

      const latestBlockhashTxnDeserialize = new Transaction(coin);
      latestBlockhashTxnDeserialize.fromRawTransaction((latestBlockHashTxn as MPCTx).serializedTx);
      const latestBlockhashTxnJson = latestBlockhashTxnDeserialize.toJson();

      should.equal(latestBlockhashTxnJson.nonce, testData.SolInputData.blockhash);
      should.equal(latestBlockhashTxnJson.feePayer, testData.accountInfo.bs58EncodedPublicKey);
      should.equal(latestBlockhashTxnJson.numSignatures, testData.SolInputData.latestBlockhashSignatures);
      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 3);
    });

    it('should recover a txn for non-bitgo recoveries (durable nonce)', async function () {
      // Durable Nonce Recovery (BitGo-less)
      const durableNonceTxn = await basecoin.recover({
        userKey: testData.keys.userKey,
        backupKey: testData.keys.backupKey,
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        walletPassphrase: testData.keys.walletPassword,
        durableNonce: {
          publicKey: testData.keys.durableNoncePubKey,
          secretKey: testData.keys.durableNoncePrivKey,
        },
      });

      durableNonceTxn.should.not.be.empty();
      durableNonceTxn.should.hasOwnProperty('serializedTx');
      durableNonceTxn.should.hasOwnProperty('scanIndex');
      should.equal((durableNonceTxn as MPCTx).scanIndex, 0);

      const durableNonceTxnDeserialize = new Transaction(coin);
      durableNonceTxnDeserialize.fromRawTransaction((durableNonceTxn as MPCTx).serializedTx);
      const durableNonceTxnJson = durableNonceTxnDeserialize.toJson();

      should.equal(durableNonceTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(durableNonceTxnJson.feePayer, testData.accountInfo.bs58EncodedPublicKey);
      should.equal(durableNonceTxnJson.numSignatures, testData.SolInputData.durableNonceSignatures);
      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 4);
    });

    it('should recover a txn for unsigned sweep recoveries', async function () {
      // Unsigned Sweep Recovery
      const unsignedSweepTxn = (await basecoin.recover({
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        durableNonce: {
          publicKey: testData.keys.durableNoncePubKey,
          secretKey: testData.keys.durableNoncePrivKey,
        },
      })) as MPCSweepTxs;

      unsignedSweepTxn.should.not.be.empty();
      unsignedSweepTxn.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('serializedTx');
      unsignedSweepTxn.txRequests[0].transactions[0].unsignedTx.should.hasOwnProperty('scanIndex');
      should.equal(unsignedSweepTxn.txRequests[0].transactions[0].unsignedTx.scanIndex, 0);

      const unsignedSweepTxnDeserialize = new Transaction(coin);
      unsignedSweepTxnDeserialize.fromRawTransaction(
        unsignedSweepTxn.txRequests[0].transactions[0].unsignedTx.serializedTx
      );
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();

      should.equal(unsignedSweepTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(unsignedSweepTxnJson.feePayer, testData.accountInfo.bs58EncodedPublicKey);
      should.equal(unsignedSweepTxnJson.numSignatures, testData.SolInputData.unsignedSweepSignatures);
      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 4);
    });

    it('should handle error in recover function if a required field is missing/incorrect', async function () {
      // missing userkey
      await basecoin
        .recover({
          backupKey: testData.keys.backupKey,
          bitgoKey: testData.keys.bitgoKey,
          recoveryDestination: testData.keys.destinationPubKey,
          walletPassphrase: testData.keys.walletPassword,
        })
        .should.rejectedWith('missing userKey');

      // missing backupkey
      await basecoin
        .recover({
          userKey: testData.keys.userKey,
          bitgoKey: testData.keys.bitgoKey,
          recoveryDestination: testData.keys.destinationPubKey,
          walletPassphrase: testData.keys.walletPassword,
        })
        .should.rejectedWith('missing backupKey');

      // missing wallet passphrase
      await basecoin
        .recover({
          userKey: testData.keys.userKey,
          backupKey: testData.keys.backupKey,
          bitgoKey: testData.keys.bitgoKey,
          recoveryDestination: testData.keys.destinationPubKey,
        })
        .should.rejectedWith('missing wallet passphrase');

      // incorrect wallet passphrase, user key, backup key combination
      await basecoin
        .recover({
          userKey: testData.keys.userKey,
          backupKey: testData.keys.backupKey,
          bitgoKey: testData.keys.bitgoKey,
          recoveryDestination: testData.keys.destinationPubKey,
          walletPassphrase: testData.keys.walletPassword + 'incorrect',
        })
        .should.rejectedWith("Error decrypting user keychain: password error - ccm: tag doesn't match");

      // no wallet with sufficient funds
      await basecoin
        .recover({
          userKey: testData.keys.userKey,
          backupKey: testData.keys.backupKey,
          bitgoKey: testData.keys.bitgoKeyNoFunds,
          recoveryDestination: testData.keys.destinationPubKey,
          walletPassphrase: testData.keys.walletPassword,
        })
        .should.rejectedWith('Did not find address with funds to recover');
    });

    it('should recover sol tokens to recovery destination with no existing token accounts', async function () {
      const tokenTxn = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        tokenContractAddress: usdtMintAddress,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        durableNonce: {
          publicKey: testData.keys.durableNoncePubKey,
          secretKey: testData.keys.durableNoncePrivKey,
        },
      });

      tokenTxn.should.not.be.empty();
      tokenTxn.should.hasOwnProperty('serializedTx');
      tokenTxn.should.hasOwnProperty('scanIndex');
      should.equal((tokenTxn as MPCTx).scanIndex, 0);

      const tokenTxnDeserialize = new Transaction(coin);
      tokenTxnDeserialize.fromRawTransaction((tokenTxn as MPCTx).serializedTx);
      const tokenTxnJson = tokenTxnDeserialize.toJson();

      should.equal(tokenTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(tokenTxnJson.feePayer, testData.wrwUser.walletAddress0);
      should.equal(tokenTxnJson.numSignatures, testData.SolInputData.durableNonceSignatures);

      const instructionsData = tokenTxnJson.instructionsData as InstructionParams[];
      should.equal(instructionsData.length, 3);
      should.equal(instructionsData[0].type, 'NonceAdvance');

      const destinationUSDTTokenAccount = await getAssociatedTokenAccountAddress(
        usdtMintAddress,
        testData.keys.destinationPubKey
      );
      should.equal(instructionsData[1].type, 'CreateAssociatedTokenAccount');
      should.equal((instructionsData[1] as AtaInit).params.mintAddress, usdtMintAddress);
      should.equal((instructionsData[1] as AtaInit).params.ataAddress, destinationUSDTTokenAccount);
      should.equal((instructionsData[1] as AtaInit).params.ownerAddress, testData.keys.destinationPubKey);
      should.equal((instructionsData[1] as AtaInit).params.tokenName, 'tsol:usdt');
      should.equal((instructionsData[1] as AtaInit).params.payerAddress, testData.wrwUser.walletAddress0);

      const sourceUSDTTokenAccount = await getAssociatedTokenAccountAddress(
        usdtMintAddress,
        testData.wrwUser.walletAddress0
      );
      should.equal(instructionsData[2].type, 'TokenTransfer');
      should.equal((instructionsData[2] as TokenTransfer).params.fromAddress, testData.wrwUser.walletAddress0);
      should.equal((instructionsData[2] as TokenTransfer).params.toAddress, destinationUSDTTokenAccount);
      should.equal((instructionsData[2] as TokenTransfer).params.amount, '2000000000');
      should.equal((instructionsData[2] as TokenTransfer).params.tokenName, 'tsol:usdt');
      should.equal((instructionsData[2] as TokenTransfer).params.sourceAddress, sourceUSDTTokenAccount);

      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 7);
    });

    it('should recover sol tokens to recovery destination with existing token accounts', async function () {
      const tokenTxn = await basecoin.recover({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey2,
        tokenContractAddress: usdtMintAddress,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        durableNonce: {
          publicKey: testData.keys.durableNoncePubKey,
          secretKey: testData.keys.durableNoncePrivKey,
        },
      });

      tokenTxn.should.not.be.empty();
      tokenTxn.should.hasOwnProperty('serializedTx');
      tokenTxn.should.hasOwnProperty('scanIndex');
      should.equal((tokenTxn as MPCTx).scanIndex, 0);

      const tokenTxnDeserialize = new Transaction(coin);
      tokenTxnDeserialize.fromRawTransaction((tokenTxn as MPCTx).serializedTx);
      const tokenTxnJson = tokenTxnDeserialize.toJson();

      should.equal(tokenTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(tokenTxnJson.feePayer, testData.wrwUser.walletAddress0);
      should.equal(tokenTxnJson.numSignatures, testData.SolInputData.durableNonceSignatures);

      const instructionsData = tokenTxnJson.instructionsData as TokenTransfer[];
      should.equal(instructionsData.length, 2);
      should.equal(instructionsData[0].type, 'NonceAdvance');

      const sourceUSDTTokenAccount = await getAssociatedTokenAccountAddress(
        usdtMintAddress,
        testData.wrwUser.walletAddress0
      );
      const destinationUSDTTokenAccount = await getAssociatedTokenAccountAddress(
        usdtMintAddress,
        testData.keys.destinationPubKey2
      );
      should.equal(instructionsData[1].type, 'TokenTransfer');
      should.equal(instructionsData[1].params.fromAddress, testData.wrwUser.walletAddress0);
      should.equal(instructionsData[1].params.toAddress, destinationUSDTTokenAccount);
      should.equal(instructionsData[1].params.amount, '2000000000');
      should.equal(instructionsData[1].params.tokenName, 'tsol:usdt');
      should.equal(instructionsData[1].params.sourceAddress, sourceUSDTTokenAccount);

      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 7);
    });

    it('should recover sol tokens to recovery destination with existing token accounts for unsigned sweep recoveries', async function () {
      const tokenTxn = (await basecoin.recover({
        bitgoKey: testData.wrwUser.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey2,
        durableNonce: {
          publicKey: testData.keys.durableNoncePubKey,
          secretKey: testData.keys.durableNoncePrivKey,
        },
        tokenContractAddress: testData.tokenAddress.TestUSDC,
      })) as MPCSweepTxs;

      // 2 signatures and no rent exemption fee since the destination already has token accounts
      const expectedFee = 5000 + 5000;

      const { serializedTx, scanIndex, feeInfo, parsedTx } = tokenTxn.txRequests[0].transactions[0].unsignedTx;
      assert.ok(serializedTx);
      assert.strictEqual(scanIndex, 0);
      assert.ok(feeInfo);
      assert.strictEqual(feeInfo.feeString, expectedFee.toString());
      assert.strictEqual(feeInfo.fee, expectedFee);
      assert.ok(parsedTx);
      assert.ok(parsedTx.inputs instanceof Array && parsedTx.inputs.length === 1);
      assert.ok(parsedTx.outputs instanceof Array && parsedTx.outputs.length === 1);

      const tokenTxnDeserialize = new Transaction(coin);
      tokenTxnDeserialize.fromRawTransaction(tokenTxn.txRequests[0].transactions[0].unsignedTx.serializedTx);
      const tokenTxnJson = tokenTxnDeserialize.toJson();

      assert.strictEqual(tokenTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      assert.strictEqual(tokenTxnJson.feePayer, testData.wrwUser.walletAddress0);
      assert.strictEqual(tokenTxnJson.numSignatures, testData.SolInputData.unsignedSweepSignatures);
      const solCoin = basecoin as any;
      sandBox.assert.callCount(solCoin.getDataFromNode, 7);
    });

    it('should recover sol funds from ATA address for non-bitgo recoveries', async function () {
      // close ATA address instruction type txn
      const closeATATxn = await basecoin.recover({
        userKey: testData.closeATAkeys.userKey,
        backupKey: testData.closeATAkeys.backupKey,
        bitgoKey: testData.closeATAkeys.bitgoKey,
        recoveryDestination: testData.closeATAkeys.destinationPubKey,
        walletPassphrase: testData.closeATAkeys.walletPassword,
        closeAtaAddress: testData.closeATAkeys.closeAtaAddress,
      });
      closeATATxn.should.not.be.empty();
      closeATATxn.should.hasOwnProperty('serializedTx');
      closeATATxn.should.hasOwnProperty('scanIndex');
      should.equal((closeATATxn as MPCTx).scanIndex, 0);
    });
  });

  describe('Build Consolidation Recoveries:', () => {
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tsol');
    const usdtMintAddress = '9cgpBeNZ2HnLda7NWaaU1i3NyTstk2c4zCMUcoAGsi9C';
    const durableNonces = {
      publicKeys: [
        testData.keys.durableNoncePubKey,
        testData.keys.durableNoncePubKey2,
        testData.keys.durableNoncePubKey3,
      ],
      secretKey: testData.keys.durableNoncePrivKey,
    };

    beforeEach(() => {
      const callBack = sandBox.stub(Sol.prototype, 'getDataFromNode' as keyof Sol);

      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getLatestBlockhash',
            params: [
              {
                commitment: 'finalized',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getBlockhashResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getFees',
          },
        })
        .resolves(testData.SolResponses.getFeesResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.wrwUser.walletAddress1],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponseNoFunds);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.wrwUser.walletAddress2],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.wrwUser.walletAddress3],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.wrwUser.walletAddress5],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getMinimumBalanceForRentExemption',
            params: [165],
          },
        })
        .resolves(testData.SolResponses.getMinimumBalanceForRentExemptionResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getAccountInfo',
            params: [
              testData.keys.durableNoncePubKey,
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getAccountInfoResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getAccountInfo',
            params: [
              testData.keys.durableNoncePubKey2,
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getAccountInfoResponse2);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress1,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponseNoAccounts);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress2,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponseNoAccounts);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress3,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponseNoAccounts);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress5,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getTokenAccountsByOwner',
            params: [
              testData.wrwUser.walletAddress0,
              {
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getTokenAccountsByOwnerResponse);
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should build signed consolidation recoveries', async function () {
      const res = (await basecoin.recoverConsolidations({
        userKey: testData.wrwUser.userKey,
        backupKey: testData.wrwUser.backupKey,
        bitgoKey: testData.wrwUser.bitgoKey,
        walletPassphrase: testData.wrwUser.walletPassphrase,
        startingScanIndex: 1,
        endingScanIndex: 4,
        durableNonces: durableNonces,
      })) as MPCTxs;
      res.should.not.be.empty();
      res.transactions.length.should.equal(2);
      res.lastScanIndex.should.equal(3);

      const txn1 = res.transactions[0];
      const latestBlockhashTxnDeserialize1 = new Transaction(coin);
      latestBlockhashTxnDeserialize1.fromRawTransaction((txn1 as MPCTx).serializedTx);
      const latestBlockhashTxnJson1 = latestBlockhashTxnDeserialize1.toJson();

      const nonce1 = testData.SolResponses.getAccountInfoResponse.body.result.value.data.parsed.info.blockhash;
      should.equal(latestBlockhashTxnJson1.nonce, nonce1);
      should.equal(latestBlockhashTxnJson1.feePayer, testData.wrwUser.walletAddress2);
      should.equal(latestBlockhashTxnJson1.numSignatures, testData.SolInputData.durableNonceSignatures);

      const txn2 = res.transactions[1];
      const latestBlockhashTxnDeserialize2 = new Transaction(coin);
      latestBlockhashTxnDeserialize2.fromRawTransaction((txn2 as MPCTx).serializedTx);
      const latestBlockhashTxnJson2 = latestBlockhashTxnDeserialize2.toJson();

      const nonce2 = testData.SolResponses.getAccountInfoResponse2.body.result.value.data.parsed.info.blockhash;
      should.equal(latestBlockhashTxnJson2.nonce, nonce2);
      should.equal(latestBlockhashTxnJson2.feePayer, testData.wrwUser.walletAddress3);
      should.equal(latestBlockhashTxnJson2.numSignatures, testData.SolInputData.durableNonceSignatures);
    });

    it('should build unsigned consolidation recoveries', async function () {
      const res = (await basecoin.recoverConsolidations({
        bitgoKey: testData.wrwUser.bitgoKey,
        startingScanIndex: 1,
        endingScanIndex: 4,
        durableNonces: durableNonces,
      })) as MPCSweepTxs;
      res.should.not.be.empty();
      res.txRequests.length.should.equal(2);

      const txn1 = res.txRequests[0].transactions[0].unsignedTx;
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('signableHex');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(2);
      txn1.should.hasOwnProperty('coin');
      txn1.coin?.should.equal('tsol');
      txn1.should.hasOwnProperty('derivationPath');
      txn1.derivationPath?.should.equal('m/2');

      txn1.should.hasOwnProperty('coinSpecific');
      const coinSpecific1 = txn1.coinSpecific;
      coinSpecific1?.should.hasOwnProperty('commonKeychain');

      const latestBlockhashTxnDeserialize1 = new Transaction(coin);
      latestBlockhashTxnDeserialize1.fromRawTransaction((txn1 as MPCTx).serializedTx);
      const latestBlockhashTxnJson1 = latestBlockhashTxnDeserialize1.toJson();

      const nonce1 = testData.SolResponses.getAccountInfoResponse.body.result.value.data.parsed.info.blockhash;
      should.equal(latestBlockhashTxnJson1.nonce, nonce1);
      should.equal(latestBlockhashTxnJson1.feePayer, testData.wrwUser.walletAddress2);
      should.equal(latestBlockhashTxnJson1.numSignatures, testData.SolInputData.unsignedSweepSignatures);

      const txn2 = res.txRequests[1].transactions[0].unsignedTx;
      txn2.should.hasOwnProperty('serializedTx');
      txn2.should.hasOwnProperty('signableHex');
      txn2.should.hasOwnProperty('scanIndex');
      txn2.scanIndex.should.equal(3);
      txn2.should.hasOwnProperty('coin');
      txn2.coin?.should.equal('tsol');
      txn2.should.hasOwnProperty('derivationPath');
      txn2.derivationPath?.should.equal('m/3');

      txn2.should.hasOwnProperty('coinSpecific');
      const coinSpecific2 = txn2.coinSpecific;
      coinSpecific2?.should.hasOwnProperty('commonKeychain');
      coinSpecific2?.should.hasOwnProperty('lastScanIndex');
      coinSpecific2?.lastScanIndex?.should.equal(3);

      const latestBlockhashTxnDeserialize2 = new Transaction(coin);
      latestBlockhashTxnDeserialize2.fromRawTransaction((txn2 as MPCTx).serializedTx);
      const latestBlockhashTxnJson2 = latestBlockhashTxnDeserialize2.toJson();

      const nonce2 = testData.SolResponses.getAccountInfoResponse2.body.result.value.data.parsed.info.blockhash;
      should.equal(latestBlockhashTxnJson2.nonce, nonce2);
      should.equal(latestBlockhashTxnJson2.feePayer, testData.wrwUser.walletAddress3);
      should.equal(latestBlockhashTxnJson2.numSignatures, testData.SolInputData.unsignedSweepSignatures);
    });

    it('should build unsigned token consolidation recoveries', async function () {
      const res = (await basecoin.recoverConsolidations({
        bitgoKey: testData.wrwUser.bitgoKey,
        startingScanIndex: 3,
        endingScanIndex: 5,
        tokenContractAddress: usdtMintAddress,
        durableNonces: durableNonces,
      })) as MPCSweepTxs;
      res.should.not.be.empty();
      res.txRequests.length.should.equal(1);

      const txn1 = res.txRequests[0].transactions[0].unsignedTx;
      txn1.should.hasOwnProperty('serializedTx');
      txn1.should.hasOwnProperty('signableHex');
      txn1.should.hasOwnProperty('scanIndex');
      txn1.scanIndex.should.equal(4);
      txn1.should.hasOwnProperty('coin');
      txn1.coin?.should.equal('tsol');
      txn1.should.hasOwnProperty('derivationPath');
      txn1.derivationPath?.should.equal('m/4');

      txn1.should.hasOwnProperty('coinSpecific');
      const coinSpecific1 = txn1.coinSpecific;
      coinSpecific1?.should.hasOwnProperty('commonKeychain');

      const latestBlockhashTxnDeserialize1 = new Transaction(coin);
      latestBlockhashTxnDeserialize1.fromRawTransaction((txn1 as MPCTx).serializedTx);
      const latestBlockhashTxnJson1 = latestBlockhashTxnDeserialize1.toJson();

      const nonce1 = testData.SolResponses.getAccountInfoResponse.body.result.value.data.parsed.info.blockhash;
      should.equal(latestBlockhashTxnJson1.nonce, nonce1);
      should.equal(latestBlockhashTxnJson1.feePayer, testData.wrwUser.walletAddress5);
      should.equal(latestBlockhashTxnJson1.numSignatures, testData.SolInputData.unsignedSweepSignatures);
    });

    it('should skip building consolidate transaction if balance is equal to zero', async function () {
      await basecoin
        .recoverConsolidations({
          userKey: testData.wrwUser.userKey,
          backupKey: testData.wrwUser.backupKey,
          bitgoKey: testData.wrwUser.bitgoKey,
          walletPassphrase: testData.wrwUser.walletPassphrase,
          startingScanIndex: 1,
          endingScanIndex: 2,
          durableNonces: durableNonces,
        })
        .should.rejectedWith('Did not find an address with funds to recover');
    });

    it('should throw if startingScanIndex is not ge to 1', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: testData.wrwUser.userKey,
          backupKey: testData.wrwUser.backupKey,
          bitgoKey: testData.wrwUser.bitgoKey,
          startingScanIndex: -1,
          durableNonces: durableNonces,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: -1, endingScanIndex: 19.'
        );
    });

    it('should throw if scan factor is too high', async () => {
      await basecoin
        .recoverConsolidations({
          userKey: testData.wrwUser.userKey,
          backupKey: testData.wrwUser.backupKey,
          bitgoKey: testData.wrwUser.bitgoKey,
          startingScanIndex: 1,
          endingScanIndex: 300,
          durableNonces: durableNonces,
        })
        .should.be.rejectedWith(
          'Invalid starting or ending index to scan for addresses. startingScanIndex: 1, endingScanIndex: 300.'
        );
    });
  });

  describe('broadcastTransaction', function () {
    const sandBox = sinon.createSandbox();

    afterEach(() => {
      sandBox.restore();
    });

    it('should broadcast a transaction succesfully', async function () {
      const serializedSignedTransaction = testData.rawTransactions.transfer.signed;
      const broadcastStub = sandBox
        .stub(Sol.prototype, 'getDataFromNode' as keyof Sol)
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'sendTransaction',
            params: [
              serializedSignedTransaction,
              {
                encoding: 'base64',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.broadcastTransactionResponse);

      const broadcastTxn = await basecoin.broadcastTransaction({ serializedSignedTransaction });
      assert.ok(broadcastTxn);
      assert.ok(broadcastTxn.txId);
      assert.strictEqual(
        broadcastTxn.txId,
        '2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb'
      );
      assert.strictEqual(broadcastStub.callCount, 1);
    });

    it('should throw if got an error from the node', async function () {
      const serializedSignedTransaction = testData.rawTransactions.transfer.signed;
      const broadcastStub = sandBox
        .stub(Sol.prototype, 'getDataFromNode' as keyof Sol)
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'sendTransaction',
            params: [
              serializedSignedTransaction,
              {
                encoding: 'base64',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.broadcastTransactionResponseError);

      await assert.rejects(
        async () => {
          await basecoin.broadcastTransaction({ serializedSignedTransaction });
        },
        { message: 'Error broadcasting transaction: Transaction simulation failed: Blockhash not found' }
      );
      assert.strictEqual(broadcastStub.callCount, 1);
    });

    it('should throw if is not a valid transaction', async function () {
      const serializedSignedTransaction = 'randomstring';

      await assert.rejects(
        async () => {
          await basecoin.broadcastTransaction({ serializedSignedTransaction });
        },
        { message: 'Invalid raw transaction' }
      );
    });

    it('should throw if is not a signed transaction', async function () {
      const serializedSignedTransaction = testData.rawTransactions.transfer.unsigned;

      await assert.rejects(
        async () => {
          await basecoin.broadcastTransaction({ serializedSignedTransaction });
        },
        { message: 'Invalid raw transaction' }
      );
    });
  });
});
