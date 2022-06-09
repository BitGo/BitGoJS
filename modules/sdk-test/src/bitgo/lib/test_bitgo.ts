//
// BitGo object augmented for testing
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//
import * as _ from 'lodash';
import * as bip32 from 'bip32';
import * as config from './config';
import * as utxolib from '@bitgo/utxo-lib';
import shamir = require('secrets.js-grempe');
import { BitGoAPI } from '@bitgo/sdk-api';
const BigNumber = require('bignumber.js');

import 'should';
import 'should-http';

import nock from 'nock';
import { common, getSharedSecret, KeyIndices, promiseProps, Wallet } from '@bitgo/sdk-core';
nock.enableNetConnect();

class BitGo extends BitGoAPI {
  static TEST_USER = 'tester@bitgo.com';
  static TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD || 'test-password';
  static TEST_SHARED_KEY_USER = 'shared_key_test@bitgo.com';
  static TEST_SHARED_KEY_PASSWORD = BitGo.TEST_PASSWORD;

  // used for testing multiple approvers
  static TEST_THIRD_USER = 'third_user_test@bitgo.com';
  static TEST_THIRD_PASSWORD = BitGo.TEST_PASSWORD;

  // account with a known total balance. Don't spend or receive coins
  // from any wallet in this account. Known total balance across
  // all TLTC wallets in this account is exactly 9999586400
  static TEST_KNOWN_BALANCE_USER = 'tyler+test-get-total-balances@bitgo.com';
  static TEST_KNOWN_BALANCE_PASSWORD = BitGo.TEST_PASSWORD;
  static TEST_KNOWN_BALANCE = 9999586400;

  static TEST_ENTERPRISE_CREATION_USER = 'enterprisecreator@bitgo.com';
  static TEST_ENTERPRISE_CREATION_PASSWORD = BitGo.TEST_PASSWORD;

  static OFC_TEST_USER = 'tester+employee@bitgo.com';
  static OFC_TEST_PASSWORD = BitGo.TEST_PASSWORD;

  static TEST_CLIENTID = 'test';
  static TEST_CLIENTSECRET = 'testclientsecret';

  // These auth tokens are modified in the db to expire in 2018 on both test & dev
  static TEST_AUTHCODE = '37454416ba13e1be9fdc39cfc207df7f7a7f0953';
  static TEST_ACCESSTOKEN = '4cb440e353b5415e350a1e799bb1ad820fef4ead';
  static TEST_ACCESSTOKEN_SHAREDUSER = '4cb440e353b5415e350a1e799bb1ad820fef4eax';
  static TEST_REFRESHTOKEN = '8519fcc7787d9d6971ed89a757e3309a72ddedc8';

  static TRAVEL_RULE_TXID = '33447753455651508cfd099c9ebe0db6a2243ccba4766319621fbce56db7f135';

  static TEST_WALLET_REGROUP_PASSCODE = 'test security fanout & coalesce';
  static TEST_USERID: string;
  static TEST_SHARED_KEY_USERID: string;
  static TEST_THIRD_USERID: string;
  static TEST_USER_ECDH_XPUB: string;
  static TEST_WALLET1_PASSCODE: string;
  static TEST_WALLET1_XPUB: string;
  static TEST_WALLET1_ADDRESS: string;
  static TEST_WALLET1_ADDRESS2: string;
  static TEST_WALLET2_PASSCODE: string;
  static TEST_WALLET2_ADDRESS: string;
  static TEST_WALLET3_PASSCODE: string;
  static TEST_WALLET3_ADDRESS: string;
  static TEST_WALLET3_ADDRESS2: string;
  static TEST_WALLET3_ADDRESS3: string;
  static TEST_WEBHOOK_TRANSACTION_SIMULATION_ID: string;
  static TEST_WALLET_REGROUP_ADDRESS: string;
  static V2: any;
  static TEST_WEBHOOK_PENDING_APPROVAL_SIMULATION_ID: string;
  static TEST_WALLETMULTAPPROVERS_ADDRESS: string;
  static TEST_WALLETMULTAPPROVERS_PASSCODE: string | undefined;
  static TEST_ENTERPRISE: string;
  static TEST_ENTERPRISE_2: string;
  static TEST_SHARED_WALLET_ADDRESS: string;
  static TEST_SHARED_WALLET_CHANGE_ADDRESS: string;
  static TEST_WALLET_PENDING_APPROVAL_ID: string;
  static TEST_ENTERPRISE_PENDING_APPROVAL_ID: string;
  static TEST_FEE_SINGLE_KEY_WIF: string;
  static TEST_FEE_SINGLE_KEY_ADDRESS: string;

  get validate() {
    return this._validate;
  }

  safeRegister(coinName, coinConstructor) {
    try {
      this.register(coinName, coinConstructor);
    } catch (_) {}
  }

  registerToken(tokenFamily, createTokenConstructor) {
    let tokens;

    switch (tokenFamily) {
      case 'eth':
        tokens = [...config.tokens.bitcoin.eth.tokens, ...config.tokens.testnet.eth.tokens];
        break;
      case 'xlm':
        tokens = [...config.tokens.bitcoin.xlm.tokens, ...config.tokens.testnet.xlm.tokens];
        break;
      case 'ofc':
        tokens = [...config.tokens.bitcoin.ofc.tokens, ...config.tokens.testnet.ofc.tokens];
        break;
      case 'celo':
        tokens = [...config.tokens.bitcoin.celo.tokens, ...config.tokens.testnet.celo.tokens];
        break;
      case 'eos':
        tokens = [...config.tokens.bitcoin.eos.tokens, ...config.tokens.testnet.eos.tokens];
        break;
      case 'algo':
        tokens = [...config.tokens.bitcoin.algo.tokens, ...config.tokens.testnet.algo.tokens];
        break;
      case 'avaxc':
        tokens = [...config.tokens.bitcoin.avaxc.tokens, ...config.tokens.testnet.avaxc.tokens];
        break;
      default:
        tokens = [];
    }

    for (const token of tokens) {
      const tokenConstructor = createTokenConstructor(token);
      this.safeRegister(token.type, tokenConstructor);
      this.safeRegister(token.tokenContractAddress, tokenConstructor);
    }
  }

  reconstituteSecret(reconstituteSecretOptions) {
    const { shards, passwords } = reconstituteSecretOptions;

    if (!Array.isArray(shards)) {
      throw new Error('shards must be an array');
    }
    if (!Array.isArray(passwords)) {
      throw new Error('passwords must be an array');
    }

    if (shards.length !== passwords.length) {
      throw new Error('shards and passwords arrays must have same length');
    }

    const secrets = _.zipWith(shards, passwords, (shard, password) => {
      return this.decrypt({ input: shard, password });
    });
    const seed: string = shamir.combine(secrets);
    const node = bip32.fromSeed(Buffer.from(seed, 'hex'));
    return {
      xpub: node.neutered().toBase58() as string,
      xprv: node.toBase58() as string,
      seed,
    };
  }

  verifyShards(verifyShardsOptions) {
    const { shards, passwords, m, xpub } = verifyShardsOptions;

    const generateCombinations = (array: string[], m: number, entryIndices: number[] = []): string[][] => {
      let combinations: string[][] = [];

      if (entryIndices.length === m) {
        const currentCombination = _.at(array, entryIndices);
        return [currentCombination];
      }

      // The highest index
      let entryIndex = _.last(entryIndices);
      // If there are currently no indices, assume -1
      if (_.isUndefined(entryIndex)) {
        entryIndex = -1;
      }
      for (let i = entryIndex + 1; i < array.length; i++) {
        // append the current index to the trailing indices
        const currentEntryIndices = [...entryIndices, i];
        const newCombinations = generateCombinations(array, m, currentEntryIndices);
        combinations = [...combinations, ...newCombinations];
      }

      return combinations;
    };

    if (!Array.isArray(shards)) {
      throw new Error('shards must be an array');
    }
    if (!Array.isArray(passwords)) {
      throw new Error('passwords must be an array');
    }

    if (shards.length !== passwords.length) {
      throw new Error('shards and passwords arrays must have same length');
    }

    const secrets = _.zipWith(shards, passwords, (shard, password) => {
      return this.decrypt({ input: shard, password });
    });
    const secretCombinations = generateCombinations(secrets, m);
    const seeds = secretCombinations.map((currentCombination) => {
      return shamir.combine(currentCombination);
    });
    const uniqueSeeds = _.uniq(seeds);
    if (uniqueSeeds.length !== 1) {
      return false;
    }
    const seed = _.first(uniqueSeeds);
    const node = bip32.fromSeed(Buffer.from(seed, 'hex'));
    const restoredXpub = node.neutered().toBase58();

    if (!_.isUndefined(xpub)) {
      if (!_.isString(xpub)) {
        throw new Error('xpub must be a string');
      }
      if (restoredXpub !== xpub) {
        return false;
      }
    }

    return true;
  }

  keychains() {
    return {
      updatePassword: function (params) {
        return {
          keychains: {},
          version: 'test-version',
        };
      },
    };
  }

  async token(tokenName) {
    await this.fetchConstants();
    return this.coin(tokenName);
  }

  verifyAddress(params) {
    common.validateParams(params, ['address'], []);

    if (!_.isString(params.address)) {
      throw new Error('missing required string address');
    }

    const networkName = common.Environments[this.getEnv()].network;
    const network = utxolib.networks[networkName];

    let address;
    try {
      address = utxolib.address.fromBase58Check(params.address, network);
    } catch (e) {
      return false;
    }

    return address.version === network.pubKeyHash || address.version === network.scriptHash;
  }

  splitSecret(splitSecretOptions) {
    const { seed, passwords, m } = splitSecretOptions;

    if (!Array.isArray(passwords)) {
      throw new Error('passwords must be an array');
    }
    if (!_.isInteger(m) || m < 2) {
      throw new Error('m must be a positive integer greater than or equal to 2');
    }

    if (passwords.length < m) {
      throw new Error('passwords array length cannot be less than m');
    }

    const n = passwords.length;
    const secrets: string[] = shamir.share(seed, n, m);
    const shards = _.zipWith(secrets, passwords, (shard, password) => {
      return this.encrypt({ input: shard, password });
    });
    const node = bip32.fromSeed(Buffer.from(seed, 'hex'));
    return {
      xpub: node.neutered().toBase58(),
      m,
      n,
      seedShares: shards,
    };
  }

  getECDHSecret(getECDHSecretOptions) {
    const { otherPubKeyHex, eckey } = getECDHSecretOptions;

    if (!_.isString(otherPubKeyHex)) {
      throw new Error('otherPubKeyHex string required');
    }
    if (!_.isObject(eckey)) {
      throw new Error('eckey object required');
    }

    return getSharedSecret(eckey as any, Buffer.from(otherPubKeyHex, 'hex')).toString('hex');
  }

  async changePassword(changePasswordOptions) {
    const { oldPassword, newPassword } = changePasswordOptions;

    if (!_.isString(oldPassword)) {
      throw new Error('expected string oldPassword');
    }

    if (!_.isString(newPassword)) {
      throw new Error('expected string newPassword');
    }

    const user = this.user();
    if (typeof user !== 'object' || !user.username) {
      throw new Error('missing required object user');
    }

    const validation = await this.verifyPassword({ password: oldPassword });
    if (!validation) {
      throw new Error('the provided oldPassword is incorrect');
    }

    // it doesn't matter which coin we choose because the v2 updatePassword functions updates all v2 keychains
    // we just need to choose a coin that exists in the current environment
    const coin = common.Environments[this.getEnv()].network === 'bitcoin' ? 'btc' : 'tbtc';

    const updateKeychainPasswordParams = { oldPassword, newPassword };
    const v1KeychainUpdatePWResult = await this.keychains().updatePassword(updateKeychainPasswordParams);
    const v2Keychains = await this.coin(coin).keychains().updatePassword(updateKeychainPasswordParams);

    const updatePasswordParams = {
      keychains: v1KeychainUpdatePWResult.keychains,
      v2_keychains: v2Keychains,
      version: v1KeychainUpdatePWResult.version,
      oldPassword: this.calculateHMAC(user.username, oldPassword),
      password: this.calculateHMAC(user.username, newPassword),
    };

    return this.post(this.url('/user/changepassword')).send(updatePasswordParams).result();
  }

  getConstants() {
    // kick off a fresh request for the client constants
    this.fetchConstants().catch(function (err) {
      if (err) {
        // make sure an error does not terminate the entire script
        console.error('failed to fetch client constants from BitGo');
        console.trace(err);
      }
    });

    // use defaultConstants as the backup for keys that are not set in this._constants
    return _.merge({}, config.defaultConstants(this.getEnv()), BitGoAPI._constants[this.getEnv()]);
  }

  initializeTestVars() {
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

      BitGo.V2.TEST_RECOVERY_PASSCODE = 'oPXkPN5Q0c8i44i0';
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

      BitGo.V2.TEST_ETH2_WALLET_ID = '6245df06b0c50d0008e0b2acea0b1f0e';
      BitGo.V2.TEST_ETH2_WALLET_PASSPHRASE = 'Eth2OnMoon!';

      BitGo.V2.TEST_BCH_WALLET_ID = '6148987267660d00069dd844af297a2b';
      BitGo.V2.TEST_BCH_WALLET_PASSPHRASE = 'BchOnMoon4';
      BitGo.V2.TEST_BCH_WALLET_CASH_ADDRESS = 'bchtest:pr3zp43qxu8ztudephsvyafxj2zfznw5v5wh85sg54';

      BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_USER = 'update_pw_tester@bitgo.com';
      BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD = BitGo.TEST_PASSWORD;

      // Contract address for Potatoken
      BitGo.V2.TEST_ERC20_TOKEN_ADDRESS = '0x06d22e6fa60fda26b6ca28f73d2d4a81bd9aa2de';
      BitGo.V2.TEST_ERC20_TOKEN_RECIPIENT = '0x52c8B29Ab8B0a49a01c2b75f8e7f11B23e0e3782';

      // Contract address for tdai token
      BitGo.V2.TEST_TDAI_TOKEN_ADDRESS = '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa';
      BitGo.V2.TEST_RECOVERY_PASSCODE = 'oPXkPN5Q0c8i44i0';

      // webhooks
      BitGo.V2.TEST_WEBHOOK_TRANSFER_SIMULATION_ID = '59b7041619dd52cd0737a4cbf39dbd44';

      BitGo.V2.OFC_TEST_WALLET_ID = '5cbe3563afc275b40369e096073b8a16';

      // Algo wallet for non participating key reg transaction
      BitGo.V2.TEST_ALGO_WALLET_ID = '602566f550a05c0006fe13a03b57141f';
    }

    BitGo.TEST_FEE_SINGLE_KEY_WIF = 'cRVQ6cbUyGHVvByPKF9GnEhaB4HUBFgLQ2jVX1kbQARHaTaD7WJ2';
    BitGo.TEST_FEE_SINGLE_KEY_ADDRESS = 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7';
  }

  //
  // testUserOTP
  // Get an OTP code for the test user.
  //
  testUserOTP() {
    return '0000000';
  }

  //
  // authenticateTestUser
  // Authenticate the test user.
  //
  async authenticateTestUser(otp) {
    const response = await this.authenticate({
      username: BitGo.TEST_USER,
      password: BitGo.TEST_PASSWORD,
      otp: otp,
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }

  async authenticateSharingTestUser(otp) {
    const response = await this.authenticate({
      username: BitGo.TEST_SHARED_KEY_USER,
      password: BitGo.TEST_SHARED_KEY_PASSWORD,
      otp: otp,
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }

  async authenticateKnownBalanceTestUser(otp) {
    const response = await this.authenticate({
      username: BitGo.TEST_KNOWN_BALANCE_USER,
      password: BitGo.TEST_KNOWN_BALANCE_PASSWORD,
      otp: otp,
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }

  async authenticateEnterpriseCreatorTestUser(otp) {
    const response = await this.authenticate({
      username: BitGo.TEST_ENTERPRISE_CREATION_USER,
      password: BitGo.TEST_ENTERPRISE_CREATION_PASSWORD,
      otp: otp,
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }

  async authenticateChangePWTestUser(otp) {
    const params = {
      username: BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_USER,
      password: BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD,
      otp: otp,
    };
    let alternatePassword = `${params.password}_new`;
    let response;

    try {
      response = await this.authenticate(params);
    } catch (e) {
      if (e.message !== 'invalid_grant') {
        throw new Error(e);
      }
      params.password = alternatePassword;
      alternatePassword = BitGo.V2.TEST_KEYCHAIN_CHANGE_PW_PASSWORD;
      response = await this.authenticate(params);
    }
    response.should.have.property('access_token');
    response.should.have.property('user');

    return { password: params.password, alternatePassword };
  }

  async authenticateOfcTestUser(otp) {
    const response = await this.authenticate({
      username: BitGo.OFC_TEST_USER,
      password: BitGo.OFC_TEST_PASSWORD,
      otp: otp,
    });
    response.should.have.property('access_token');
    response.should.have.property('user');
  }

  async checkFunded() {
    // We are testing both BTC and ETH funds here, to make sure that
    // we don't spend for already 'failed' test runs (e.g., spending ETH when we don't have enough BTC)

    // Test we have enough ETH
    await this.authenticateTestUser(this.testUserOTP());
    const testWalletId = BitGo.V2.TEST_ETH_WALLET_ID;

    const { gtethWallet, tbtcWallet, unspentWallet, sweep1Wallet }: any = await promiseProps({
      gtethWallet: this.coin('gteth').wallets().get({ id: testWalletId }),
      tbtcWallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET1_ID }),
      unspentWallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_WALLET2_UNSPENTS_ID }),
      sweep1Wallet: this.coin('tbtc').wallets().getWallet({ id: BitGo.V2.TEST_SWEEP1_ID }),
    });

    const spendableBalance = gtethWallet.spendableBalanceString;

    let balance = new BigNumber(spendableBalance);

    // Check our balance is over 60000 (we spend 50000, add some cushion)
    if (balance.lt(60000)) {
      throw new Error(
        `The GTETH wallet ${testWalletId} does not have enough funds to run the test suite. The current balance is ${balance}. Please fund this wallet!`
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
  }

  nockEthWallet() {
    const walletData = {
      id: '598f606cd8fc24710d2ebadb1d9459bb',
      users: [
        {
          user: '543c11ed356d00cb7600000b98794503',
          permissions: [Object],
        },
      ],
      coin: 'gteth',
      label: 'my test ether wallet',
      m: 2,
      n: 3,
      keys: [
        '598f606cd8fc24710d2ebad89dce86c2',
        '598f606cc8e43aef09fcb785221d9dd2',
        '5935d59cf660764331bafcade1855fd7',
      ],
      tags: ['598f606cd8fc24710d2ebadb1d9459bb'],
      disableTransactionNotifications: false,
      freeze: {},
      deleted: false,
      approvalsRequired: 1,
      isCold: false,
      coinSpecific: {
        deployedInBlock: false,
        deployTxHash: '0x413ed27a9cdd341a4742baff13984e9d4ee262ec0edbca92b9872fb4e18f5106',
        lastChainIndex: { 0: 701, 1: -1 },
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        pendingChainInitialization: false,
        creationFailure: [],
      },
      admin: {
        policy: {
          id: '598f606cd8fc24710d2ebadda4b955fb',
          version: 0,
          date: '2017-08-12T20:09:16.472Z',
          rules: [],
        },
      },
      clientFlags: [],
      allowBackupKeySigning: false,
      balanceString: '10000000000000000000',
      confirmedBalanceString: '10000000000000000000',
      spendableBalanceString: '10000000000000000000',
      receiveAddress: {
        id: '5a8453c23fd075b907574338a878f4fb',
        address: '0xa7f9ca5c1268b0082db1833d30f33d3cfd4286d8',
        chain: 0,
        index: 701,
        coin: 'gteth',
        lastNonce: 0,
        wallet: '598f606cd8fc24710d2ebadb1d9459bb',
        coinSpecific: {
          nonce: -1,
          updateTime: '2018-02-14T15:20:34.188Z',
          txCount: 0,
          pendingChainInitialization: false,
          creationFailure: [],
        },
      },
      pendingApprovals: [],
    };

    const wallet = new Wallet(this, this.coin('gteth'), walletData);

    // Nock calls to platform for building transactions and getting user key
    // Should be OK to persist these since they are wallet specific data reads
    nock(this._baseUrl)
      .persist()
      .filteringRequestBody(() => '*')
      .post(`/api/v2/gteth/wallet/${wallet.id()}/tx/build`, '*')
      .reply(200, {
        gasLimit: 500000,
        gasPrice: 20000000000,
        nextContractSequenceId: 101,
      })
      .get(`/api/v2/gteth/key/${wallet.keyIds()[KeyIndices.USER]}`)
      .reply(200, {
        id: '598f606cd8fc24710d2ebad89dce86c2',
        users: ['543c11ed356d00cb7600000b98794503'],
        pub: 'xpub661MyMwAqRbcFXDcWD2vxuebcT1ZpTF4Vke6qmMW8yzddwNYpAPjvYEEL5jLfyYXW2fuxtAxY8TgjPUJLcf1C8qz9N6VgZxArKX4EwB8rH5',
        ethAddress: '0x26a163ba9739529720c0914c583865dec0d37278',
        encryptedPrv:
          '{"iv":"15FsbDVI1zG9OggD8YX+Hg==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"hHbNH3Sz/aU=","ct":"WoNVKz7afiRxXI2w/YkzMdMyoQg/B15u1Q8aQgi96jJZ9wk6TIaSEc6bXFH3AHzD9MdJCWJQUpRhoQc/rgytcn69scPTjKeeyVMElGCxZdFVS/psQcNE+lue3//2Zlxj+6t1NkvYO+8yAezSMRBK5OdftXEjNQI="}',
      });

    const params: any = {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: BitGo.V2.TEST_ERC20_TOKEN_ADDRESS,
      address: BitGo.V2.TEST_ETH_WALLET_FIRST_ADDRESS,
      tag: 'latest',
    };
    if (common.Environments[this.getEnv()].etherscanApiToken) {
      params.apikey = common.Environments[this.getEnv()].etherscanApiToken;
    }

    // Nock tokens stuck on the wallet
    nock('https://api-goerli.etherscan.io')
      .get('/api')
      .query(params)
      .reply(200, { status: '1', message: 'OK', result: '2400' });

    return wallet;
  }
}

if (process.env.BITGOJS_TEST_PASSWORD) {
  BitGo.TEST_PASSWORD = process.env.BITGOJS_TEST_PASSWORD;
} else {
  // Test accounts are locked internally to prevent tampering
  // Contact support@bitgo.com for further help on how to fix this
  throw new Error('Need to set BITGOJS_TEST_PASSWORD env variable - please see the developer setup docs.');
}

const oldFetchConstants = BitGoAPI.prototype.fetchConstants;
BitGoAPI.prototype.fetchConstants = function () {
  // @ts-expect-error - no implicit this
  nock(this._baseUrl).get('/api/v1/client/constants').reply(200, { ttl: 3600, constants: {} });

  // force client constants reload
  BitGoAPI['_constants'] = undefined;

  return oldFetchConstants.apply(this, arguments as any);
};

export const TestBitGo: any = BitGo;
