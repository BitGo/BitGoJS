import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { NetworkType } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { Rune, Trune } from '../../src';
import { RuneUtils } from '../../src/lib/utils';
import { mainnetAddress } from '../resources/rune';
import { TEST_SEND_TX, TEST_TX_WITH_MEMO, testnetAddress } from '../resources/trune';
const bech32 = require('bech32-buffer');
import should = require('should');

describe('Rune', function () {
  let bitgo: TestBitGoAPI;
  let rune;
  let trune;
  let mainnetUtils: RuneUtils;
  let testnetUtils: RuneUtils;
  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('thorchain:rune', Rune.createInstance);
    bitgo.safeRegister('tthorchain:rune', Trune.createInstance);
    bitgo.initializeTestVars();
    rune = bitgo.coin('thorchain:rune');
    trune = bitgo.coin('tthorchain:rune');
    mainnetUtils = new RuneUtils(NetworkType.MAINNET);
    testnetUtils = new RuneUtils(NetworkType.TESTNET);
  });

  it('should return the right info', function () {
    rune.getChain().should.equal('thorchain:rune');
    rune.getFamily().should.equal('thor');
    rune.getFullName().should.equal('Rune');
    rune.getBaseFactor().should.equal(1e8);

    trune.getChain().should.equal('tthorchain:rune');
    trune.getFamily().should.equal('thor');
    trune.getFullName().should.equal('Testnet Rune');
    trune.getBaseFactor().should.equal(1e8);
  });

  describe('Address Validation', () => {
    it('should get address details without memoId', function () {
      const mainnetAddressDetails = rune.getAddressDetails(mainnetAddress.noMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.noMemoIdAddress);
      should.not.exist(mainnetAddressDetails.memoId);

      const testnetAddressDetails = trune.getAddressDetails(testnetAddress.noMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.noMemoIdAddress);
      should.not.exist(testnetAddressDetails.memoId);
    });

    it('should get address details with memoId', function () {
      const mainnetAddressDetails = rune.getAddressDetails(mainnetAddress.validMemoIdAddress);
      mainnetAddressDetails.address.should.equal(mainnetAddress.validMemoIdAddress.split('?')[0]);
      mainnetAddressDetails.memoId.should.equal('2');

      const testnetAddressDetails = rune.getAddressDetails(testnetAddress.validMemoIdAddress);
      testnetAddressDetails.address.should.equal(testnetAddress.validMemoIdAddress.split('?')[0]);
      testnetAddressDetails.memoId.should.equal('2');
    });

    it('should throw on invalid memo id address', () => {
      (() => {
        rune.getAddressDetails(mainnetAddress.invalidMemoIdAddress);
      }).should.throw();
      (() => {
        trune.getAddressDetails(testnetAddress.invalidMemoIdAddress);
      }).should.throw();
    });

    it('should throw on multiple memo id address', () => {
      (() => {
        rune.getAddressDetails(mainnetAddress.multipleMemoIdAddress);
      }).should.throw();
      (() => {
        trune.getAddressDetails(testnetAddress.multipleMemoIdAddress);
      }).should.throw();
    });

    it('should validate wallet receive address', async function () {
      const mainnetReceiveAddress = {
        address: 'thor1fwk9jl6kfflurj9p0wt098kxl02gle4yhnm687?memoId=7',
        coinSpecific: {
          rootAddress: 'thor1fwk9jl6kfflurj9p0wt098kxl02gle4yhnm687',
          memoID: '7',
        },
      };
      const testnetReceiveAddress = {
        address: 'sthor19phfqh3ce3nnjhh0cssn433nydq9shx76s8qgg?memoId=7',
        coinSpecific: {
          rootAddress: 'sthor19phfqh3ce3nnjhh0cssn433nydq9shx76s8qgg',
          memoID: '7',
        },
      };

      const isValidMainnetReceiveAddress = await rune.isWalletAddress(mainnetReceiveAddress);
      const isValidTestnetReceiveAddress = await trune.isWalletAddress(testnetReceiveAddress);

      isValidMainnetReceiveAddress.should.equal(true);
      isValidTestnetReceiveAddress.should.equal(true);
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
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.invalidMemoIdAddress), false);
      should.equal(mainnetUtils.isValidAddress(mainnetAddress.multipleMemoIdAddress), false);

      should.equal(testnetUtils.isValidAddress(testnetAddress.address1), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address2), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address3), false);
      should.equal(testnetUtils.isValidAddress(testnetAddress.address4), false);
      should.equal(testnetUtils.isValidAddress('dfjk35y'), false);
      should.equal(testnetUtils.isValidAddress(undefined as unknown as string), false);
      should.equal(testnetUtils.isValidAddress(''), false);
      should.equal(testnetUtils.isValidAddress(testnetAddress.validMemoIdAddress), true);
      should.equal(testnetUtils.isValidAddress(testnetAddress.invalidMemoIdAddress), false);
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
      const isTransactionVerified = await trune.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = { recipients: undefined };
      await trune
        .verifyTransaction({
          txParams,
          txPrebuild,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });
  });

  describe('Explain Transaction: ', () => {
    it('should explain a transfer transaction', async function () {
      const explainedTransaction = await trune.explainTransaction({
        txHex: TEST_SEND_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_SEND_TX.hash,
        outputs: [
          {
            address: bech32.decode(TEST_SEND_TX.recipient).data,
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

    it('should explain a transfer transaction with memo', async function () {
      const explainedTransaction = await trune.explainTransaction({
        txHex: TEST_TX_WITH_MEMO.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: TEST_TX_WITH_MEMO.hash,
        outputs: [
          {
            address: bech32.decode(TEST_TX_WITH_MEMO.recipient).data,
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
        await trune.explainTransaction({});
      } catch (error) {
        should.equal(error.message, 'missing required txHex parameter');
      }
    });

    it('should fail to explain transaction with invalid params', async function () {
      try {
        await trune.explainTransaction({ txHex: 'randomString' });
      } catch (error) {
        should.equal(error.message.startsWith('Invalid transaction:'), true);
      }
    });
  });

  describe('Parse Transactions: ', () => {
    it('should parse a transfer transaction', async function () {
      const transferInputsResponse = {
        address: bech32.decode(TEST_SEND_TX.recipient).data,
        amount: new BigNumber(TEST_SEND_TX.sendAmount).plus(TEST_SEND_TX.gasBudget.amount[0].amount).toFixed(),
      };

      const transferOutputsResponse = {
        address: bech32.decode(TEST_SEND_TX.recipient).data,
        amount: TEST_SEND_TX.sendAmount,
      };

      const parsedTransaction = await trune.parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Rune.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await trune
        .parseTransaction({ txHex: TEST_SEND_TX.signedTxBase64 })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });
});
