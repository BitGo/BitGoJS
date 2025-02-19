import { CosmosTransaction, RedelegateMessage, SendMessage } from '@bitgo/abstract-cosmos';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Environments } from '@bitgo/sdk-core';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { TestBitGo, TestBitGoAPI, mockSerializedChallengeWithProofs } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { beforeEach } from 'mocha';
import sinon from 'sinon';
import { Tzeta, Zeta } from '../../src';
import { GAS_AMOUNT } from '../../src/lib/constants';
import utils from '../../src/lib/utils';
import {
  TEST_DELEGATE_TX,
  TEST_SEND_TX,
  TEST_TX_WITH_MEMO,
  TEST_UNDELEGATE_TX,
  TEST_WITHDRAW_REWARDS_TX,
  address,
  mockAccountDetailsResponse,
  wrwUser,
} from '../resources/zeta';
import should = require('should');
import nock = require('nock');

describe('Zeta', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('zeta', Zeta.createInstance);
    bitgo.safeRegister('tzeta', Tzeta.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tzeta');
  });

  it('should return the right info', function () {
    const zeta = bitgo.coin('zeta');
    const tzeta = bitgo.coin('tzeta');

    zeta.getChain().should.equal('zeta');
    zeta.getFamily().should.equal('zeta');
    zeta.getFullName().should.equal('Zeta');
    zeta.getBaseFactor().should.equal(1e18);

    tzeta.getChain().should.equal('tzeta');
    tzeta.getFamily().should.equal('zeta');
    tzeta.getFullName().should.equal('Testnet Zeta');
    tzeta.getBaseFactor().should.equal(1e18);
  });

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const addressDetails = basecoin.getAddressDetails(address.noMemoIdAddress);
      addressDetails.address.should.equal(address.noMemoIdAddress);
      should.not.exist(addressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const addressDetails = basecoin.getAddressDetails(address.validMemoIdAddress);
      addressDetails.address.should.equal(address.validMemoIdAddress.split('?')[0]);
      addressDetails.memoId.should.equal('2');
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        basecoin.getAddressDetails(address.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const receiveAddress = {
        address: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8?memoId=7',
        coinSpecific: {
          rootAddress: 'zeta1ktrr4ju3a2luxpcfmv44xrpa4lwx4ufsa38wt8',
          memoID: '7',
        },
      };
      const isValid = await basecoin.isWalletAddress(receiveAddress);
      isValid.should.equal(true);
    });

    it('should validate account addresses correctly', () => {
      should.equal(utils.isValidAddress(address.address1), true);
      should.equal(utils.isValidAddress(address.address2), true);
      should.equal(utils.isValidAddress(address.address3), false);
      should.equal(utils.isValidAddress(address.address4), false);
      should.equal(utils.isValidAddress('dfjk35y'), false);
      should.equal(utils.isValidAddress(undefined as unknown as string), false);
      should.equal(utils.isValidAddress(''), false);
      should.equal(utils.isValidAddress(address.validMemoIdAddress), true);
      should.equal(utils.isValidAddress(address.multipleMemoIdAddress), false);
    });

    it('should validate validator addresses correctly', () => {
      should.equal(utils.isValidValidatorAddress(address.validatorAddress1), true);
      should.equal(utils.isValidValidatorAddress(address.validatorAddress2), true);
      should.equal(utils.isValidValidatorAddress(address.validatorAddress3), false);
      should.equal(utils.isValidValidatorAddress(address.validatorAddress4), false);
      should.equal(utils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(utils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(utils.isValidValidatorAddress(''), false);
    });
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = {
        txHex: TEST_SEND_TX.signedTxBase64,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: TEST_SEND_TX.recipient,
            amount: TEST_SEND_TX.sendAmount,
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify delegate transaction', async function () {
      const txPrebuild = {
        txHex: TEST_DELEGATE_TX.signedTxBase64,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: TEST_DELEGATE_TX.validator,
            amount: TEST_DELEGATE_TX.sendAmount,
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify undelegate transaction', async function () {
      const txPrebuild = {
        txHex: TEST_UNDELEGATE_TX.signedTxBase64,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: TEST_UNDELEGATE_TX.validator,
            amount: TEST_UNDELEGATE_TX.sendAmount,
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify withdraw rewards transaction', async function () {
      const txPrebuild = {
        txHex: TEST_WITHDRAW_REWARDS_TX.signedTxBase64,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: TEST_WITHDRAW_REWARDS_TX.validator,
            amount: 'UNAVAILABLE',
          },
        ],
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = { recipients: undefined };
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_SEND_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_SEND_TX.hash,
        outputs: [
          {
            address: TEST_SEND_TX.recipient,
            amount: TEST_SEND_TX.sendAmount,
          },
        ],
        outputAmount: TEST_SEND_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_TX.gasBudget.amount[0].amount },
        type: 0,
      });
    });

    it('should explain a delegate transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_DELEGATE_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_DELEGATE_TX.hash,
        outputs: [
          {
            address: TEST_DELEGATE_TX.validator,
            amount: TEST_DELEGATE_TX.sendAmount,
          },
        ],
        outputAmount: TEST_DELEGATE_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_DELEGATE_TX.gasBudget.amount[0].amount },
        type: 13,
      });
    });

    it('should explain a undelegate transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_UNDELEGATE_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_UNDELEGATE_TX.hash,
        outputs: [
          {
            address: TEST_UNDELEGATE_TX.validator,
            amount: TEST_UNDELEGATE_TX.sendAmount,
          },
        ],
        outputAmount: TEST_UNDELEGATE_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_UNDELEGATE_TX.gasBudget.amount[0].amount },
        type: 17,
      });
    });

    it('should explain a withdraw transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_WITHDRAW_REWARDS_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_WITHDRAW_REWARDS_TX.hash,
        outputs: [
          {
            address: TEST_WITHDRAW_REWARDS_TX.validator,
            amount: 'UNAVAILABLE',
          },
        ],
        outputAmount: undefined,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_WITHDRAW_REWARDS_TX.gasBudget.amount[0].amount },
        type: 15,
      });
    });

    it('should explain a transfer transaction with memo', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_TX_WITH_MEMO.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_TX_WITH_MEMO.hash,
        outputs: [
          {
            address: TEST_TX_WITH_MEMO.to,
            amount: TEST_TX_WITH_MEMO.sendAmount,
            memo: TEST_TX_WITH_MEMO.memo,
          },
        ],
        outputAmount: TEST_TX_WITH_MEMO.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_TX_WITH_MEMO.gasBudget.amount[0].amount },
        type: 0,
      });
    });

    it('should fail to explain transaction with missing params', async function () {
      try {
        await basecoin.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'missing required txHex parameter');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await basecoin.explainTransaction({ txHex: 'randomString' });
      } catch (error) {
        should.equal(error.message.startsWith('Invalid transaction:'), true);
      }
    });
  });

  describe('Parse Transactions: ', () => {
    it('should parse a transfer transaction', async function () {
      const transferInputsResponse = {
        address: TEST_SEND_TX.recipient,
        amount: new BigNumber(TEST_SEND_TX.sendAmount).plus(TEST_SEND_TX.gasBudget.amount[0].amount).toFixed(),
      };

      const transferOutputsResponse = {
        address: TEST_SEND_TX.recipient,
        amount: TEST_SEND_TX.sendAmount,
      };

      const parsedTransaction = await basecoin.parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Zeta.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Recover transaction: success path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const coin = coins.get('tzeta');
    const testBalance = '15000000000000000';
    const testChainId = 'test-chain';

    beforeEach(() => {
      nock(Environments.test.zetaNodeUrl)
        .get('/cosmos/auth/v1beta1/accounts/' + wrwUser.senderAddress)
        .reply(200, mockAccountDetailsResponse);

      const accountBalance = sandBox.stub(Zeta.prototype, 'getAccountBalance' as keyof Zeta);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testBalance);

      const chainId = sandBox.stub(Zeta.prototype, 'getChainId' as keyof Zeta);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should recover funds for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userPrivateKey,
        backupKey: wrwUser.backupPrivateKey,
        bitgoKey: wrwUser.bitgoPublicKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getAccountBalance);
      sandBox.assert.calledOnce(basecoin.getChainId);

      const txn = new CosmosTransaction(coin, utils);
      txn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const txnJson = txn.toJson();
      const sendMessage = txnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance);
      const gasAmount = new BigNumber(GAS_AMOUNT);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.toAddress, destinationAddress);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });

    it('should redelegate funds to new validator', async function () {
      const res = await basecoin.redelegate({
        userKey: wrwUser.userPrivateKey,
        backupKey: wrwUser.backupPrivateKey,
        bitgoKey: wrwUser.bitgoPublicKey,
        walletPassphrase: wrwUser.walletPassphrase,
        amountToRedelegate: '10000000000000000',
        validatorSrcAddress: 'zetavaloper1dhsk5v53h3xwg42pdg3r0w7zl83yxgyhs68v7l',
        validatorDstAddress: 'zetavaloper19v07wvwm3zux9pawcmccr7c4hfezah0r8whsc6',
      });

      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getChainId);

      const txn = new CosmosTransaction(coin, utils);
      txn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const txnJson = txn.toJson();
      const redelegateMessage = txnJson.sendMessages[0].value as RedelegateMessage;
      should.equal(redelegateMessage.validatorSrcAddress, 'zetavaloper1dhsk5v53h3xwg42pdg3r0w7zl83yxgyhs68v7l');
      should.equal(redelegateMessage.validatorDstAddress, 'zetavaloper19v07wvwm3zux9pawcmccr7c4hfezah0r8whsc6');
      should.equal(redelegateMessage.amount.amount, '10000000000000000');
    });
  });

  describe('Recover transaction: failure path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const testZeroBalance = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      nock(Environments.test.zetaNodeUrl)
        .get('/cosmos/auth/v1beta1/accounts/' + wrwUser.senderAddress)
        .reply(200, mockAccountDetailsResponse);

      const accountBalance = sandBox.stub(Zeta.prototype, 'getAccountBalance' as keyof Zeta);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testZeroBalance);

      const chainId = sandBox.stub(Zeta.prototype, 'getChainId' as keyof Zeta);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should throw error if backupkey is not present', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing backupKey');
    });

    it('should throw error if userkey is not present', async function () {
      await basecoin
        .recover({
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing userKey');
    });

    it('should throw error if wallet passphrase is not present', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userPrivateKey,
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing wallet passphrase');
    });

    it('should throw error if there is no balance', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userPrivateKey,
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('Did not have enough funds to recover');
    });
  });
});
