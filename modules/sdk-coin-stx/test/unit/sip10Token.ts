import _ from 'lodash';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { ITransactionRecipient, Wallet } from '@bitgo/sdk-core';

import { Sip10Token } from '../../src';
import * as testData from '../fixtures';

describe('Sip10Token:', function () {
  const sip10TokenName = 'tstx:tsip6dp';
  let bitgo: TestBitGoAPI;
  let basecoin: Sip10Token;
  let newTxPrebuild: () => { txHex: string; txInfo: Record<string, unknown> };
  let newTxParams: () => { recipients: ITransactionRecipient[] };
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
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        verification,
        wallet,
        memo,
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
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParamsWithNumberAmounts,
        txPrebuild,
        verification,
        wallet,
        memo,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is passed', async function () {
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithMemoId10;
      const txParams = newTxParams();
      const verification = {};
      const memo = {
        type: '',
        value: '10',
      };
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
        memo,
      });
      isTransactionVerified.should.equal(true);
    });

    it('should succeed to verify when memo is zero', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txPrebuild.txHex = testData.txForExplainFungibleTokenTransferWithMemoZero;
      const memo = {
        type: '',
        value: '0',
      };
      const verification = {};
      const isTransactionVerified = await basecoin.verifyTransaction({
        txParams: txParams,
        txPrebuild,
        verification,
        wallet,
        memo,
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
});
