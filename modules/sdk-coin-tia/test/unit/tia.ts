import { CosmosTransaction, SendMessage } from '@bitgo/abstract-cosmos';
import { BitGoAPI } from '@bitgo/sdk-api';
import { EcdsaRangeProof, EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { mockSerializedChallengeWithProofs, TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { beforeEach } from 'mocha';
import sinon from 'sinon';
import { Tia, Ttia } from '../../src';
import utils from '../../src/lib/utils';
import {
  address,
  mockAccountDetailsResponse,
  TEST_DELEGATE_TX,
  TEST_SEND_MANY_STAKE_TX,
  TEST_SEND_MANY_TX,
  TEST_SEND_MANY_UNSTAKE_TX,
  TEST_SEND_TX,
  TEST_TX_WITH_MEMO,
  TEST_UNDELEGATE_TX,
  TEST_WITHDRAW_REWARDS_TX,
  wrwUser,
} from '../resources/tia';
import should from 'should';
import nock = require('nock');

describe('TIA', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tia', Tia.createInstance);
    bitgo.safeRegister('ttia', Ttia.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ttia');
  });

  it('should return the right info', function () {
    const tia = bitgo.coin('tia');
    const ttia = bitgo.coin('ttia');

    tia.getChain().should.equal('tia');
    tia.getFamily().should.equal('tia');
    tia.getFullName().should.equal('Celestia');
    tia.getBaseFactor().should.equal(1e6);

    ttia.getChain().should.equal('ttia');
    ttia.getFamily().should.equal('tia');
    ttia.getFullName().should.equal('Testnet Celestia');
    ttia.getBaseFactor().should.equal(1e6);
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
        address: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n?memoId=7',
        coinSpecific: {
          rootAddress: 'celestia1yn3t8qujmtxjsnx7angjua3jhvkjxy5n5xgs0n',
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
            address: 'celestia15vkevhc849fxxc5cpv360rg3t56h0k0rygkkny',
            amount: '100000',
          },
          {
            address: 'celestia1pe6lud48qetlh4860uvrk2r94aqn064jn6jxsk',
            amount: '100000',
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
            address: 'celestia15vkevhc849fxxc5cpv360rg3t56h0k0rygkkny',
            amount: '100000',
          },
          {
            address: 'celestia1pe6lud48qetlh4860uvrk2r94aqn064jn6jxsk',
            amount: '100000',
          },
        ],
        outputAmount: '200000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_MANY_TX.gasBudget.amount[0].amount },
        type: 0,
      });
    });

    it('should explain sendMany stake transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_SEND_MANY_STAKE_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_SEND_MANY_STAKE_TX.hash,
        outputs: [
          {
            address: 'celestiavaloper1u655tgul3su7s0u7kxyh6mdwcy5qn6xwl32s0d',
            amount: '7000',
          },
          {
            address: 'celestiavaloper19urg9awjzwq8d40vwjdvv0yw9kgehscf0zx3gs',
            amount: '11000',
          },
        ],
        outputAmount: '18000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_MANY_STAKE_TX.gasBudget.amount[0].amount },
        type: 13,
      });
    });

    it('should explain sendMany unstake transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txHex: TEST_SEND_MANY_UNSTAKE_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_SEND_MANY_UNSTAKE_TX.hash,
        outputs: [
          {
            address: 'celestiavaloper1u655tgul3su7s0u7kxyh6mdwcy5qn6xwl32s0d',
            amount: '5000',
          },
          {
            address: 'celestiavaloper19urg9awjzwq8d40vwjdvv0yw9kgehscf0zx3gs',
            amount: '9000',
          },
        ],
        outputAmount: '14000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_MANY_UNSTAKE_TX.gasBudget.amount[0].amount },
        type: 17,
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
      const stub = sinon.stub(Tia.prototype, 'explainTransaction');
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
    const coin = coins.get('ttia');
    const testBalance = '1500000';
    const testChainId = 'test-chain';

    beforeEach(() => {
      nock('https://api-mocha.pops.one')
        .get('/cosmos/auth/v1beta1/accounts/' + wrwUser.senderAddress)
        .reply(200, mockAccountDetailsResponse);

      const accountBalance = sandBox.stub(Tia.prototype, 'getAccountBalance' as keyof Tia);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testBalance);

      const chainId = sandBox.stub(Tia.prototype, 'getChainId' as keyof Tia);
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
      const gasAmount = new BigNumber(30000);
      const actualBalance = balance.minus(gasAmount);
      should.equal(sendMessage.toAddress, destinationAddress);
      should.equal(sendMessage.amount[0].amount, actualBalance.toFixed());
    });
  });

  describe('Recover transaction: failure path', () => {
    const sandBox = sinon.createSandbox();
    const destinationAddress = wrwUser.destinationAddress;
    const testZeroBalance = '0';
    const testChainId = 'test-chain';

    beforeEach(() => {
      nock('https://api-mocha.pops.one')
        .get('/cosmos/auth/v1beta1/accounts/' + wrwUser.senderAddress)
        .reply(200, mockAccountDetailsResponse);

      const accountBalance = sandBox.stub(Tia.prototype, 'getAccountBalance' as keyof Tia);
      accountBalance.withArgs(wrwUser.senderAddress).resolves(testZeroBalance);

      const chainId = sandBox.stub(Tia.prototype, 'getChainId' as keyof Tia);
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
