//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
// eslint-disable-next-line
/// <reference types="node" />

/**
 * Copied from the test_bitgo.ts in the bitgo module.
 *
 * TODO: extract into shared test-common module and remove duplication
 */

const { BitGo } = require('bitgo');
import { BigNumber } from 'bignumber.js';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import 'should';
import 'should-http';

const nock = require('nock');
nock.enableNetConnect();

try {
  Bluebird.config({
    longStackTraces: true,
  });
} catch (e) {
  console.error('failed to enable long stack traces as a promise has already been created. Is BITGO_USE_PROXY set?');
}

BitGo.TEST_USER = 'tester@bitgo.com';

if (process.env.BITGOJS_TEST_PASSWORD) {
  BitGo.TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD;
} else {
  // Test accounts are locked internally to prevent tampering
  // Contact support@bitgo.com for further help on how to fix this
  throw new Error('Need to set BITGOJS_TEST_PASSWORD env variable - please see the developer setup docs.');
}

BitGo.TEST_SHARED_KEY_USER = 'shared_key_test@bitgo.com';
BitGo.TEST_SHARED_KEY_PASSWORD = BitGo.TEST_PASSWORD;

// used for testing multiple approvers
BitGo.TEST_THIRD_USER = 'third_user_test@bitgo.com';
BitGo.TEST_THIRD_PASSWORD = BitGo.TEST_PASSWORD;

// account with a known total balance. Don't spend or receive coins
// from any wallet in this account. Known total balance across
// all TLTC wallets in this account is exactly 9999586400
BitGo.TEST_KNOWN_BALANCE_USER = 'tyler+test-get-total-balances@bitgo.com';
BitGo.TEST_KNOWN_BALANCE_PASSWORD = BitGo.TEST_PASSWORD;
BitGo.TEST_KNOWN_BALANCE = 9999586400;

BitGo.TEST_ENTERPRISE_CREATION_USER = 'enterprisecreator@bitgo.com';
BitGo.TEST_ENTERPRISE_CREATION_PASSWORD = BitGo.TEST_PASSWORD;

BitGo.OFC_TEST_USER = 'tester+employee@bitgo.com';
BitGo.OFC_TEST_PASSWORD = BitGo.TEST_PASSWORD;

BitGo.TEST_CLIENTID = 'test';
BitGo.TEST_CLIENTSECRET = 'testclientsecret';

// These auth tokens are modified in the db to expire in 2018 on both test & dev
BitGo.TEST_AUTHCODE = '37454416ba13e1be9fdc39cfc207df7f7a7f0953';
BitGo.TEST_ACCESSTOKEN = '4cb440e353b5415e350a1e799bb1ad820fef4ead';
BitGo.TEST_ACCESSTOKEN_SHAREDUSER = '4cb440e353b5415e350a1e799bb1ad820fef4eax';
BitGo.TEST_REFRESHTOKEN = '8519fcc7787d9d6971ed89a757e3309a72ddedc8';

BitGo.TRAVEL_RULE_TXID = '33447753455651508cfd099c9ebe0db6a2243ccba4766319621fbce56db7f135';

BitGo.TEST_WALLET_REGROUP_PASSCODE = 'test security fanout & coalesce';

BitGo.prototype.initializeTestVars = function () {
  if (this.getEnv() === 'dev' || this.getEnv() === 'local') {
    BitGo.TEST_USERID = '54d3e3a4b08fa6dc0a0002c07f8a9f86';
    BitGo.TEST_SHARED_KEY_USERID = '54d418de4ea11d050b0006186d08ea5c';
    BitGo.TEST_THIRD_USERID = '57056ad593eae8ca0c51e3cee62022cb';
    BitGo.TEST_USER_ECDH_XPUB =
      'xpub661MyMwAqRbcF31yYvTH5DbmabEMXVvx1o1p73sZmvEDHM8bhUiZzNQA4gfyDtKarpGz7NPH6Wub8YCqXnUbP8ZMA3Ad8LfwHsBWhWEeJqu';

    BitGo.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.TEST_WALLET1_XPUB =
      'xpub661MyMwAqRbcFgsE3Zg66E8prHy7aohb9wSiZRN9vQA4fp6n1dpXDyRLPT4YnhBTPwkhtDGqR3ynB4tJUenw9WTPhRWwZ3cpqkQrGzXTcFM';
    BitGo.TEST_WALLET1_ADDRESS = '2N1vk5Qm6vGPB8SAZUjEQ8Gac6v71EmxgaG';
    BitGo.TEST_WALLET1_ADDRESS2 = '2MxCHzAYyK9RgLGUWymw9Jhhtt19VqUtCej';
    BitGo.TEST_WALLET2_PASSCODE = 'j0XVTJiTgsMCogKRoHIDzGbz';
    BitGo.TEST_WALLET2_ADDRESS = '2MtZAqJWLBCmtjYQ7WftcXY1fdMjEv8vERZ';
    BitGo.TEST_WALLET3_PASSCODE = 'CVKzHuutdMgtlgFFWpb4oO5k';
    BitGo.TEST_WALLET3_ADDRESS = '2NE4bZSitUxoRLFg4U6qHkjrCXWNAvQBDo5';
    BitGo.TEST_WALLET3_ADDRESS2 = '2NFFt4H2vP54WwWjrUVLh7ksF4t6mabCGsh';
    BitGo.TEST_WALLET3_ADDRESS3 = '2NG8HA7qya4pbwbg25NF1SY6nEjM6apT1hF';

    // webhooks
    BitGo.TEST_WEBHOOK_TRANSACTION_SIMULATION_ID = '57f3ee68a2cece1770402dbe7d84c368';

    // wallet for testing unspents regrouping (fanout & consolidate/coalesce)
    BitGo.TEST_WALLET_REGROUP_ADDRESS = '2MuVshMLfZaXfF6q7af47ZFUtZGGpnyZuLu';

    // v2 variables
    BitGo.V2 = {};
    BitGo.V2.TEST_USERID = '585caccd5573b0a8416a745ed58d8cb4';
    BitGo.V2.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.V2.TEST_WALLET1_XPUB =
      'xpub661MyMwAqRbcGicVM5K5UnocWoFt3Yh1RZKzSEHPPARhyMf9w7DVqM3PgBgiVW5NHRp8UteqhMoQb17rCQsLbmGXuPx43MKskyB31R97p3G';
    BitGo.V2.TEST_WALLET1_ID = '585cc5335573b0a8416aadb1fce63ce3';
    BitGo.V2.OFC_TEST_WALLET_ID = '5cbe3223311315fc7c96ce087f32dbdd';
  } else {
    BitGo.TEST_USERID = '543c11ed356d00cb7600000b98794503';
    BitGo.TEST_SHARED_KEY_USERID = '549d0ee835aec81206004c082757570f';
    BitGo.TEST_THIRD_USERID = '57049b9a194a115a06da21fb9731fb71';
    BitGo.TEST_USER_ECDH_XPUB =
      'xpub661MyMwAqRbcFkiN8QJXCytQqPyDPW1cfnuG6RGCVFnVyiSQL1b6ZS2iiVJHH7UZYwLbN2ayWsaRVhnBFKYvLz956PTRH2SuuurpEcNGLKv';

    BitGo.TEST_WALLET1_PASSCODE = 'test wallet #1 security';
    BitGo.TEST_WALLET1_XPUB =
      'xpub661MyMwAqRbcGU7FnXMKSHMwbWxARxYJUpKD1CoMJP6vonLT9bZZaWYq7A7tKPXmDFFXTKigT7VHMnbtEnjCmxQ1E93ZJe6HDKwxWD28M6f';
    BitGo.TEST_WALLET1_ADDRESS = '2MtepahRn4qTihhTvUuGTYUyUBkQZzaVBG3';
    BitGo.TEST_WALLET1_ADDRESS2 = '2MxKo9RHNZHoPwmvnb5k8ytDJ6Shd1DHnsV';
    BitGo.TEST_WALLET2_PASSCODE = 'test wallet #2 security';
    BitGo.TEST_WALLET2_ADDRESS = '2MvpZhq6zUu3UARdJKZH7TTfqHJ3Ec1YAjv';
    BitGo.TEST_WALLET3_PASSCODE = 'test wallet #3 security';

    // webhooks
    BitGo.TEST_WEBHOOK_TRANSACTION_SIMULATION_ID = '5797f78b651fc971062eb851ea09672d';
    BitGo.TEST_WEBHOOK_PENDING_APPROVAL_SIMULATION_ID = '5824b5075f7944a8069d863dccf25598';

    // shared amongst 3 users (TEST_USER, TEST_SHARED_KEY_USER, and TEST_THIRD_USER)
    BitGo.TEST_WALLETMULTAPPROVERS_ADDRESS = '2NF7pK1pDEUXrWmqXxCT4fjPtQrsK6XNvUy';
    BitGo.TEST_WALLETMULTAPPROVERS_PASSCODE = BitGo.TEST_PASSWORD;

    // TEST_WALLET_3 is a KRS wallet
    BitGo.TEST_WALLET3_ADDRESS = '2MyKoaanySBPCA2Br7dGvaZEgEGp7YRZvif';
    BitGo.TEST_WALLET3_ADDRESS2 = '2N11YQ5mb73CDhupX8peKqb3xFdD9kr78Wf';
    BitGo.TEST_WALLET3_ADDRESS3 = '2N1Tt75MNKFHRBE68HXHB7FSmLpmGCQDuJC';

    BitGo.TEST_ENTERPRISE = '5578ebc76eb47487743b903166e6543a';
    BitGo.TEST_ENTERPRISE_2 = '57057916c03b4a5d0644e2ad94a9e070';
    BitGo.TEST_SHARED_WALLET_ADDRESS = '2MsMfeYWNWYwB3fzfMBfuSZb7jkcGnTjW42';
    BitGo.TEST_SHARED_WALLET_CHANGE_ADDRESS = '2MsUevsM5ncvgrrqUoJ7qYd7Ks9VCN3uhHM';
    BitGo.TEST_WALLET_PENDING_APPROVAL_ID = '56eaf3bdcc4635bb0529843a0dcf860b';
    BitGo.TEST_ENTERPRISE_PENDING_APPROVAL_ID = '5824d5b5acf14ea106e4f2efd588c053';

    // wallet for testing unspents regrouping (fanout & consolidate/coalesce)
    BitGo.TEST_WALLET_REGROUP_ADDRESS = '2MuVshMLfZaXfF6q7af47ZFUtZGGpnyZuLu';

    // v2 variables
    BitGo.V2 = {};
    BitGo.V2.TEST_USERID = '543c11ed356d00cb7600000b98794503';

    BitGo.V2.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.V2.TEST_WALLET1_XPUB =
      'xpub661MyMwAqRbcFWFN9gpFpnSVy6bF3kMZAkSXtu3ZYKPgq2KUVo1xEMnMXDcavwDJ4zH57iUHVfEGVK7dEgo7ufKRzTkeWYSBDuye5g7w4pe';
    BitGo.V2.TEST_WALLET1_ID = '593f1ece99d37c23080a557283edcc89';
    BitGo.V2.TEST_WALLET1_ADDRESS = '2N3qLG4VMpkoRZN4Ft9PC5sgpGKvm7AV32A';

    // this wallet will do consolidate and fannout together, so the number of unspents can be known
    BitGo.V2.TEST_WALLET2_UNSPENTS_LABEL = 'Test Wallet 2 Unspents';
    BitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE = 'NXh65HxeZpzFqzW2n868';
    BitGo.V2.TEST_WALLET2_UNSPENTS_XPUB =
      'xpub661MyMwAqRbcFeeMZtyLiqECMeek7QD6X9NLX2ydBN2DutiBQqLw8nsMnnL9hk3CSWGXZgW1PLV96opu8NzuXwJjK57PuNBqe85jSN6Abm6';
    BitGo.V2.TEST_WALLET2_UNSPENTS_ID = '5a1341e7c8421dc90710673b3166bbd5';

    BitGo.V2.TEST_SWEEP1_LABEL = 'Sweep 1';
    BitGo.V2.TEST_SWEEP1_PASSCODE = 'T8n6S4AzktsDwCqvaE4692895YkjRT';
    BitGo.V2.TEST_SWEEP1_XPUB =
      'xpub661MyMwAqRbcFWJ1ZxzvmKm4QCkrgYQLbTGzLgxzKFcGkyQfCjugENuamFmF3WwLHRvP8zWQi16kU8SuTqyMYFhvJcg1U1w8AT1AHKa25sY';
    BitGo.V2.TEST_SWEEP1_ID = '5a836a7e7cb43ca807371f123ab3a907';
    BitGo.V2.TEST_SWEEP1_ADDRESS = '2N1rGQUpCRV797cSbT3hr34zayyNqS263g9';

    BitGo.V2.TEST_SWEEP2_LABEL = 'Sweep 2';
    BitGo.V2.TEST_SWEEP2_PASSCODE = 'bMY8jrF06pV2dxzRK42dGZqrmmURS7';
    BitGo.V2.TEST_SWEEP2_XPUB =
      'xpub661MyMwAqRbcFhBDq1dbwu51qrNQra923FnujGPxCBaHd2geU6AYZhviMo8jWj3cvwM7Aj2T79CtKqErP37K1vwYSAYgMmFaHiVdJgHJ1nk';
    BitGo.V2.TEST_SWEEP2_ID = '5a836b5e1c0d699a07d42029ccd65836';
    BitGo.V2.TEST_SWEEP2_ADDRESS = '2NGV9ChhafuXNK9iFW6L6CKru5bFkMxZjNX';

    BitGo.V2.TEST_ETH_WALLET_ID = '598f606cd8fc24710d2ebadb1d9459bb';
    BitGo.V2.TEST_ETH_WALLET_PASSPHRASE = 'moon';
    BitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS = '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e';

    BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_USER = 'update_pw_tester@bitgo.com';
    BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD = BitGo.TEST_PASSWORD;

    // Contract address for Potatoken
    BitGo.V2.TEST_ERC20_TOKEN_ADDRESS = '0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de';
    BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT = '0x52c8B29Ab8B0a49a01c2b75f8e7f11B23e0e3782';

    BitGo.V2.TEST_RECOVERY_PASSCODE = 'oPXkPN5Q0c8i44i0';

    // webhooks
    BitGo.V2.TEST_WEBHOOK_TRANSFER_SIMULATION_ID = '59b7041619dd52cd0737a4cbf39dbd44';

    BitGo.V2.OFC_TEST_WALLET_ID = '5cbe3563afc275b40369e096073b8a16';
  }

  BitGo.TEST_FEE_SINGLE_KEY_WIF = 'cRVQ6cbUyGHVvByPKF9GnEhaB4HUBFgLQ2jVX1kbQARHaTaD7WJ2';
  BitGo.TEST_FEE_SINGLE_KEY_ADDRESS = 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7';
};

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.testUserOTP = function () {
  return '0000000';
};

//
// authenticateTestUser
// Authenticate the test user.
//
BitGo.prototype.authenticateTestUser = function (otp, callback) {
  return co(function* () {
    const response = yield this.authenticate({ username: BitGo.TEST_USER, password: BitGo.TEST_PASSWORD, otp: otp });
    response.should.have.property('access_token');
    response.should.have.property('user');
  })
    .call(this)
    .asCallback(callback);
};

BitGo.prototype.checkFunded = co(function* checkFunded() {
  // We are testing both BTC and ETH funds here, to make sure that
  // we don't spend for already 'failed' test runs (e.g., spending ETH when we don't have enough BTC)

  // Test we have enough ETH
  yield this.authenticateTestUser(this.testUserOTP());
  const testWalletId = BitGo.V2.TEST_ETH_WALLET_ID;

  const { tethWallet, tbtcWallet, unspentWallet, sweep1Wallet } = yield Bluebird.props({
    tethWallet: this.coin('teth').wallets().get({ id: testWalletId }),
    tbtcWallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET1_ID }),
    unspentWallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET2_UNSPENTS_ID }),
    sweep1Wallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_SWEEP1_ID }),
  });

  const spendableBalance = tethWallet.spendableBalanceString;

  let balance = new BigNumber(spendableBalance);

  // Check our balance is over 60000 (we spend 50000, add some cushion)
  if (balance.lt(60000)) {
    throw new Error(
      `The TETH wallet ${testWalletId} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`
    );
  }

  // Check we have enough in the wallet to run test suite
  tbtcWallet.should.have.property('spendableBalanceString');
  balance = new BigNumber(tbtcWallet.spendableBalanceString());

  // Check our balance is over 0.05 tBTC (we spend 0.04, add some cushion)
  let minimumBalance = 0.05 * 1e8;
  if (balance.lt(minimumBalance)) {
    throw new Error(
      `The TBTC wallet ${tbtcWallet.id()} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`
    );
  }

  // Check we have enough in the wallet to run test suite
  unspentWallet.should.have.property('spendableBalanceString');
  balance = new BigNumber(unspentWallet.spendableBalanceString());

  // Check our balance is over 0.05 tBTC (we spend 0.04, add some cushion)
  minimumBalance = 0.05 * 1e8;
  if (balance.lt(minimumBalance)) {
    throw new Error(
      `The TBTC wallet ${unspentWallet.id()} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`
    );
  }

  // Check we have enough in the wallet to run test suite
  sweep1Wallet.should.have.property('spendableBalanceString');
  balance = new BigNumber(sweep1Wallet.spendableBalanceString());

  // Since we will lose our unspents value to fees, make sure there is a large enough balance to continue
  minimumBalance = 0.05 * 1e8;

  if (balance.lt(minimumBalance)) {
    throw new Error(
      `The TBTC wallet ${sweep1Wallet.id()} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`
    );
  }
});

const oldFetchConstants = BitGo.prototype.fetchConstants;
BitGo.prototype.fetchConstants = function () {
  nock(this._baseUrl).get('/api/v1/client/constants').reply(200, { ttl: 3600, constants: {} });

  // force client constants reload
  BitGo.prototype._constants = undefined;

  return oldFetchConstants.apply(this, arguments);
};

module.exports = BitGo;
