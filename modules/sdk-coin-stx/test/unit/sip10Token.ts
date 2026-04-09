import _ from 'lodash';
import nock from 'nock';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { ITransactionRecipient, Wallet, Memo } from '@bitgo/sdk-core';

import { Sip10Token } from '../../src';
import * as testData from '../fixtures';
import { RecoveryInfo, RecoveryOptions, RecoveryTransaction } from '../../src/lib/iface';
import assert from 'assert';

describe('Sip10Token:', function () {
  const sip10TokenName = 'tstx:tsip6dp';
  let bitgo: TestBitGoAPI;
  let basecoin: Sip10Token;
  let newTxPrebuild: () => { txHex: string; txInfo: Record<string, unknown> };
  let newTxParams: () => { recipients: ITransactionRecipient[]; memo?: Memo };
  let wallet: Wallet;

  const txPreBuild = {
    txHex: testData.txForExplainFungibleTokenTransfer,
    txInfo: {},
  };

  const txParams = {
    recipients: testData.recipients,
  };

  const memo = {
    type: '',
    value: '1',
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    Sip10Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    newTxPrebuild = () => {
      return _.cloneDeep(txPreBuild);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
    basecoin = bitgo.coin(sip10TokenName) as Sip10Token;
    wallet = new Wallet(bitgo, basecoin, {});
  });

  describe('Verify Transaction', function () {
    it('should succeed to verify transaction', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.memo = memo;
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify transaction when recipients amount are numbers', async function () {
      const txPrebuild = newTxPrebuild();
      const txParamsWithNumberAmounts = newTxParams();
      txParamsWithNumberAmounts.recipients = txParamsWithNumberAmounts.recipients.map(
        ({ address, amount, memo, tokenName }) => {
          return { address, amount: Number(amount), memo, tokenName };
        }
      );
      txParamsWithNumberAmounts.memo = memo;

      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParamsWithNumberAmounts,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is passed', async function () {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithMemoId10;
      const txParams = newTxParams();
      const verification = {};
      txParams.memo = {
        type: '',
        value: '10',
      };
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is zero', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithMemoZero;
      txParams.memo = {
        type: '',
        value: '0',
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is passed inside recipient address', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = 'SN2NN1JP9AEP5BVE19RNJ6T2MP7NDGRZYST1VDF3M?memoId=10';
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithMemoId10;
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is not passed', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithoutMemo;
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should fail to verify transaction with no recipients', async function () {
      const txPrebuild = {};
      const txParams = newTxParams();
      txParams.recipients = [];
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet,
        })
        .should.rejectedWith('missing required tx prebuild property txHex');
    });

    it('should fail when more than 1 recipients are passed', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients.push({
        address: 'SN2NN1JP9AEP5BVE19RNJ6T2MP7NDGRZYST1VDF3N',
        amount: '10000',
        memo: '1',
        tokenName: 'tsip6dp-token',
      });
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet,
        })
        .should.rejectedWith(
          "tstx:tsip6dp doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient."
        );
    });

    it('should fail to verify transaction with wrong address', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].address = 'SN2NN1JP9AEP5BVE19RNJ6T2MP7NDGRZYST1VDF3N';
      const verification = {};
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          verification,
          wallet,
        })
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify transaction with wrong amount', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].amount = '100';
      const verification = {};
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          verification,
          wallet,
        })
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify transaction with wrong memo', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].memo = '2';
      const verification = {};
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          verification,
          wallet,
        })
        .should.rejectedWith('Tx memo does not match with expected txParams recipient memo');
    });

    it('should fail to verify transaction with wrong token', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.recipients[0].tokenName = 'tstx:tsip8dp';
      const verification = {};
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          verification,
          wallet,
        })
        .should.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });
  });

  describe('Recover Transaction SIP10', () => {
    before(function () {
      nock.enableNetConnect();
    });
    beforeEach(function () {
      nock.cleanAll();
    });
    after(function () {
      nock.disableNetConnect();
    });

    it('should build a signed token recover transaction when private key data is passed', async () => {
      const rootAddress = testData.HOT_WALLET_ROOT_ADDRESS;
      nock(`https://api.testnet.hiro.so`)
        .get(`/extended/v2/addresses/${rootAddress}/balances/stx`)
        .reply(200, testData.ACCOUNT_BALANCE_RESPONSE);
      nock('https://api.testnet.hiro.so')
        .get(`/extended/v2/addresses/${rootAddress}/balances/ft/${testData.STX_TOKEN_ASSET_ID}`)
        .reply(200, testData.TOKEN_BALANCE_RESPONSE);
      nock(`https://api.testnet.hiro.so`)
        .get(`/extended/v1/address/${rootAddress}/nonces`)
        .reply(200, testData.ACCOUNT_NONCE_RESPONSE);
      nock(`https://api.testnet.hiro.so`, { allowUnmocked: true })
        .post(`/v2/fees/transaction`, testData.FEE_ESTIMATION_TOKEN_REQUEST)
        .reply(200, testData.FEE_ESTIMATION_TOKEN_RESPONSE);

      const recoveryOptions: RecoveryOptions = {
        backupKey: testData.HOT_WALLET_KEY_CARD_INFO.BACKUP_KEY,
        userKey: testData.HOT_WALLET_KEY_CARD_INFO.USER_KEY,
        rootAddress: rootAddress,
        recoveryDestination: testData.DESTINATION_ADDRESS_WRW,
        bitgoKey: testData.HOT_WALLET_KEY_CARD_INFO.BITGO_PUB_KEY,
        walletPassphrase: testData.HOT_WALLET_KEY_CARD_INFO.WALLET_PASSPHRASE,
        contractId: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip6dp-token',
      };
      const response: RecoveryTransaction = await basecoin.recover(recoveryOptions);
      response.should.have.property('txHex');
      assert.deepEqual(response.txHex, testData.HOT_WALLET_TOKEN_RECOVERY_TX_HEX, 'tx hex not matching!');
    });

    it('should build an unsigned token transaction when public keys are passed', async () => {
      const rootAddress = testData.COLD_WALLET_ROOT_ADDRESS;
      nock(`https://api.testnet.hiro.so`)
        .get(`/extended/v2/addresses/${rootAddress}/balances/stx`)
        .reply(200, testData.ACCOUNT_BALANCE_RESPONSE);
      nock('https://api.testnet.hiro.so')
        .get(`/extended/v2/addresses/${rootAddress}/balances/ft/${testData.STX_TOKEN_ASSET_ID}`)
        .reply(200, testData.TOKEN_BALANCE_RESPONSE);
      nock(`https://api.testnet.hiro.so`, { allowUnmocked: true })
        .get(`/extended/v1/address/${rootAddress}/nonces`)
        .reply(200, testData.ACCOUNT_NONCE_RESPONSE);
      const feeEstimateRequest = testData.FEE_ESTIMATION_TOKEN_REQUEST;
      feeEstimateRequest.transaction_payload =
        '021a1500a1c42f0c11bfe3893f479af18904677685be0d747369703664702d746f6b656e087472616e73666572000000040100000000000000000000000005f5e10005159f2f1aff6fa0062e1f7fa6096133e75f47a7e8f7051a1500a1c42f0c11bfe3893f479af18904677685be09';
      nock(`https://api.testnet.hiro.so`)
        .post(`/v2/fees/transaction`, feeEstimateRequest)
        .reply(200, testData.FEE_ESTIMATION_TOKEN_RESPONSE);

      const recoveryOptions: RecoveryOptions = {
        backupKey: testData.COLD_WALLET_PUBLIC_KEY_INFO.BACKUP_KEY,
        userKey: testData.COLD_WALLET_PUBLIC_KEY_INFO.USER_KEY,
        rootAddress: rootAddress,
        recoveryDestination: testData.DESTINATION_ADDRESS_WRW,
        bitgoKey: testData.COLD_WALLET_PUBLIC_KEY_INFO.BITGO_PUB_KEY,
        contractId: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip6dp-token',
      };
      const response: RecoveryInfo = (await basecoin.recover(recoveryOptions)) as RecoveryInfo;
      response.should.have.property('txHex');
      response.should.have.property('coin');
      response.should.have.property('feeInfo');
      assert.deepEqual(response.txHex, testData.COLD_WALLET_TOKEN_UNSIGNED_SWEEP_TX_HEX, 'tx hex not matching!');
      assert.deepEqual(response.coin, 'tstx:tsip6dp', 'coin not matching!');
    });

    it('should fail with insufficient balance when native stx balance is lower than fee for sip10', async () => {
      const rootAddress = testData.HOT_WALLET_ROOT_ADDRESS;
      const accountBalance = JSON.parse(JSON.stringify(testData.ACCOUNT_BALANCE_RESPONSE));
      accountBalance.balance = '100'; // set balance lower than fee
      nock(`https://api.testnet.hiro.so`)
        .get(`/extended/v2/addresses/${rootAddress}/balances/stx`)
        .reply(200, accountBalance);
      nock('https://api.testnet.hiro.so')
        .get(`/extended/v2/addresses/${rootAddress}/balances/ft/${testData.STX_TOKEN_ASSET_ID}`)
        .reply(200, testData.TOKEN_BALANCE_RESPONSE);
      nock(`https://api.testnet.hiro.so`)
        .get(`/extended/v1/address/${rootAddress}/nonces`)
        .reply(200, testData.ACCOUNT_NONCE_RESPONSE);
      const feeRequestBody = testData.FEE_ESTIMATION_TOKEN_REQUEST;
      feeRequestBody.transaction_payload =
        '021a1500a1c42f0c11bfe3893f479af18904677685be0d747369703664702d746f6b656e087472616e73666572000000040100000000000000000000000005f5e100051549857eb4b6dd4fee08c3ec04e3d0ed04ef67d324051a1500a1c42f0c11bfe3893f479af18904677685be09';
      nock(`https://api.testnet.hiro.so`, { allowUnmocked: true })
        .post(`/v2/fees/transaction`, feeRequestBody)
        .reply(200, testData.FEE_ESTIMATION_TOKEN_RESPONSE);
      const recoveryOptions: RecoveryOptions = {
        backupKey: testData.HOT_WALLET_KEY_CARD_INFO.BACKUP_KEY,
        userKey: testData.HOT_WALLET_KEY_CARD_INFO.USER_KEY,
        rootAddress: rootAddress,
        recoveryDestination: testData.DESTINATION_ADDRESS_WRW,
        bitgoKey: testData.HOT_WALLET_KEY_CARD_INFO.BITGO_PUB_KEY,
        walletPassphrase: testData.HOT_WALLET_KEY_CARD_INFO.WALLET_PASSPHRASE,
        contractId: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH.tsip6dp-token',
      };
      await basecoin.recover(recoveryOptions).should.rejectedWith('insufficient balance to build the transaction');
    });

    it('should fail when only contract address is passed', async () => {
      const recoveryOptions: RecoveryOptions = {
        backupKey: testData.HOT_WALLET_KEY_CARD_INFO.BACKUP_KEY,
        userKey: testData.HOT_WALLET_KEY_CARD_INFO.USER_KEY,
        rootAddress: testData.HOT_WALLET_ROOT_ADDRESS,
        recoveryDestination: testData.DESTINATION_ADDRESS_WRW,
        bitgoKey: testData.HOT_WALLET_KEY_CARD_INFO.BITGO_PUB_KEY,
        walletPassphrase: testData.HOT_WALLET_KEY_CARD_INFO.WALLET_PASSPHRASE,
        contractId: 'STAG18E45W613FZ3H4ZMF6QHH426EXM5QTSAVWYH',
      };
      await basecoin
        .recover(recoveryOptions)
        .should.rejectedWith('invalid contract id, please provide it in the form (contractAddress.contractName)');
    });
  });
});
