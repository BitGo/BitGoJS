import should = require('should');

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Atom, Tatom } from '../../src/index';
import utils from '../../src/lib/utils';
import { address, TEST_TX } from '../resources/atom';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';

describe('ATOM', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPrebuild = {
    txHex: TEST_TX.signedTxBase64,
    txInfo: {},
  };

  const txParams = {
    recipients: [
      {
        address: TEST_TX.recipient,
        amount: TEST_TX.sendAmount,
      },
    ],
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('atom', Atom.createInstance);
    bitgo.safeRegister('tatom', Tatom.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tatom');
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
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
    it('should validate addresses correctly', () => {
      should.equal(utils.isValidAddress(address.address1), true);
      should.equal(utils.isValidAddress(address.address2), true);
      should.equal(utils.isValidAddress(address.address3), false);
      should.equal(utils.isValidAddress(address.address4), true);
      should.equal(utils.isValidAddress('dfjk35y'), false);
      should.equal(utils.isValidAddress(undefined as unknown as string), false);
      should.equal(utils.isValidAddress(''), false);
    });
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with invalid param', async function () {
      const txPrebuild = {};
      const txParams = newTxParams();
      txParams.recipients = undefined;
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
        txHex: TEST_TX.signedTxBase64,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'UNAVAILABLE',
        outputs: [
          {
            address: TEST_TX.recipient,
            amount: TEST_TX.sendAmount,
          },
        ],
        outputAmount: TEST_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: TEST_TX.gasBudget.amount[0].amount },
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
        should.equal(error.message, 'Invalid transaction');
      }
    });
  });

  describe('Parse Transactions: ', () => {
    const transferInputsResponse = {
      address: TEST_TX.recipient,
      amount: new BigNumber(TEST_TX.sendAmount).plus(TEST_TX.gasBudget.amount[0].amount).toFixed(),
    };

    const transferOutputsResponse = {
      address: TEST_TX.recipient,
      amount: TEST_TX.sendAmount,
    };

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({ txHex: TEST_TX.signedTxBase64 });

      parsedTransaction.should.deepEqual({
        inputs: [transferInputsResponse],
        outputs: [transferOutputsResponse],
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Atom.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin.parseTransaction({ txHex: TEST_TX.signedTxBase64 }).should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });
});
