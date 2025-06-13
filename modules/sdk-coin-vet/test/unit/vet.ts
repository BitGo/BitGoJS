import sinon from 'sinon';
import assert from 'assert';
import _ from 'lodash';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { coins } from '@bitgo/statics';
import { Vet, Tvet, Transaction } from '../../src';
import * as testData from '../resources/vet';

describe('Vechain', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPreBuild = {
    txHex: testData.SPONSORED_TRANSACTION,
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('vet', Vet.createInstance);
    bitgo.safeRegister('tvet', Tvet.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tvet');
    newTxPrebuild = () => {
      return _.cloneDeep(txPreBuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should return the right info', function () {
    const vet = bitgo.coin('vet');
    const tvet = bitgo.coin('tvet');

    vet.getChain().should.equal('vet');
    vet.getFamily().should.equal('vet');
    vet.getFullName().should.equal('VeChain');
    vet.getBaseFactor().should.equal(1e18);

    tvet.getChain().should.equal('tvet');
    tvet.getFamily().should.equal('vet');
    tvet.getFullName().should.equal('Testnet VeChain');
    tvet.getBaseFactor().should.equal(1e18);
  });

  it('should validate address', function () {
    const vet = bitgo.coin('vet');
    vet.isValidAddress('wrongaddress').should.false();
    vet.isValidAddress('25bcb8855effa9f12a23c2f7f34f2d92b5841f19').should.false();
    vet.isValidAddress('0x7Ca00e3bC8a836026C2917C6c7c6D049E52099dd').should.true();
    vet.isValidAddress('0x690fFcefa92876C772E85d4B5963807C2152e08d').should.true();
    vet.isValidAddress('0xe59F1cea4e0FEf511e3d0f4EEc44ADf19C4cbeEC').should.true();
  });

  it('is valid pub', function () {
    // with 0x prefix
    basecoin.isValidPub('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(false);
    // without 0x prefix
    basecoin.isValidPub('027c10f30d5c874cee3d193a321c82926d905998cb4852880935da4ee1820bd7d5').should.equal(true);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify transaction when recipients amount are numbers', async function () {
      const txPrebuild = newTxPrebuild();
      const txParamsWithNumberAmounts = newTxParams();
      txParamsWithNumberAmounts.recipients = txParamsWithNumberAmounts.recipients.map(({ address, amount }) => {
        return { address, amount: Number(amount) };
      });
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParamsWithNumberAmounts,
        txPrebuild,
        verification,
      });
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

  describe('Parse and Explain Transactions: ', () => {
    const transferInputsResponse = [
      {
        address: testData.addresses.validAddresses[0],
        amount: testData.AMOUNT.toString(),
      },
    ];

    const transferOutputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      },
    ];

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txHex: testData.SPONSORED_TRANSACTION,
      });

      parsedTransaction.should.deepEqual({
        inputs: transferInputsResponse,
        outputs: transferOutputsResponse,
      });
    });

    it('should explain a transfer transaction', async function () {
      const rawTx = newTxPrebuild().txHex;
      const transaction = new Transaction(coins.get('tvet'));
      transaction.fromRawTransaction(rawTx);
      const explainedTx = transaction.explainTransaction();
      explainedTx.should.deepEqual({
        displayOrder: [
          'id',
          'outputs',
          'outputAmount',
          'changeOutputs',
          'changeAmount',
          'fee',
          'withdrawAmount',
          'sender',
          'type',
        ],
        id: '0x6d842d5dc5d59d4e8f0a8ec2757b430d1f19c06766fbc5b3db5ebac8a067a439',
        outputs: [
          {
            address: '0xe59f1cea4e0fef511e3d0f4eec44adf19c4cbeec',
            amount: '100000000000000000',
          },
        ],
        outputAmount: '100000000000000000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '315411764705882352' },
        sender: '0x7ca00e3bc8a836026c2917c6c7c6d049e52099dd',
        type: 0,
      });
    });

    it('should fail to explain a invalid raw transaction', async function () {
      const rawTx = 'invalidRawTransaction';
      const transaction = new Transaction(coins.get('tvet'));
      await assert.rejects(async () => transaction.fromRawTransaction(rawTx), {
        message: 'invalid raw transaction',
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Vet.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin
        .parseTransaction({ txHex: testData.INVALID_TRANSACTION })
        .should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('address validation', () => {
    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = testData.addresses.validAddresses[0];
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });
  });
});
