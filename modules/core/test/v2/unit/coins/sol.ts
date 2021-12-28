import { Sol, Tsol } from '../../../../src/v2/coins/';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as testData from '../../fixtures/coins/sol';
import * as should from 'should';
import * as resources from '@bitgo/account-lib/test/resources/sol/sol';
import * as _ from 'lodash';

describe('SOL:', function () {
  let bitgo;
  let basecoin;
  let keyPair;
  let newTxPrebuild;
  let newTxParams;
  let newTxParamsWithError;
  const badAddresses = resources.addresses.invalidAddresses;
  const goodAddresses = resources.addresses.validAddresses;

  const keypair = {
    pub: resources.accountWithSeed.publicKey,
    prv: resources.accountWithSeed.privateKey.base58,
  };
  const txPrebuild = {
    recipients: [
      {
        address: 'lionteste212',
        amount: '1000',
      },
    ],
    txBase64: resources.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
    transaction: {
      compression: 'none',
      packed_trx:
          '1e0c7a61a3a7b5e7c4470000000100408c7a02ea3055000000000085269d00030233330100a6823403ea3055000000572d3ccdcd0120ceb8437333427c00000000a8ed32322220ceb8437333427c20825019ab3ca98be80300000000000004454f5300000000013100',
      signatures: [],
    },
    txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
    isVotingTransaction: false,
    coin: 'tsol',
  };
  const txParams = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const memo = 'test memo';
  const feePayer = '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe';
  const blockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const errorBlockhash = 'GHtXQBsoZHVnNFa9YzFr17DJjgHXk3ycTKD5xD3Zi';
  const durableNonce = {
    walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe'
  };
  const errorDurableNonce = {
    walletNonceAddress: '8YM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe'
  };
  const txParamsWithError = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42mMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const errorMemo = 'different memo';
  const errorFeePayer = '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe';
  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol');
    keyPair = basecoin.generateKeyPair(resources.accountWithSeed.seed);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
    newTxParamsWithError = () => {
      return _.cloneDeep(txParamsWithError);
    };
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);
  });

  it('should retun the right info', function() {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Sol');
    basecoin.getBaseFactor().should.equal(1000000000);
  });
  describe('verify transactions', () => {
    it('should verify transactions', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({ txParams, txPrebuild, memo, feePayer, blockhash, durableNonce });
      validTransaction.should.equal(true);
    });
    it('should fail verify transactions when have different memo', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, errorMemo, errorFeePayer }).should.be.rejectedWith('Tx memo does not match with expected txParams recipient memo');
    });
    it('should fail verify transactions when have different durableNonce', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, feePayer, blockhash, errorDurableNonce }).should.be.rejectedWith('Tx durableNonce does not match with param durableNonce');
    });
    it('should fail verify transactions when have different feePayer', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, errorFeePayer }).should.be.rejectedWith('Tx fee payer does not match with txParams fee payer');
    });
    it('should fail verify transactions when have different blockhash', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, feePayer, errorBlockhash }).should.be.rejectedWith('Tx blockhash does not match with param blockhash');
    });
    it('should fail verify transactions when have different recipients', async function () {
      const txParams = newTxParamsWithError();
      const txPrebuild = newTxPrebuild();
      await basecoin.verifyTransaction({ txParams, txPrebuild, memo, errorFeePayer }).should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });
  });


  it('should verify valid address', (function () {
    const params = { address: goodAddresses[0] };
    basecoin.verifyAddress(params).should.equal(true);
  }));

  it('should check invalid address', (function () {
    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
  }));

  it('should check valid pub keys', (function () {
    keyPair.should.have.property('pub');
    basecoin.isValidPub(keyPair.pub).should.equal(true);
  }));

  it('should check an invalid pub keys', (function () {
    const badPubKey = keyPair.pub.slice(0, keyPair.pub.length - 1) + '-';
    basecoin.isValidPub(badPubKey).should.equal(false);
  }));

  it('should check valid prv keys', (function () {
    keyPair.should.have.property('prv');
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  }));

  it('should check an invalid prv keys', (function () {
    const badPrvKey = keyPair.prv ? keyPair.prv.slice(0, keyPair.prv.length - 1) + '-' : undefined;
    basecoin.isValidPrv(badPrvKey).should.equal(false);
  }));

  describe('Parse Transactions:', () => {
    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: 305000,
        }],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: 305000,
        }],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
          amount: 310000,
        }],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [{
          address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
          amount: 310000,
        }],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain a signed transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
      });
    });

    it('should explain an unsigned wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });

    it('should explain a signed wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      });
      signed.txBase64.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should throw invalid transaction when sign with public key', async function () {
      await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.publicKey,
      }).should.be.rejectedWith('Invalid key');
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(
        keypair,
        'signed message',
      );
      signed.toString('base64').should.equal('s+7d/8aW/twfM/0wLSKOGxd9+LhDIiz/g0FfJ39ylJhQIkjK0RYPm/Y+gdeJ5DIy6K6h6gCXXESDomlv12DBBQ==');
    });
    it('shouldnt sign message when message is undefined', async function () {
      await basecoin.signMessage(
        keypair,
      ).should.be.rejectedWith('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined');
    });
  });

});
