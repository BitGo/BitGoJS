import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { Tcore, Core } from '../../src';
import { CoreUtils } from '../../src/lib/utils';
import {
  TEST_DELEGATE_TX,
  TEST_SEND_TX,
  TEST_TX_WITH_MEMO,
  TEST_UNDELEGATE_TX,
  TEST_WITHDRAW_REWARDS_TX,
  testnetAddress,
} from '../resources/testcore';
import { mainnetAddress } from '../resources/core';
import should = require('should');
import { NetworkType } from '@bitgo/statics';

describe('Core', function () {
  let bitgo: TestBitGoAPI;
  let core;
  let tcore;
  let mainnetUtils: CoreUtils;
  let testnetUtils: CoreUtils;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('core', Core.createInstance);
    bitgo.safeRegister('tcore', Tcore.createInstance);
    bitgo.initializeTestVars();
    core = bitgo.coin('core');
    tcore = bitgo.coin('tcore');
    mainnetUtils = new CoreUtils(NetworkType.MAINNET);
    testnetUtils = new CoreUtils(NetworkType.TESTNET);
  });

  it('should return the right info', function () {
    core.getChain().should.equal('core');
    core.getFamily().should.equal('core');
    core.getFullName().should.equal('Coreum');
    core.getBaseFactor().should.equal(1e6);

    tcore.getChain().should.equal('tcore');
    tcore.getFamily().should.equal('core');
    tcore.getFullName().should.equal('Testnet Coreum');
    tcore.getBaseFactor().should.equal(1e6);
  });

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const mainnetAddressDetails = core.getAddressDetails(mainnetAddress.noMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.noMemoIdAddress);
      should.not.exist(mainnetAddressDetails.memoId);

      const testnetAddressDetails = tcore.getAddressDetails(testnetAddress.noMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.noMemoIdAddress);
      should.not.exist(testnetAddressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const mainnetAddressDetails = core.getAddressDetails(mainnetAddress.validMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.validMemoIdAddress.split('?')[0]);
      mainnetAddressDetails.memoId.should.equal('2');

      const testnetAddressDetails = core.getAddressDetails(testnetAddress.validMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.validMemoIdAddress.split('?')[0]);
      testnetAddressDetails.memoId.should.equal('2');
    });

    it('should throw on invalid memo id address', () => {
      (() => {
        core.getAddressDetails(mainnetAddress.invalidMemoIdAddress);
      }).should.throw();
      (() => {
        tcore.getAddressDetails(testnetAddress.invalidMemoIdAddress);
      }).should.throw();
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        core.getAddressDetails(mainnetAddress.multipleMemoIdAddress);
      }).should.throw();
      (() => {
        tcore.getAddressDetails(testnetAddress.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const mainnetReceiveAddress = {
        address: 'core1ssh2d2ft6hzrgn9z6k7mmsamy2hfpxl9y8re5x?memoId=7',
        coinSpecific: {
          rootAddress: 'core1ssh2d2ft6hzrgn9z6k7mmsamy2hfpxl9y8re5x',
          memoID: '7',
        },
      };
      const testnetReceiveAddress = {
        address: 'testcore1ecqgwd4whevrzjxrhrja54c5jg043j79xtz5a5?memoId=7',
        coinSpecific: {
          rootAddress: 'testcore1ecqgwd4whevrzjxrhrja54c5jg043j79xtz5a5',
          memoID: '7',
        },
      };

      const isValidMainnetReceiveAddress = await core.isWalletAddress(mainnetReceiveAddress);
      const isValidTestnetReceiveAddress = await tcore.isWalletAddress(testnetReceiveAddress);

      isValidMainnetReceiveAddress.should.equal(true);
      isValidTestnetReceiveAddress.should.equal(true);
    });

    it('should validate account addresses correctly', () => {
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address1), true);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address2), true);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address3), false);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address4), true);
      should.equal(mainnetUtils.isValidAddress('dfjk35y'), false);
      should.equal(mainnetUtils.isValidAddress(undefined as unknown as string), false);
      should.equal(mainnetUtils.isValidAddress(''), false);

      should.equal(testnetUtils.isValidAddress(testnetAddress.address1), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address2), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address3), false);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address4), true);
      should.equal(testnetUtils.isValidAddress('dfjk35y'), false);
      should.equal(testnetUtils.isValidAddress(undefined as unknown as string), false);
      should.equal(testnetUtils.isValidAddress(''), false);
    });

    it('should validate validator addresses correctly', () => {
      should.equal(mainnetUtils.isValidValidatorAddress(mainnetAddress.validatorAddress1), true);
      should.equal(mainnetUtils.isValidValidatorAddress(mainnetAddress.validatorAddress2), true);
      should.equal(mainnetUtils.isValidValidatorAddress(mainnetAddress.validatorAddress3), false);
      should.equal(mainnetUtils.isValidValidatorAddress(mainnetAddress.validatorAddress4), false);
      should.equal(mainnetUtils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(mainnetUtils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(mainnetUtils.isValidValidatorAddress(''), false);

      should.equal(testnetUtils.isValidValidatorAddress(testnetAddress.validatorAddress1), true);
      should.equal(testnetUtils.isValidValidatorAddress(testnetAddress.validatorAddress2), true);
      should.equal(testnetUtils.isValidValidatorAddress(testnetAddress.validatorAddress3), false);
      should.equal(testnetUtils.isValidValidatorAddress(testnetAddress.validatorAddress4), false);
      should.equal(testnetUtils.isValidValidatorAddress('dfjk35y'), false);
      should.equal(testnetUtils.isValidValidatorAddress(undefined as unknown as string), false);
      should.equal(testnetUtils.isValidValidatorAddress(''), false);
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
      const isTransactionVerified = await tcore.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await tcore.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await tcore.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await tcore.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = { recipients: undefined };
      await tcore
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await tcore.explainTransaction({
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
      const explainedTransaction = await tcore.explainTransaction({
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
      const explainedTransaction = await tcore.explainTransaction({
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
      const explainedTransaction = await tcore.explainTransaction({
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
      const explainedTransaction = await tcore.explainTransaction({
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
        await tcore.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'missing required txHex parameter');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await tcore.explainTransaction({ txHex: 'randomString' });
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

      const parsedTransaction = await tcore.parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Core.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await tcore
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });
});
