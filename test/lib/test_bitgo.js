//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGo = require('../../src/bitgo.js');
const expressApp = require('../../src/expressApp');
const BigNumber = require('bignumber.js');
const request = require('supertest-as-promised');
const Promise = require('bluebird');
const co = Promise.coroutine;

BitGo.TEST_USER = 'tester@bitgo.com';

if (process.env.BITGOJS_TEST_PASSWORD) {
  BitGo.TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD;
} else {
  // Test accounts are locked internally to prevent tampering
  // Contact bencxr@fragnetics.com benchan for further help on how to fix this
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

BitGo.TEST_CLIENTID = 'test';
BitGo.TEST_CLIENTSECRET = 'testclientsecret';

// These auth tokens are modified in the db to expire in 2018 on both test & dev
BitGo.TEST_AUTHCODE = '37454416ba13e1be9fdc39cfc207df7f7a7f0953';
BitGo.TEST_ACCESSTOKEN = '4cb440e353b5415e350a1e799bb1ad820fef4ead';
BitGo.TEST_ACCESSTOKEN_SHAREDUSER = '4cb440e353b5415e350a1e799bb1ad820fef4eax';
BitGo.TEST_REFRESHTOKEN = '8519fcc7787d9d6971ed89a757e3309a72ddedc8';

BitGo.TRAVEL_RULE_TXID = '33447753455651508cfd099c9ebe0db6a2243ccba4766319621fbce56db7f135';

BitGo.TEST_WALLET_REGROUP_PASSCODE = 'test security fanout & coalesce';

BitGo.prototype.initializeTestVars = function() {
  this._promise.config({
    longStackTraces: true
  });
  if (this.getEnv() === 'dev' || this.getEnv() === 'local') {
    BitGo.TEST_USERID = '54d3e3a4b08fa6dc0a0002c07f8a9f86';
    BitGo.TEST_SHARED_KEY_USERID = '54d418de4ea11d050b0006186d08ea5c';
    BitGo.TEST_THIRD_USERID = '57056ad593eae8ca0c51e3cee62022cb';
    BitGo.TEST_USER_ECDH_XPUB = 'xpub661MyMwAqRbcF31yYvTH5DbmabEMXVvx1o1p73sZmvEDHM8bhUiZzNQA4gfyDtKarpGz7NPH6Wub8YCqXnUbP8ZMA3Ad8LfwHsBWhWEeJqu';

    BitGo.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcFgsE3Zg66E8prHy7aohb9wSiZRN9vQA4fp6n1dpXDyRLPT4YnhBTPwkhtDGqR3ynB4tJUenw9WTPhRWwZ3cpqkQrGzXTcFM';
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

    // wallet addresses
    BitGo.TEST_ETH_WALLET1_ADDRESS = '0x2a45d946acb0534ed9a06723f505c0fc09a87fd8';
    BitGo.TEST_ETH_WALLET2_ADDRESS = '0xdbdc12ca37f3e65c420cfa172885c2ecc6c8bc6b';

    // labeled addresses (not directly used)
    BitGo.TEST_ETH_WALLET1_ADDRESS2 = '0xeab1cac0d744e99289c1798c280961172e63b508';
    BitGo.TEST_ETH_WALLET3_ADDRESS = '0xe59dfe5c67114b39a5662cc856be536c614124c0';

    // wallet xpubs
    BitGo.TEST_ETH_WALLET1_XPUB = 'xpub661MyMwAqRbcEx4BzQcLh7JREVXCxNMXkaMJthGGA1UpjR2jxf4Z183SCnuYnujTPYTTgbdDYhDSWem23os8tdoYXwMGK4vSDYL1Aj9Z9pD';

    // transactions
    BitGo.TEST_ETH_TRANSACTION = '0x29fa68687d2263be6bcd637fb758aba59801eacfc78ac9ceef444b194214ba5a';
    BitGo.TEST_ETH_BLOCK = '0xdd6425966c69a1f4a2630ec5cbd4e9ce26fb026f0d285df1ec64e011ea0fed4f';
    BitGo.TEST_ETH_PARENT_BLOCK = '0x7d9045cbe4342add4036de0731cdcc786d4d19c0ddf800b9eb58135e2b373c72';

    // wallet for testing unspents regrouping (fanout & consolidate/coalesce)
    BitGo.TEST_WALLET_REGROUP_ADDRESS = '2MuVshMLfZaXfF6q7af47ZFUtZGGpnyZuLu';

    // v2 variables
    BitGo.V2 = {};
    BitGo.V2.TEST_USERID = '585caccd5573b0a8416a745ed58d8cb4';
    BitGo.V2.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.V2.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcGicVM5K5UnocWoFt3Yh1RZKzSEHPPARhyMf9w7DVqM3PgBgiVW5NHRp8UteqhMoQb17rCQsLbmGXuPx43MKskyB31R97p3G';
    BitGo.V2.TEST_WALLET1_ID = '585cc5335573b0a8416aadb1fce63ce3';

  } else {
    BitGo.TEST_USERID = '543c11ed356d00cb7600000b98794503';
    BitGo.TEST_SHARED_KEY_USERID = '549d0ee835aec81206004c082757570f';
    BitGo.TEST_THIRD_USERID = '57049b9a194a115a06da21fb9731fb71';
    BitGo.TEST_USER_ECDH_XPUB = 'xpub661MyMwAqRbcFkiN8QJXCytQqPyDPW1cfnuG6RGCVFnVyiSQL1b6ZS2iiVJHH7UZYwLbN2ayWsaRVhnBFKYvLz956PTRH2SuuurpEcNGLKv';

    BitGo.TEST_WALLET1_PASSCODE = 'test wallet #1 security';
    BitGo.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcGU7FnXMKSHMwbWxARxYJUpKD1CoMJP6vonLT9bZZaWYq7A7tKPXmDFFXTKigT7VHMnbtEnjCmxQ1E93ZJe6HDKwxWD28M6f';
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

    // wallet addresses
    BitGo.TEST_ETH_WALLET1_ADDRESS = '0x9c532f9a429661e9199d447d63e4f182c16fb593';
    BitGo.TEST_ETH_WALLET2_ADDRESS = '0x12e1f5777cf43a996c5f8477dd880506076007d8';

    // labeled addresses (not directly used)
    BitGo.TEST_ETH_WALLET1_ADDRESS2 = '0xeab1cac0d744e99289c1798c280961172e63b508';
    BitGo.TEST_ETH_WALLET3_ADDRESS = '0xe59dfe5c67114b39a5662cc856be536c614124c0';

    // wallet xpubs
    BitGo.TEST_ETH_WALLET1_XPUB = 'xpub661MyMwAqRbcGsUE69PAHyGNMxCd9waDWJTrHDmFyafc2J4NyzcAegAhrvscfTXfiXCYKGxnAPVaeb4afug5ery7DLDed77TPoBwxUZ1dH1';

    // transactions
    BitGo.TEST_ETH_TRANSACTION = '0x29fa68687d2263be6bcd637fb758aba59801eacfc78ac9ceef444b194214ba5a';
    BitGo.TEST_ETH_BLOCK = '0xdd6425966c69a1f4a2630ec5cbd4e9ce26fb026f0d285df1ec64e011ea0fed4f';
    BitGo.TEST_ETH_PARENT_BLOCK = '0x7d9045cbe4342add4036de0731cdcc786d4d19c0ddf800b9eb58135e2b373c72';

    // wallet for testing unspents regrouping (fanout & consolidate/coalesce)
    BitGo.TEST_WALLET_REGROUP_ADDRESS = '2MuVshMLfZaXfF6q7af47ZFUtZGGpnyZuLu';

    // v2 variables
    BitGo.V2 = {};
    BitGo.V2.TEST_USERID = '543c11ed356d00cb7600000b98794503';

    BitGo.V2.TEST_WALLET1_PASSCODE = 'iVWeATjqLS1jJShrPpETti0b';
    BitGo.V2.TEST_WALLET1_XPUB = 'xpub661MyMwAqRbcFWFN9gpFpnSVy6bF3kMZAkSXtu3ZYKPgq2KUVo1xEMnMXDcavwDJ4zH57iUHVfEGVK7dEgo7ufKRzTkeWYSBDuye5g7w4pe';
    BitGo.V2.TEST_WALLET1_ID = '593f1ece99d37c23080a557283edcc89';
    BitGo.V2.TEST_WALLET1_ADDRESS = '2N3qLG4VMpkoRZN4Ft9PC5sgpGKvm7AV32A';

    // this wallet will do consolidate and fannout together, so the number of unspents can be known
    BitGo.V2.TEST_WALLET2_UNSPENTS_LABEL = 'Test Wallet 2 Unspents';
    BitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE = 'NXh65HxeZpzFqzW2n868';
    BitGo.V2.TEST_WALLET2_UNSPENTS_XPUB = 'xpub661MyMwAqRbcFeeMZtyLiqECMeek7QD6X9NLX2ydBN2DutiBQqLw8nsMnnL9hk3CSWGXZgW1PLV96opu8NzuXwJjK57PuNBqe85jSN6Abm6';
    BitGo.V2.TEST_WALLET2_UNSPENTS_ID = '5a1341e7c8421dc90710673b3166bbd5';

    BitGo.V2.TEST_ETH_WALLET_ID = '598f606cd8fc24710d2ebadb1d9459bb';
    BitGo.V2.TEST_ETH_WALLET_PASSPHRASE = 'moon';
    BitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS = '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e';

    BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_USER = 'update_password_test@bitgo.com';
    BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD = BitGo.TEST_PASSWORD;

  }

  BitGo.TEST_FEE_SINGLE_KEY_WIF = 'cRVQ6cbUyGHVvByPKF9GnEhaB4HUBFgLQ2jVX1kbQARHaTaD7WJ2';
  BitGo.TEST_FEE_SINGLE_KEY_ADDRESS = 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7';

};

//
// testUserOTP
// Get an OTP code for the test user.
//
BitGo.prototype.testUserOTP = function() {
  return '0000000';
};

//
// authenticateTestUser
// Authenticate the test user.
//
BitGo.prototype.authenticateTestUser = function(otp, callback) {
  return co(function *() {
    const response = yield this.authenticate({ username: BitGo.TEST_USER, password: BitGo.TEST_PASSWORD, otp: otp });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }).call(this).asCallback(callback);
};

BitGo.prototype.authenticateSharingTestUser = function(otp, callback) {
  return this.authenticate({ username: BitGo.TEST_SHARED_KEY_USER, password: BitGo.TEST_SHARED_KEY_PASSWORD, otp: otp })
  .then(function(response) {
    response.should.have.property('access_token');
    response.should.have.property('user');
  })
  .nodeify(callback);
};

BitGo.prototype.authenticateKnownBalanceTestUser = function(otp, callback) {
  return co(function *() {
    const response = yield this.authenticate({ username: BitGo.TEST_KNOWN_BALANCE_USER, password: BitGo.TEST_KNOWN_BALANCE_PASSWORD, otp: otp });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }).call(this).asCallback(callback);
};

BitGo.prototype.authenticateKeychainUpdatePWTest = function(otp, callback) {
  return co(function *() {
    const response = yield this.authenticate({
      username: BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_USER,
      password: BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD,
      otp: otp
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }).call(this).asCallback(callback);
};

const fetchConstants = BitGo.prototype.fetchConstants;
BitGo.prototype.fetchConstants = function(callback) {
  return co(function *() {
    yield fetchConstants.call(this);
    this._constants[this.env].eth = this._constants[this.env].eth || {};
    this._constants[this.env].eth.tokens = this._constants[this.env].eth.tokens || [];
    this._constants[this.env].eth.tokens.push({
      type: 'erc',
      tokenContractAddress: '0x945ac907cf021a6bcd07852bb3b8c087051706a9'
    });
  }).call(this).asCallback(callback);
};

BitGo.prototype.getAsyncError = co(function *throwsAsync(prom) {
  // Hacky because we can't use assert.throws with async functions
  let error;
  try {
    yield prom;
  } catch (e) {
    error = e;
  }

  return error;
});

BitGo.prototype.checkFunded = co(function *checkFunded(agent) {
  // We are testing both BTC and ETH funds here, to make sure that
  // we don't spend for already 'failed' test runs (e.g., spending ETH when we don't have enough BTC)
  if (!agent) {
    const args = {
      debug: false,
      env: 'test',
      logfile: '/dev/null'
    };

    const app = expressApp(args);
    agent = request.agent(app);
  }

  const authHeader = {
    Authorization: 'Bearer ' + BitGo.TEST_ACCESSTOKEN
  };

  // Test we have enough ETH
  const testWalletId = BitGo.V2.TEST_ETH_WALLET_ID;

  // Check wallet balance to ensure we can run tests
  const res = yield agent
  .get(`/api/v2/teth/wallet/${testWalletId}`)
  .set(authHeader);
  res.statusCode.should.equal(200);

  res.body.should.have.property('spendableBalanceString');
  let balance = new BigNumber(res.body.spendableBalanceString);

  // Check our balance is over 60000 (we spend 50000, add some cushion)
  balance.gt(60000).should.be.true;

  if (balance.lt(60000)) {
    console.error(`The TETH wallet ${testWalletId} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`);
    process.exit(1);
  }

  // Test we have enough BTC
  yield this.authenticateTestUser(this.testUserOTP());
  const wallet = yield this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET1_ID });

  // Check we have enough in the wallet to run test suite
  wallet.should.have.property('spendableBalanceString');
  balance = new BigNumber(wallet.spendableBalanceString());

  // Check our balance is over 0.05 tBTC (we spend 0.04, add some cushion)
  let minimumBalance = 0.05 * 1e8;
  balance.gt(minimumBalance).should.be.true;

  if (balance.lt(minimumBalance)) {
    console.error(`The TBTC wallet ${wallet.id()} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`);
    process.exit(1);
  }

  const unspentWallet = yield this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET2_UNSPENTS_ID });

  // Check we have enough in the wallet to run test suite
  unspentWallet.should.have.property('spendableBalanceString');
  balance = new BigNumber(wallet.spendableBalanceString());

  // Check our balance is over 0.05 tBTC (we spend 0.04, add some cushion)
  minimumBalance = 0.05 * 1e8;
  balance.gt(minimumBalance).should.be.true;

  if (balance.lt(minimumBalance)) {
    console.error(`The TBTC wallet ${unspentWallet.id()} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`);
    process.exit(1);
  }
});

module.exports = BitGo;
