import should from 'should';
import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import { fromBase64, toHex } from '@cosmjs/encoding';
import { VerifyAddressOptions, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins, CosmosNetwork } from '@bitgo/statics';
import { CosmosSharedCoin } from '../../src/cosmosSharedCoin';
import { Utils } from '../../src/lib/utils';
import { getAvailableTestCoins, getTestData } from '../testUtils';

describe('Cosmos Shared Coin', function () {
  const availableCoins = getAvailableTestCoins();
  // TODO: COIN-5039 -  Running tests for each coin in parallel to improve test performance
  // Loop through each available coin and run tests
  availableCoins.forEach((coinName) => {
    describe(`${coinName.toUpperCase()} Cosmos Shared Coin`, function () {
      let bitgo: TestBitGoAPI;
      let cosmosCoin: CosmosSharedCoin;
      let utils: Utils;
      const testData = getTestData(coinName);
      const testTx = testData.testSendTx as Required<typeof testData.testSendTx>;
      const testTxWithMemo = testData.testTxWithMemo as Required<typeof testData.testTxWithMemo>;
      const coin = coins.get(testData.testnetCoin);
      const network = coin.network as CosmosNetwork;

      before(function () {
        bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        bitgo.safeRegister(testData.testnetCoin, CosmosSharedCoin.createInstance);
        bitgo.safeRegister(testData.mainnetCoin, CosmosSharedCoin.createInstance);
        bitgo.initializeTestVars();
        cosmosCoin = bitgo.coin(testData.testnetCoin) as CosmosSharedCoin;
        utils = new Utils(network);
      });

      it('should instantiate the coin', function () {
        should.exist(cosmosCoin);
        cosmosCoin.should.be.an.instanceof(CosmosSharedCoin);
      });

      it('should return the right info', function () {
        const testCoin = bitgo.coin(testData.testnetCoin);
        const mainnetCoin = bitgo.coin(testData.mainnetCoin);
        testCoin.getChain().should.equal(testData.testnetCoin);
        testCoin.getFamily().should.equal(testData.family);
        testCoin.getFullName().should.equal(testData.testnetName);
        testCoin.getBaseFactor().should.equal(Math.pow(10, testData.decimalPlaces));

        mainnetCoin.getChain().should.equal(testData.mainnetCoin);
        mainnetCoin.getFamily().should.equal(testData.family);
        mainnetCoin.getFullName().should.equal(testData.mainnetName);
        mainnetCoin.getBaseFactor().should.equal(Math.pow(10, testData.decimalPlaces));
      });

      it('should throw if instantiated without a staticsCoin', function () {
        const tempBitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        should(() => CosmosSharedCoin.createInstance(tempBitgo)).throwError(
          'missing required constructor parameter staticsCoin'
        );
      });

      it('should throw if instantiated with invalid network configuration', function () {
        const tempBitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        const invalidCoin = Object.assign({}, coin, { network: {} });
        should(() => CosmosSharedCoin.createInstance(tempBitgo, invalidCoin)).throwError(
          'Invalid network configuration: missing required Cosmos network parameters'
        );
      });

      describe('getBaseFactor', function () {
        it('should return the correct base factor', function () {
          const baseFactor = cosmosCoin.getBaseFactor();
          should.equal(baseFactor, Math.pow(10, testData.decimalPlaces));
        });
      });

      describe('getBuilder', function () {
        it('should return a transaction builder', function () {
          const builder = cosmosCoin.getBuilder();
          should.exist(builder);
        });
      });

      describe('getDenomination', function () {
        it('should return the correct denomination', function () {
          should.equal(cosmosCoin.getDenomination(), network.denom);
        });
      });

      describe('getGasAmountDetails', function () {
        it('should return the correct gas amount details', function () {
          const gasAmountDetails = cosmosCoin.getGasAmountDetails();
          should.deepEqual(gasAmountDetails, {
            gasAmount: network.gasAmount,
            gasLimit: network.gasLimit,
          });
        });
      });

      describe('getNetwork', function () {
        it('should return the correct network', function () {
          const returnedNetwork = cosmosCoin.getNetwork();
          should.deepEqual(returnedNetwork, network);
        });
      });

      describe('getKeyPair', function () {
        it('should return a key pair', function () {
          const keyPair = cosmosCoin.getKeyPair(toHex(fromBase64(testData.pubKey)));
          should.exist(keyPair);
        });
      });

      describe('getAddressFromPublicKey', function () {
        it('should return the correct address', function () {
          const address = cosmosCoin.getAddressFromPublicKey(toHex(fromBase64(testData.pubKey)));
          should.equal(address, testData.senderAddress);
        });
      });

      describe('Address Validation', () => {
        it('should get address details without memoId', function () {
          const addressDetails = cosmosCoin.getAddressDetails(testData.addresses.noMemoIdAddress);
          addressDetails.address.should.equal(testData.addresses.noMemoIdAddress);
          should.not.exist(addressDetails.memoId);
        });

        it('should get address details with memoId', function () {
          const addressDetails = cosmosCoin.getAddressDetails(testData.addresses.validMemoIdAddress);
          addressDetails.address.should.equal(testData.addresses.validMemoIdAddress.split('?')[0]);
          if (addressDetails.memoId) {
            addressDetails.memoId.should.equal('2');
          } else {
            should.fail('Expected memoId to be defined', null);
          }
        });

        it('should throw on invalid memo id address', () => {
          (() => {
            cosmosCoin.getAddressDetails(testData.addresses.invalidMemoIdAddress);
          }).should.throw();
        });

        it('should throw on multiple memo id address', () => {
          (() => {
            cosmosCoin.getAddressDetails(testData.addresses.multipleMemoIdAddress);
          }).should.throw();
        });

        it('should validate wallet receive address', async function () {
          const receiveAddress = {
            address: `${testData.addresses.address1}?memoId=7`,
            coinSpecific: {
              rootAddress: testData.addresses.address1,
              memoID: '7',
            },
          };
          // as VerifyTransactionOptions
          const isValid = await cosmosCoin.isWalletAddress(receiveAddress as VerifyAddressOptions);
          isValid.should.equal(true);
        });

        it('should validate account addresses correctly', () => {
          should.equal(utils.isValidAddress(testData.addresses.address1), true);
          should.equal(utils.isValidAddress(testData.addresses.address2), true);
          should.equal(utils.isValidAddress('dfjk35y'), false);
          should.equal(utils.isValidAddress(undefined as unknown as string), false);
          should.equal(utils.isValidAddress(''), false);
          should.equal(utils.isValidAddress(testData.addresses.validMemoIdAddress), true);
          should.equal(utils.isValidAddress(testData.addresses.invalidMemoIdAddress), false);
          should.equal(utils.isValidAddress(testData.addresses.multipleMemoIdAddress), false);
        });

        it('should validate validator addresses correctly', () => {
          should.equal(utils.isValidValidatorAddress(testData.addresses.validatorAddress1), true);
          should.equal(utils.isValidValidatorAddress(testData.addresses.validatorAddress2), true);
          should.equal(utils.isValidValidatorAddress('dfjk35y'), false);
          should.equal(utils.isValidValidatorAddress(undefined as unknown as string), false);
          should.equal(utils.isValidValidatorAddress(''), false);
        });
      });

      describe('Verify transaction: ', () => {
        it('should succeed to verify transaction', async function () {
          const txPrebuild = {
            txHex: testTx.signedTxBase64,
            txInfo: {},
          };
          const txParams = {
            recipients: [
              {
                address: testTx.recipient,
                amount: testTx.sendAmount,
              },
            ],
          };
          const verification = {};
          const isTransactionVerified = await cosmosCoin.verifyTransaction({
            txParams,
            txPrebuild,
            verification,
          } as VerifyTransactionOptions);
          isTransactionVerified.should.equal(true);
        });

        it('should succeed to verify sendMany transaction', async function () {
          const txPrebuild = {
            txHex: testTx.signedTxBase64,
            txInfo: {},
          };
          const txParams = {
            recipients: [
              {
                address: testTx.recipient,
                amount: testTx.sendAmount,
              },
            ],
          };
          const verification = {};
          const isTransactionVerified = await cosmosCoin.verifyTransaction({
            txParams,
            txPrebuild,
            verification,
          } as VerifyTransactionOptions);
          isTransactionVerified.should.equal(true);
        });

        it('should fail to verify transaction with invalid param', async function () {
          const txPrebuild = {};
          const txParams = { recipients: undefined };
          await cosmosCoin
            .verifyTransaction({ txParams, txPrebuild } as VerifyTransactionOptions)
            .should.be.rejectedWith('missing required tx prebuild property txHex');
        });
      });

      describe('Explain Transaction: ', () => {
        it('should explain a transfer transaction', async function () {
          const explainedTransaction = await cosmosCoin.explainTransaction({
            txHex: testTx.signedTxBase64,
          });
          explainedTransaction.should.deepEqual({
            displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
            id: testTx.hash,
            outputs: [
              {
                address: testTx.recipient,
                amount: testTx.sendAmount,
              },
            ],
            outputAmount: testTx.sendAmount,
            changeOutputs: [],
            changeAmount: '0',
            fee: { fee: testTx.feeAmount },
            type: 0,
          });
        });

        it('should explain a transfer transaction with memo', async function () {
          const explainedTransaction = await cosmosCoin.explainTransaction({
            txHex: testTxWithMemo.signedTxBase64,
          });
          explainedTransaction.should.deepEqual({
            displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
            id: testTxWithMemo.hash,
            outputs: [
              {
                address: testTxWithMemo.recipient,
                amount: testTxWithMemo.sendAmount,
                memo: testTxWithMemo.memo,
              },
            ],
            outputAmount: testTxWithMemo.sendAmount,
            changeOutputs: [],
            changeAmount: '0',
            fee: { fee: testTxWithMemo.feeAmount },
            type: 0,
          });
        });

        it('should fail to explain transaction with missing params', async function () {
          try {
            await cosmosCoin.explainTransaction({ txHex: '' });
          } catch (error) {
            should.equal(error.message, 'missing required txHex parameter');
          }
        });

        it('should fail to explain transaction with invalid params', async function () {
          try {
            await cosmosCoin.explainTransaction({ txHex: 'randomString' });
          } catch (error) {
            should.equal(error.message.startsWith('Invalid transaction:'), true);
          }
        });
      });

      describe('Parse Transactions: ', () => {
        const transferInputsResponse = {
          address: testTx.recipient,
          amount: new BigNumber(testTx.sendAmount).plus(testTx.feeAmount).toFixed(),
        };

        const transferOutputsResponse = {
          address: testTx.recipient,
          amount: testTx.sendAmount,
        };

        it('should parse a transfer transaction', async function () {
          const parsedTransaction = await cosmosCoin.parseTransaction({ txHex: testTx.signedTxBase64 });

          parsedTransaction.should.deepEqual({
            inputs: [transferInputsResponse],
            outputs: [transferOutputsResponse],
          });
        });

        it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
          const stub = sinon.stub(CosmosSharedCoin.prototype, 'explainTransaction');
          stub.resolves(undefined);
          await cosmosCoin
            .parseTransaction({ txHex: testTx.signedTxBase64 })
            .should.be.rejectedWith('Invalid transaction');
          stub.restore();
        });
      });
    });
  });
});
