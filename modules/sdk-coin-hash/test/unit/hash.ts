import { CosmosTransaction, SendMessage } from '@bitgo/abstract-cosmos';
import { BitGoAPI } from '@bitgo/sdk-api';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { TestBitGo, TestBitGoAPI, mockSerializedChallengeWithProofs } from '@bitgo/sdk-test';
import { NetworkType, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { beforeEach } from 'mocha';
import sinon from 'sinon';
import { Hash, Thash } from '../../src';
import { HashUtils } from '../../src/lib/utils';
import {
  TEST_DELEGATE_TX,
  TEST_SEND_TX,
  TEST_TX_WITH_MEMO,
  TEST_UNDELEGATE_TX,
  TEST_WITHDRAW_REWARDS_TX,
  mainnetAddress,
  testnetAddress,
  wrwUser,
} from '../resources/hash';
import should from 'should';

describe('HASH', function () {
  let bitgo: TestBitGoAPI;
  let hash;
  let thash;
  let mainnetUtils: HashUtils;
  let testnetUtils: HashUtils;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('hash', Hash.createInstance);
    bitgo.safeRegister('thash', Thash.createInstance);
    bitgo.initializeTestVars();
    hash = bitgo.coin('hash');
    thash = bitgo.coin('thash');
    mainnetUtils = new HashUtils(NetworkType.MAINNET);
    testnetUtils = new HashUtils(NetworkType.TESTNET);
  });

  it('should return the right info', function () {
    const hash = bitgo.coin('hash');
    const thash = bitgo.coin('thash');

    hash.getChain().should.equal('hash');
    hash.getFamily().should.equal('hash');
    hash.getFullName().should.equal('Provenance');
    hash.getBaseFactor().should.equal(1e9);

    thash.getChain().should.equal('thash');
    thash.getFamily().should.equal('hash');
    thash.getFullName().should.equal('Testnet Provenance');
    thash.getBaseFactor().should.equal(1e9);
  });

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const mainnetAddressDetails = hash.getAddressDetails(mainnetAddress.noMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.noMemoIdAddress);
      should.not.exist(mainnetAddressDetails.memoId);

      const testnetAddressDetails = thash.getAddressDetails(testnetAddress.noMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.noMemoIdAddress);
      should.not.exist(testnetAddressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const mainnetAddressDetails = hash.getAddressDetails(mainnetAddress.validMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.validMemoIdAddress.split('?')[0]);
      mainnetAddressDetails.memoId.should.equal('2');

      const testnetAddressDetails = thash.getAddressDetails(testnetAddress.validMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.validMemoIdAddress.split('?')[0]);
      testnetAddressDetails.memoId.should.equal('2');
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        hash.getAddressDetails(mainnetAddress.multipleMemoIdAddress);
      }).should.throw();
      (() => {
        thash.getAddressDetails(testnetAddress.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const receiveAddress = {
        address: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj?memoId=7',
        coinSpecific: {
          rootAddress: 'tp1496r8u4a48k6khknrhzd6c8cm3c64ewxy5p2rj',
          memoID: '7',
        },
      };
      const isValid = await thash.isWalletAddress(receiveAddress);
      isValid.should.equal(true);
    });

    it('should validate account addresses correctly', () => {
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address1), true);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address2), true);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address3), false);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.address4), false);
      should.equal(mainnetUtils.isValidAddress('dfjk35y'), false);
      should.equal(mainnetUtils.isValidAddress(undefined as unknown as string), false);
      should.equal(mainnetUtils.isValidAddress(''), false);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.validMemoIdAddress), true);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.multipleMemoIdAddress), false);

      should.equal(testnetUtils.isValidAddress(testnetAddress.address1), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address2), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address3), false);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address4), false);
      should.equal(testnetUtils.isValidAddress('dfjk35y'), false);
      should.equal(testnetUtils.isValidAddress(undefined as unknown as string), false);
      should.equal(testnetUtils.isValidAddress(''), false);
      should.equal(testnetUtils.isValidAddress(testnetAddress.validMemoIdAddress), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.multipleMemoIdAddress), false);
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
      const isTransactionVerified = await thash.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await thash.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await thash.verifyTransaction({ txParams, txPrebuild, verification });
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
      const isTransactionVerified = await thash.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = { recipients: undefined };
      await thash
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await thash.explainTransaction({
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
      const explainedTransaction = await thash.explainTransaction({
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
      const explainedTransaction = await thash.explainTransaction({
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
      const explainedTransaction = await thash.explainTransaction({
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
      const explainedTransaction = await thash.explainTransaction({
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
        await thash.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'missing required txHex parameter');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await thash.explainTransaction({ txHex: 'randomString' });
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

      const parsedTransaction = await thash.parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Hash.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await thash
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Recover transaction: success path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const coin = coins.get('thash');
    const testBalance = '150000000000';
    const testAccountNumber = '123';
    const testSequenceNumber = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      const accountBalance = sandBox.stub(Hash.prototype, 'getAccountBalance' as keyof Hash);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testBalance);

      const accountDetails = sandBox.stub(Hash.prototype, 'getAccountDetails' as keyof Hash);
      accountDetails.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);

      const chainId = sandBox.stub(Hash.prototype, 'getChainId' as keyof Hash);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should recover funds for non-bitgo recoveries', async function () {
      const res = await thash.recover({
        userKey: wrwUser.userPrivateKey,
        backupKey: wrwUser.backupPrivateKey,
        bitgoKey: wrwUser.bitgoPublicKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(thash.getAccountBalance);
      sandBox.assert.calledOnce(thash.getAccountDetails);
      sandBox.assert.calledOnce(thash.getChainId);

      const txn = new CosmosTransaction(coin, testnetUtils);
      txn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const txnJson = txn.toJson();
      const sendMessage = txnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance);
      const gasAmount = new BigNumber(5000000000);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.toAddress, destinationAddress);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });
  });

  describe('Recover transaction: failure path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const testZeroBalance = '0';
    const testAccountNumber = '123';
    const testSequenceNumber = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      const accountBalance = sandBox.stub(Hash.prototype, 'getAccountBalance' as keyof Hash);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testZeroBalance);

      const accountDetails = sandBox.stub(Hash.prototype, 'getAccountDetails' as keyof Hash);
      accountDetails.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);

      const chainId = sandBox.stub(Hash.prototype, 'getChainId' as keyof Hash);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(() => {
      sandBox.restore();
      sinon.restore();
    });

    it('should throw error if backupkey is not present', async function () {
      await thash
        .recover({
          userKey: wrwUser.userPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing backupKey');
    });

    it('should throw error if userkey is not present', async function () {
      await thash
        .recover({
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing userKey');
    });

    it('should throw error if wallet passphrase is not present', async function () {
      await thash
        .recover({
          userKey: wrwUser.userPrivateKey,
          backupKey: wrwUser.backupPrivateKey,
          bitgoKey: wrwUser.bitgoPublicKey,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing wallet passphrase');
    });

    it('should throw error if there is no balance', async function () {
      await thash
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
