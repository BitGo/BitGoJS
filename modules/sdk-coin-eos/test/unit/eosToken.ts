import 'should';

import * as _ from 'lodash';

import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Eos, Teos, EosToken } from '../../src';

describe('EOS Token:', function () {
  let bitgo: TestBitGoAPI;
  let eosTokenCoin;
  let baseCoin;
  const tokenName = 'teos:CHEX';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('eos', Eos.createInstance);
    bitgo.safeRegister('teos', Teos.createInstance);
    EosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    eosTokenCoin = bitgo.coin(tokenName);
    baseCoin = bitgo.coin('teos');
  });

  it('should return constants', function () {
    eosTokenCoin.getChain().should.equal(tokenName);
    eosTokenCoin.getBaseChain().should.equal('teos');
    eosTokenCoin.getBaseFactor().should.equal(1e8);
    eosTokenCoin.getFullName().should.equal('EOS Token');
    eosTokenCoin.coin.should.equal('teos');
    eosTokenCoin.decimalPlaces.should.equal(8);
    eosTokenCoin.tokenContractAddress.should.equal('testtoken113');
  });

  describe('verify transaction', function () {
    let wallet;
    let verification;
    let newTxPrebuild;
    let newTxParams;

    before(function () {
      const walletData = {
        id: '5a78dd561c6258a907f1eeaee132f796',
        users: [
          {
            user: '543c11ed356d00cb7600000b98794503',
            permissions: ['admin', 'view', 'spend'],
          },
        ],
        coin: 'teos',
        label: 'Verification Wallet',
        m: 2,
        n: 3,
        keys: [
          '5a78dd56bfe424aa07aa068651b194fd',
          '5a78dd5674a70eb4079f58797dfe2f5e',
          '5a78dd561c6258a907f1eea9f1d079e2',
        ],
        tags: ['5a78dd561c6258a907f1eeaee132f796'],
        disableTransactionNotifications: false,
        freeze: {},
        deleted: false,
        approvalsRequired: 1,
        isCold: true,
        coinSpecific: {},
        clientFlags: [],
        balance: 650000000,
        confirmedBalance: 650000000,
        spendableBalance: 650000000,
        balanceString: '650000000',
        confirmedBalanceString: '650000000',
        spendableBalanceString: '650000000',
        receiveAddress: {
          id: '5a78de2bbfe424aa07aa131ec03c8dc1',
          address: '78xczhaijyhek2',
          chain: 0,
          index: 0,
          coin: 'teos',
          wallet: '5a78dd561c6258a907f1eeaee132f796',
          coinSpecific: {},
        },
        pendingApprovals: [],
      };
      wallet = new Wallet(bitgo, eosTokenCoin, walletData);
      const userKeychain = {
        prv: '5KJq565HTrgEJG9EbvJH5BLYTgioAyY27dT9am1kCtn2YVAJEYK',
        pub: 'EOS6g7AAMQkhXp8j73E8BD4KRwtQevEsFgYx8htaQkRVhhXJMgkMZ',
      };
      const backupKeychain = {
        prv: '5KZ1nXXCi5yXH8AjCJqjnCYHCVnhQa9YWGV2D14i8g221dxNwLW',
        pub: 'EOS7gyDLNk12faVb1aqNxj1L2DpBerFkhAsxBs95yW3yxJpqvg9Mt',
      };
      const txPrebuild = {
        recipients: [
          {
            address: 'lionteste212',
            amount: '1000',
          },
        ],
        headers: {
          expiration: '2021-10-28T03:56:09.180',
          ref_block_num: 52755,
          ref_block_prefix: 54626512,
        },
        txHex:
          '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840591f7a6113ced08841030000000100408c7a02ea3055000000000085269d0003023432011042980ad29cb1ca000000572d3ccdcd0120ceb8437333427c00000000a8ed32322120ceb8437333427c20825019ab3ca98be803000000000000084348455800000000000000000000000000000000000000000000000000000000000000000000000000',
        transaction: {
          compression: 'none',
          packed_trx:
            '591f7a6113ced08841030000000100408c7a02ea3055000000000085269d0003023432011042980ad29cb1ca000000572d3ccdcd0120ceb8437333427c00000000a8ed32322120ceb8437333427c20825019ab3ca98be80300000000000008434845580000000000',
          signatures: [],
        },
        txid: '0bc7d8026af6710680e0f3e819ff7ddbbb3dff8a740846c76fd47f9386832edc',
        isVotingTransaction: false,
        coin: 'teos',
        token: tokenName,
      };
      verification = {
        disableNetworking: true,
        keychains: {
          user: { pub: userKeychain.pub },
          backup: { pub: backupKeychain.pub },
        },
      };
      const seed = Buffer.from('c3b09c24731be2851b624d9d5b3f60fa129695c24071768d15654bea207b7bb6', 'hex');
      const keyPair = baseCoin.generateKeyPair(seed);
      const txParams = {
        txPrebuild,
        prv: keyPair.prv,
        recipients: [
          {
            address: 'lionteste212',
            amount: '1000',
          },
        ],
      };

      newTxPrebuild = () => {
        return _.cloneDeep(txPrebuild);
      };
      newTxParams = () => {
        return _.cloneDeep(txParams);
      };
    });

    it('should verify token transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await eosTokenCoin.verifyTransaction({ txParams, txPrebuild, wallet, verification });
      validTransaction.should.equal(true);
    });

    it('should throw if expected receive symbol is different than actual receive symbol', async function () {
      const txPrebuild = newTxPrebuild();
      const txParams = newTxParams();
      txParams.txPrebuild = txPrebuild;
      txParams.txPrebuild.token = 'teos:IQ';
      await eosTokenCoin
        .verifyTransaction({ txParams, txPrebuild, wallet, verification })
        .should.be.rejectedWith('txHex receive symbol does not match expected recipient symbol');
    });
  });
});
