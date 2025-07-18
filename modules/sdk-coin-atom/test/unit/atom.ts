import { CosmosTransaction, RedelegateMessage, SendMessage } from '@bitgo/abstract-cosmos';
import { BitGoAPI } from '@bitgo/sdk-api';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { TestBitGo, TestBitGoAPI, mockSerializedChallengeWithProofs } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { Atom, Tatom } from '../../src';
import { GAS_AMOUNT } from '../../src/lib/constants';
import utils from '../../src/lib/utils';
import {
  TEST_DELEGATE_TX,
  TEST_SEND_MANY_TX,
  TEST_SEND_TX,
  TEST_TX_WITH_MEMO,
  TEST_UNDELEGATE_TX,
  TEST_WITHDRAW_REWARDS_TX,
  address,
  wrwUser,
  wrwUserDkls,
} from '../resources/atom';
import should from 'should';

describe('ATOM', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('atom', Atom.createInstance);
    bitgo.safeRegister('tatom', Tatom.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tatom');
  });

  it('should retun the right info', function () {
    const atom = bitgo.coin('atom');
    const tatom = bitgo.coin('tatom');

    atom.getChain().should.equal('atom');
    atom.getFamily().should.equal('atom');
    atom.getFullName().should.equal('Cosmos Hub ATOM');
    atom.getBaseFactor().should.equal(1e6);

    tatom.getChain().should.equal('tatom');
    tatom.getFamily().should.equal('atom');
    tatom.getFullName().should.equal('Testnet Cosmos Hub ATOM');
    tatom.getBaseFactor().should.equal(1e6);
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
        address: 'cosmos1r7k3xmlljsfdk6y9r8ssfnt4ks5ka0nwmm0z70?memoId=7',
        coinSpecific: {
          rootAddress: 'cosmos1r7k3xmlljsfdk6y9r8ssfnt4ks5ka0nwmm0z70',
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

    it('should succeed to verify sendMany transaction', async function () {
      const txPrebuild = {
        txHex: TEST_SEND_MANY_TX.signedTxBase64,
        txInfo: {},
      };
      const txParams = {
        recipients: [
          {
            address: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
            amount: '500',
          },
          {
            address: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
            amount: '500',
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

    it('should explain sendMany transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_SEND_MANY_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_SEND_MANY_TX.hash,
        outputs: [
          {
            address: 'cosmos16ghn9c6f5yua09zqw7y794mvc30h4y4md7ckuk',
            amount: '500',
          },
          {
            address: 'cosmos1ytez06yx0u3yjzjjjm02xyx3mh25akenzql3n8',
            amount: '500',
          },
        ],
        outputAmount: '1000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_MANY_TX.gasBudget.amount[0].amount },
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
    const transferInputsResponse = {
      address: TEST_SEND_TX.recipient,
      amount: new BigNumber(TEST_SEND_TX.sendAmount).plus(TEST_SEND_TX.gasBudget.amount[0].amount).toFixed(),
    };

    const transferOutputsResponse = {
      address: TEST_SEND_TX.recipient,
      amount: TEST_SEND_TX.sendAmount,
    };

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Atom.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Recover transactions: success path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const coin = coins.get('tatom');
    const testBalance = '150000';
    const testAccountNumber = '725163';
    const testSequenceNumber = '8';

    const testBalanceDkls = '150000';
    const testAccountNumberDkls = '755440';
    const testSequenceNumberDkls = '2';

    const testChainId = 'theta-testnet-001';

    beforeEach(() => {
      const accountBalance = sandBox.stub(Atom.prototype, 'getAccountBalance' as keyof Atom);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testBalance);
      accountBalance.withArgs(wrwUserDkls.senderAddress).resolves(testBalanceDkls);

      const accountDetails = sandBox.stub(Atom.prototype, 'getAccountDetails' as keyof Atom);
      accountDetails.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);
      accountDetails.withArgs(wrwUserDkls.senderAddress).resolves([testAccountNumberDkls, testSequenceNumberDkls]);

      const chainId = sandBox.stub(Atom.prototype, 'getChainId' as keyof Atom);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(function () {
      sandBox.restore();
      sinon.restore();
    });

    it('should recover funds for non-bitgo recoveries', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getAccountBalance);
      sandBox.assert.calledOnce(basecoin.getAccountDetails);
      sandBox.assert.calledOnce(basecoin.getChainId);

      const atomTxn = new CosmosTransaction(coin, utils);
      atomTxn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const atomTxnJson = atomTxn.toJson();
      const sendMessage = atomTxnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance);
      const gasAmount = new BigNumber(GAS_AMOUNT);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });

    it('should recover funds for non-bitgo recoveries - DKLS type', async function () {
      const res = await basecoin.recover({
        userKey: wrwUserDkls.userKey,
        backupKey: wrwUserDkls.backupKey,
        bitgoKey: wrwUserDkls.bitgoKey,
        walletPassphrase: wrwUserDkls.walletPassphrase,
        recoveryDestination: wrwUserDkls.destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getAccountBalance);
      sandBox.assert.calledOnce(basecoin.getAccountDetails);
      sandBox.assert.calledOnce(basecoin.getChainId);

      const atomTxn = new CosmosTransaction(coin, utils);
      atomTxn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const atomTxnJson = atomTxn.toJson();
      const sendMessage = atomTxnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalanceDkls);
      const gasAmount = new BigNumber(GAS_AMOUNT);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });

    it('should recover funds for Unsigned Sweep Transaction', async function () {
      const res = await basecoin.recover({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        recoveryDestination: destinationAddress,
      });
      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getAccountBalance);
      sandBox.assert.calledOnce(basecoin.getAccountDetails);
      sandBox.assert.calledOnce(basecoin.getChainId);

      const unsignedSweepTxnDeserialize = new CosmosTransaction(coin, utils);
      unsignedSweepTxnDeserialize.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();
      const sendMessage = unsignedSweepTxnJson.sendMessages[0].value as SendMessage;
      const balance = new BigNumber(testBalance);
      const gasAmount = new BigNumber(GAS_AMOUNT);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });

    it('should redelegate funds to new validator', async function () {
      const res = await basecoin.redelegate({
        userKey: wrwUser.userKey,
        backupKey: wrwUser.backupKey,
        bitgoKey: wrwUser.bitgoKey,
        walletPassphrase: wrwUser.walletPassphrase,
        amountToRedelegate: '10000000000000000',
        validatorSrcAddress: 'cosmosvaloper1409te27da74uahh6hn0040x7l272hjs2padjuz',
        validatorDstAddress: 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6',
      });

      res.should.not.be.empty();
      res.should.hasOwnProperty('serializedTx');
      sandBox.assert.calledOnce(basecoin.getChainId);

      const txn = new CosmosTransaction(coin, utils);
      txn.enrichTransactionDetailsFromRawTransaction(res.serializedTx);
      const txnJson = txn.toJson();
      const redelegateMessage = txnJson.sendMessages[0].value as RedelegateMessage;
      should.equal(redelegateMessage.validatorSrcAddress, 'cosmosvaloper1409te27da74uahh6hn0040x7l272hjs2padjuz');
      should.equal(redelegateMessage.validatorDstAddress, 'cosmosvaloper183aycgtstp67r6s4vd7ts2npp2ckk4xah7rxj6');
      should.equal(redelegateMessage.amount.amount, '10000000000000000');
    });
  });

  describe('Recover transactions: failure path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const testZeroBalance = '0';
    const testAccountNumber = '1234';
    const testSequenceNumber = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      const accountBalance = sandBox.stub(Atom.prototype, 'getAccountBalance' as keyof Atom);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testZeroBalance);

      const accountNumber = sandBox.stub(Atom.prototype, 'getAccountDetails' as keyof Atom);
      accountNumber.withArgs(wrwUser.senderAddress).resolves([testAccountNumber, testSequenceNumber]);

      const chainId = sandBox.stub(Atom.prototype, 'getChainId' as keyof Atom);
      chainId.withArgs().resolves(testChainId);

      const deserializedEntChallenge = EcdsaTypes.deserializeNtildeWithProofs(mockSerializedChallengeWithProofs);
      sinon.stub(EcdsaRangeProof, 'generateNtilde').resolves(deserializedEntChallenge);
    });

    afterEach(function () {
      sandBox.restore();
      sinon.restore();
    });

    it('should throw error if backupkey is not present', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing backupKey');
    });

    it('should throw error if userkey is not present', async function () {
      await basecoin
        .recover({
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing userKey');
    });

    it('should throw error if wallet passphrase is not present', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('missing wallet passphrase');
    });

    it('should throw error if there is no balance', async function () {
      await basecoin
        .recover({
          userKey: wrwUser.userKey,
          backupKey: wrwUser.backupKey,
          bitgoKey: wrwUser.bitgoKey,
          walletPassphrase: wrwUser.walletPassphrase,
          recoveryDestination: destinationAddress,
        })
        .should.rejectedWith('Did not have enough funds to recover');
    });
  });
});
