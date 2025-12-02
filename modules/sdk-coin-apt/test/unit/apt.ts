import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Apt, AptToken, Tapt, TransferTransaction } from '../../src';
import * as testData from '../resources/apt';
import _ from 'lodash';
import sinon from 'sinon';
import assert from 'assert';
import {
  AccountAddress,
  AccountAuthenticatorEd25519,
  Aptos,
  APTOS_COIN,
  AptosConfig,
  Ed25519PublicKey,
  Ed25519Signature,
  generateUserTransactionHash,
  Network,
} from '@aptos-labs/ts-sdk';
import utils from '../../src/lib/utils';
import { AptCoin, coins, GasTankAccountCoin } from '@bitgo/statics';
import { DelegationPoolAddStakeTransaction } from '../../src/lib/transaction/delegationPoolAddStakeTransaction';

describe('APT:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;
  let newTxPrebuild;
  let newTxParams;

  const txPreBuild = {
    txHex: testData.TRANSACTION_USING_TRANSFER_COINS,
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
  };

  const batchFungibleTxPrebuild = {
    txHex: testData.FUNGIBLE_BATCH_RAW_TX_HEX,
    txInfo: {},
  };

  const batchFungibleTxParams = {
    recipients: testData.batchFungibleRecipients,
    type: 'transfer',
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('apt', Apt.createInstance);
    bitgo.safeRegister('tapt', Tapt.createInstance);
    bitgo.safeRegister('apt:usdt', AptToken.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tapt');
    newTxPrebuild = () => {
      return _.cloneDeep(txPreBuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
  });

  it('should return the right info', function () {
    const apt = bitgo.coin('apt');
    const tapt = bitgo.coin('tapt');
    const aptUsdt = bitgo.coin('apt:usdt');
    const aptStatics = coins.get('apt') as GasTankAccountCoin;
    const taptStatics = coins.get('tapt') as GasTankAccountCoin;

    apt.getChain().should.equal('apt');
    apt.getFamily().should.equal('apt');
    apt.getFullName().should.equal('Aptos');
    apt.getBaseFactor().should.equal(1e8);

    tapt.getChain().should.equal('tapt');
    tapt.getFamily().should.equal('apt');
    tapt.getFullName().should.equal('Testnet Aptos');
    tapt.getBaseFactor().should.equal(1e8);

    aptStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    taptStatics.gasTankLowBalanceAlertFactor.should.equal(80);
    aptStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);
    taptStatics.gasTankMinBalanceRecommendationFactor.should.equal(200);

    aptUsdt.getFamily().should.equal('apt');
    aptUsdt.getChain().should.equal('apt');
    const aptUsdtStatics = aptUsdt.getConfig() as AptCoin;
    aptUsdtStatics.fullName.should.equal('USD Tether');
    aptUsdtStatics.assetId.should.equal('0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b');
    aptUsdtStatics.decimalPlaces.should.equal(6);
  });

  it('is valid pub', function () {
    // with 0x prefix
    basecoin.isValidPub('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(false);
    // without 0x prefix
    basecoin.isValidPub('9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07').should.equal(true);
  });

  describe('Verify transaction: ', () => {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({ txParams, txPrebuild, verification });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify fungible transaction', async function () {
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txPrebuild: batchFungibleTxPrebuild,
        txParams: batchFungibleTxParams,
        verification,
      });
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
        address: testData.sender2.address,
        amount: testData.AMOUNT.toString(),
      },
    ];

    const transferOutputsResponse = [
      {
        address: testData.recipients[0].address,
        amount: testData.recipients[0].amount,
      },
    ];

    const transferFungibleInputResponse = [
      {
        address: testData.fungibleSender.address,
        amount: testData.FUNGIBLE_TOKEN_AMOUNT.toString(),
      },
    ];

    const tranferFungibleOutputResponse = [
      {
        address: testData.fungibleTokenRecipients[1].address,
        amount: testData.fungibleTokenRecipients[1].amount,
      },
    ];

    it('should parse a transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txHex: testData.TRANSACTION_USING_TRANSFER_COINS,
      });

      parsedTransaction.should.deepEqual({
        inputs: transferInputsResponse,
        outputs: transferOutputsResponse,
      });
    });

    it('should parse signed fungible transaction, only work if amount parsing correctly done from payload', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txHex: testData.FUNGIBLE_SERIALIZED_TX_HEX,
      });

      parsedTransaction.should.deepEqual({
        inputs: transferFungibleInputResponse,
        outputs: tranferFungibleOutputResponse,
      });
    });

    it('should explain a transfer transaction', async function () {
      const rawTx = newTxPrebuild().txHex;
      const transaction = new TransferTransaction(coins.get('tapt'));
      transaction.fromRawTransaction(rawTx);
      const explainedTx = transaction.explainTransaction();
      console.log(explainedTx);
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
        id: '0x249289a8178e4b9cdb89fad6e8e436ccc435753e4ea3c9d50e0c8b525582e90d',
        outputs: [
          {
            address: '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9',
            amount: '1000',
          },
        ],
        outputAmount: '1000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '0' },
        sender: '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a372449',
        type: 0,
      });
    });

    it('should explain a staking delegate transaction', async function () {
      const rawTx = testData.DELEGATION_POOL_ADD_STAKE_TX_HEX;
      const transaction = new DelegationPoolAddStakeTransaction(coins.get('tapt'));
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
        id: '0xc5b960d1bec149c77896344774352c61441307af564eaa8c84f857208e411bf3',
        outputs: [
          {
            address: '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9',
            amount: '1000',
          },
        ],
        outputAmount: '1000',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '0' },
        sender: '0x1aed808916ab9b1b30b07abb53561afd46847285ce28651221d406173a372449',
        type: 30,
      });
    });

    it('should fail to explain a invalid raw transaction', async function () {
      const rawTx = 'invalidRawTransaction';
      const transaction = new TransferTransaction(coins.get('tapt'));
      await assert.rejects(async () => transaction.fromRawTransaction(rawTx), {
        message: 'invalid raw transaction',
      });
    });

    it('should fail to parse a transfer transaction when explainTransaction response is undefined', async function () {
      const stub = sinon.stub(Apt.prototype, 'explainTransaction');
      stub.resolves(undefined);
      await basecoin.parseTransaction({ txHex: testData.TRANSFER }).should.be.rejectedWith('Invalid transaction');
      stub.restore();
    });
  });

  describe('Address Validation', () => {
    // Real test data from tapt wallet 692f53f35a6e3f25a18c4eb8af016fdd
    const testData = {
      commonKeychain:
        '6a724c11eafea4209704c35e6ee3e1fba80d2a40860d873bbe5981de636c9cf6ade77e6fdd4388889ee93d7eaa737ab584edb57cc0cc15b2899380348d6e482c',
      rootAddress: '0x0598b31aa77176dbaba25306404aa8131218068df58bf0b7eec13f57053fd5a7',
      receiveAddress: '0xdc169725dd6d9a07ee255b17087b4079e8a80850c895c65b62c0ef6de740d37a',
      receiveAddressIndex: 1,
    };

    const keychains = [
      { commonKeychain: testData.commonKeychain },
      { commonKeychain: testData.commonKeychain },
      { commonKeychain: testData.commonKeychain },
    ];

    it('should return true when validating a well formatted address prefixed with 0x', async function () {
      const address = '0xf941ae3cbe5645dccc15da8346b533f7f91f202089a5521653c062b2ff10b304';
      basecoin.isValidAddress(address).should.equal(true);
    });

    it('should return false when validating an old address', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should return false when validating an incorrectly formatted', async function () {
      const address = 'wrongaddress';
      basecoin.isValidAddress(address).should.equal(false);
    });

    it('should verify a valid receive address', async function () {
      const params = {
        address: testData.receiveAddress,
        rootAddress: testData.rootAddress,
        keychains,
        index: testData.receiveAddressIndex,
      };

      const result = await basecoin.isWalletAddress(params);
      result.should.equal(true);
    });

    it('should throw error for isWalletAddress when keychains is missing', async function () {
      const address = '0x2959bfc3fdb7dc23fed8deba2fafb70f3e606a59';
      const index = 0;

      const params = { commonKeychain: testData.commonKeychain, address, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params));
    });

    it('should throw error for isWalletAddress when new address is invalid', async function () {
      const wrongAddress = 'badAddress';
      const index = 0;

      const params = { commonKeychain: testData.commonKeychain, address: wrongAddress, index };
      await assert.rejects(async () => basecoin.isWalletAddress(params), {
        message: `invalid address: ${wrongAddress}`,
      });
    });
  });

  describe('ID Validation', () => {
    it('check id', async function () {
      const network: Network = Network.TESTNET;
      const aptos = new Aptos(new AptosConfig({ network }));
      const senderAddress = AccountAddress.fromString(
        '0xc8f02d25aa698b3e9fbd8a08e8da4c8ee261832a25a4cde8731b5ec356537d09'
      );
      const recipientAddress = AccountAddress.fromString(
        '0xf7405c28a02cf5bab4ea4498240bb3579db45951794eb1c843bef0534c093ad9'
      );

      const transaction = await aptos.transaction.build.simple({
        sender: senderAddress,
        data: {
          function: '0x1::coin::transfer',
          typeArguments: [APTOS_COIN],
          functionArguments: [recipientAddress, 1000],
        },
        options: {
          maxGasAmount: 200000,
          gasUnitPrice: 100,
          expireTimestamp: 1732699236,
          accountSequenceNumber: 14,
        },
      });

      const DEFAULT_PUBLIC_KEY = Buffer.alloc(32);
      const DEFAULT_SIGNATURE = Buffer.alloc(64);
      const publicKey = new Ed25519PublicKey(utils.getBufferFromHexString(DEFAULT_PUBLIC_KEY.toString('hex')));
      const signature = new Ed25519Signature(DEFAULT_SIGNATURE);
      const senderAuthenticator = new AccountAuthenticatorEd25519(publicKey, signature);
      const id = generateUserTransactionHash({ transaction, senderAuthenticator });

      id.should.equal('0x923d1cfed3afac24048451160337db75ba282912157ee43407b572923801d5ba');
    });
  });
});
