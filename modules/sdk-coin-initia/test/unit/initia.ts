import should from 'should';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Initia, Tinitia } from '../../src/index';
import utils from '../../src/lib/utils';
import { TEST_SEND_MANY_TX, TEST_SEND_TX, TEST_TX_WITH_MEMO, address, TEST_ACCOUNT } from '../resources/initia';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
const coinString = 'initia';
const testCoinString = 'tinitia';
const coinFullName = 'Initia';
const testCoinFullName = 'Testnet Initia';
const baseFactor = 1e6;
const coinInstance = Initia.createInstance;
const testCoinInstance = Tinitia.createInstance;
bitgo.safeRegister(testCoinString, testCoinInstance);

describe('Initia', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister(coinString, coinInstance);
    bitgo.safeRegister(testCoinString, testCoinInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin(testCoinString);
  });

  it('should return the right info', function () {
    const initia = bitgo.coin(coinString);
    const tinitia = bitgo.coin(testCoinString);

    initia.getChain().should.equal(coinString);
    initia.getFamily().should.equal(coinString);
    initia.getFullName().should.equal(coinFullName);
    initia.getBaseFactor().should.equal(baseFactor);

    tinitia.getChain().should.equal(testCoinString);
    tinitia.getFamily().should.equal(coinString);
    tinitia.getFullName().should.equal(testCoinFullName);
    tinitia.getBaseFactor().should.equal(baseFactor);
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

    it('should throw on invalid memo id address', () => {
      (() => {
        basecoin.getAddressDetails(address.invalidMemoIdAddress);
      }).should.throw();
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        basecoin.getAddressDetails(address.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const memo = 'memoId=7';
      const receiveAddress = {
        address: `${TEST_ACCOUNT.pubAddress}?${memo}`,
        coinSpecific: {
          rootAddress: TEST_ACCOUNT.pubAddress,
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
      should.equal(utils.isValidAddress(address.invalidMemoIdAddress), false);
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
            address: TEST_SEND_MANY_TX.sendMessages[0].value.toAddress,
            amount: TEST_SEND_MANY_TX.sendMessages[0].value.amount[0].amount,
          },
          {
            address: TEST_SEND_MANY_TX.sendMessages[1].value.toAddress,
            amount: TEST_SEND_MANY_TX.sendMessages[1].value.amount[0].amount,
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
            address: TEST_SEND_MANY_TX.sendMessages[0].value.toAddress,
            amount: TEST_SEND_MANY_TX.sendMessages[0].value.amount[0].amount,
          },
          {
            address: TEST_SEND_MANY_TX.sendMessages[1].value.toAddress,
            amount: TEST_SEND_MANY_TX.sendMessages[1].value.amount[0].amount,
          },
        ],
        outputAmount: '20000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_SEND_MANY_TX.gasBudget.amount[0].amount },
        type: 0,
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
      const stub = sinon.stub(Initia.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });
});
