import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { Baby, Tbaby } from '../../src';
import { TEST_SEND_MANY_TX, TEST_SEND_TX, TEST_TX_WITH_MEMO, address } from '../resources/baby';
import should from 'should';
import utils from '../../src/lib/utils';

describe('Babylon', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('baby', Baby.createInstance);
    bitgo.safeRegister('tbaby', Tbaby.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbaby');
  });

  it('should return the right info', function () {
    const baby = bitgo.coin('baby');
    const tbaby = bitgo.coin('tbaby');

    baby.getChain().should.equal('baby');
    baby.getFamily().should.equal('baby');
    baby.getFullName().should.equal('Babylon');
    baby.getBaseFactor().should.equal(1e6);

    tbaby.getChain().should.equal('tbaby');
    tbaby.getFamily().should.equal('baby');
    tbaby.getFullName().should.equal('Testnet Babylon');
    tbaby.getBaseFactor().should.equal(1e6);
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

      const addressDetails2 = basecoin.getAddressDetails(address.validMemoIdAddress2);
      addressDetails2.address.should.equal(address.validMemoIdAddress2.split('?')[0]);
      addressDetails2.memoId.should.equal('xyz123');
    });

    it('should throw on invalid memo id address', () => {
      (() => {
        basecoin.getAddressDetails(address.invalidMemoIdAddress);
      }).should.throw();

      (() => {
        basecoin.getAddressDetails(address.invalidMemoIdAddress2);
      }).should.throw();
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        basecoin.getAddressDetails(address.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const receiveAddress = {
        address: 'bbn1897xa4swxx9dr7z0zut0mfs7efplx80q86kd8q?memoId=7',
        coinSpecific: {
          rootAddress: 'bbn1897xa4swxx9dr7z0zut0mfs7efplx80q86kd8q',
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
      should.equal(utils.isValidAddress(address.validMemoIdAddress2), true);
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

    it('should finality provider addresses correctly', () => {
      should.equal(basecoin.isValidAddress(address.finalityProviderAddress), true);
      should.equal(basecoin.isValidAddress('dfjk35y'), false);
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
            address: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
            amount: '10000',
          },
          {
            address: 'bbn1c9npt0xhwfvmtnhyq3jqfhq0889l8w04qay3ds',
            amount: '10000',
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
            address: 'bbn19syhqw5qeuas365cw9pvdadzex7durfm7hlfn8',
            amount: '10000',
          },
          {
            address: 'bbn1c9npt0xhwfvmtnhyq3jqfhq0889l8w04qay3ds',
            amount: '10000',
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
      const stub = sinon.stub(Baby.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });
});
