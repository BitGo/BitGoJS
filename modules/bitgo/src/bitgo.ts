//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import * as superagent from 'superagent';
import * as utxolib from '@bitgo/utxo-lib';
import * as bip32 from 'bip32';
import bitcoinMessage = require('bitcoinjs-message');
import { BaseCoin } from './v2/baseCoin';
const PendingApprovals = require('./pendingapprovals');
import shamir = require('secrets.js-grempe');
import pjson = require('../package.json');

import * as _ from 'lodash';
import * as config from './config';

import * as debugLib from 'debug';

const TransactionBuilder = require('./transactionBuilder');
const Blockchain = require('./blockchain');
const Keychains = require('./keychains');
const TravelRule = require('./travelRule');
import Wallet = require('./wallet');
const Wallets = require('./wallets');
const Markets = require('./markets');
import { GlobalCoinFactory } from './v2/coinFactory';
import { getSharedSecret } from './ecdh';
import { common } from '@bitgo/sdk-core';
import {
  BitGoAPI,
  BitGoAPIOptions,
} from '@bitgo/sdk-api';

const debug = debugLib('bitgo:index');

if (!(process as any).browser) {
  debug('enabling superagent-proxy wrapper');
  require('superagent-proxy')(superagent);
}

export type BitGoOptions = BitGoAPIOptions;

/**
 * @deprecated
 */
export interface DeprecatedVerifyAddressOptions {
  address?: string;
}

export interface SplitSecretOptions {
  seed: string;
  passwords: string[];
  m: number;
}

export interface SplitSecret {
  xpub: string;
  m: number;
  n: number;
  seedShares: any;
}

export interface ReconstituteSecretOptions {
  shards: string[];
  passwords: string[];
}

export interface ReconstitutedSecret {
  xpub: string;
  xprv: string;
  seed: string;
}

export interface VerifyShardsOptions {
  shards: string[];
  passwords: string[];
  m: number;
  xpub: string;
}

export interface GetEcdhSecretOptions {
  otherPubKeyHex: string;
  eckey: utxolib.ECPair.ECPairInterface;
}


export interface ChangePasswordOptions {
  oldPassword: string;
  newPassword: string;
}


/**
 * @deprecated
 */
export interface EstimateFeeOptions {
  numBlocks?: number;
  maxFee?: number;
  inputs?: string[];
  txSize?: number;
  cpfpAware?: boolean;
}

/**
 * @deprecated
 */
export interface WebhookOptions {
  url: string;
  type: string;
}

export interface ListWebhookNotificationsOptions {
  prevId?: string;
  limit?: number;
}

export interface BitGoSimulateWebhookOptions {
  webhookId: string;
  blockId: string;
}

export interface AuthenticateWithAuthCodeOptions {
  authCode: string;
}

/**
 * @deprecated
 */
export interface VerifyPushTokenOptions {
  pushVerificationToken: string;
}

/**
 * @deprecated
 */
export interface RegisterPushTokenOptions {
  pushToken: unknown;
  operatingSystem: unknown;
}

export class BitGo extends BitGoAPI {
  private _keychains: any;
  private _wallets: any;
  private _markets?: any;
  private _blockchain?: any;
  private _travelRule?: any;
  private _pendingApprovals?: any;

  /**
   * Constructor for BitGo Object
   */
  constructor(params: BitGoAPIOptions = {}) {
    super(params);
    if (!common.validateParams(params, [], ['clientId', 'clientSecret', 'refreshToken', 'accessToken', 'userAgent', 'customRootURI', 'customBitcoinNetwork', 'serverXpub', 'stellarFederationServerUrl']) ||
      (params.useProduction && !_.isBoolean(params.useProduction))) {
      throw new Error('invalid argument');
    }

    if ((!params.clientId) !== (!params.clientSecret)) {
      throw new Error('invalid argument - must provide both client id and secret');
    }

    this._version = pjson.version;
    this._keychains = null;
    this._wallets = null;
  }

  /**
   * Create a basecoin object
   * @param coinName
   */
  coin(coinName: string): BaseCoin {
    return GlobalCoinFactory.getInstance(this, coinName);
  }

  /**
   * Create a basecoin object for a virtual token
   * @param tokenName
   */
  async token(tokenName: string): Promise<BaseCoin> {
    await this.fetchConstants();
    return this.coin(tokenName);
  }

  /**
   * Verify a Bitcoin address is a valid base58 address
   * @deprecated
   */
  verifyAddress(params: DeprecatedVerifyAddressOptions = {}): boolean {
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

  /**
   * Split a secret into shards using Shamir Secret Sharing.
   * @param seed A hexadecimal secret to split
   * @param passwords An array of the passwords used to encrypt each share
   * @param m The threshold number of shards necessary to reconstitute the secret
   */
  splitSecret({ seed, passwords, m }: SplitSecretOptions): SplitSecret {
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

  /**
   * Reconstitute a secret which was sharded with `splitSecret`.
   * @param shards
   * @param passwords
   */
  reconstituteSecret({ shards, passwords }: ReconstituteSecretOptions): ReconstitutedSecret {
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

  /**
   *
   * @param shards
   * @param passwords
   * @param m
   * @param xpub Optional xpub to verify the results against
   */
  verifyShards({ shards, passwords, m, xpub }: VerifyShardsOptions): boolean {
    /**
     * Generate all possible combinations of a given array's values given subset size m
     * @param array The array whose values are to be arranged in all combinations
     * @param m The size of each subset
     * @param entryIndices Recursively trailing set of currently chosen array indices for the combination subset under construction
     * @returns {Array}
     */
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

  /**
   * @deprecated - use `getSharedSecret()`
   */
  getECDHSecret({ otherPubKeyHex, eckey }: GetEcdhSecretOptions): string {
    if (!_.isString(otherPubKeyHex)) {
      throw new Error('otherPubKeyHex string required');
    }
    if (!_.isObject(eckey)) {
      throw new Error('eckey object required');
    }

    return getSharedSecret(eckey, Buffer.from(otherPubKeyHex, 'hex')).toString('hex');
  }

  /**
   * Gets the user's private keychain, used for receiving shares
   */
  async getECDHSharingKeychain(): Promise<any> {
    const result = await this.get(this.url('/user/settings')).result();
    if (!result.settings.ecdhKeychain) {
      return new Error('ecdh keychain not found for user');
    }
    return this.keychains().get({ xpub: result.settings.ecdhKeychain });
  }

  /**
   * Get bitcoin market data
   *
   * @deprecated
   */
  markets(): any {
    if (!this._markets) {
      this._markets = new Markets(this);
    }
    return this._markets;
  }

  /**
   * Get the latest bitcoin prices
   * (Deprecated: Will be removed in the future) use `bitgo.markets().latest()`
   * @deprecated
   */
  // cb-compat
  async market(): Promise<any> {
    return this.get(this.url('/market/latest')).result();
  }

  /**
   * Get market data from yesterday
   * (Deprecated: Will be removed in the future) use bitgo.markets().yesterday()
   * @deprecated
   */
  async yesterday(): Promise<any> {
    return this.get(this.url('/market/yesterday')).result();
  }

  /**
   * @param params
   * - operatingSystem: one of ios, android
   * - pushToken: hex-formatted token for the respective native push notification service
   * @returns {*}
   * @deprecated
   */
  async registerPushToken(params: RegisterPushTokenOptions): Promise<any> {
    params = params || {};
    common.validateParams(params, ['pushToken', 'operatingSystem'], []);

    if (!this._token) {
      // this device has to be registered to an extensible session
      throw new Error('not logged in');
    }

    const postParams = _.pick(params, ['pushToken', 'operatingSystem']);

    return this.post(this.url('/devices')).send(postParams).result();
  }

  /**
   * @param params
   * - pushVerificationToken: the token received via push notification to confirm the device's mobility
   * @deprecated
   */
  verifyPushToken(params: VerifyPushTokenOptions): Promise<any> {
    if (!_.isObject(params)) {
      throw new Error('required object params');
    }

    if (!_.isString(params.pushVerificationToken)) {
      throw new Error('required string pushVerificationToken');
    }

    if (!this._token) {
      // this device has to be registered to an extensible session
      throw new Error('not logged in');
    }

    const postParams = _.pick(params, 'pushVerificationToken');

    return this.post(this.url('/devices/verify')).send(postParams).result();
  }

  /**
   * Login to the bitgo system using an authcode generated via Oauth
   */
  async authenticateWithAuthCode(params: AuthenticateWithAuthCodeOptions): Promise<any> {
    if (!_.isObject(params)) {
      throw new Error('required object params');
    }

    if (!_.isString(params.authCode)) {
      throw new Error('required string authCode');
    }

    if (!this._clientId || !this._clientSecret) {
      throw new Error('Need client id and secret set first to use this');
    }

    const authCode = params.authCode;

    if (this._token) {
      throw new Error('already logged in');
    }

    const request = this.post(this._baseUrl + '/oauth/token');
    request.forceV1Auth = true; // OAuth currently only supports v1 authentication
    const body = await request
      .send({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: this._clientId,
        client_secret: this._clientSecret,
      })
      .result();

    this._token = body.access_token;
    this._refreshToken = body.refresh_token;
    this._user = await this.me();
    return body;
  }

  /**
   * Change the password of the currently logged in user.
   * Also change all v1 and v2 keychain passwords if they match the
   * given oldPassword. Returns nothing on success.
   * @param oldPassword {String} - the current password
   * @param newPassword {String} - the new password
   */
  async changePassword({ oldPassword, newPassword }: ChangePasswordOptions): Promise<any> {
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

  /**
   * Get the blockchain object.
   * @deprecated
   */
  blockchain(): any {
    if (!this._blockchain) {
      this._blockchain = new Blockchain(this);
    }
    return this._blockchain;
  }

  /**
   * Get the user's keychains object.
   * @deprecated
   */
  keychains(): any {
    if (!this._keychains) {
      this._keychains = new Keychains(this);
    }
    return this._keychains;
  }

  /**
   * Get the user's wallets object.
   * @deprecated
   */
  wallets(): any {
    if (!this._wallets) {
      this._wallets = new Wallets(this);
    }
    return this._wallets;
  }

  /**
   * Get the travel rule object
   * @deprecated
   */
  travelRule(): any {
    if (!this._travelRule) {
      this._travelRule = new TravelRule(this);
    }
    return this._travelRule;
  }

  /**
   * Get pending approvals that can be approved/ or rejected
   * @deprecated
   */
  pendingApprovals(): any {
    if (!this._pendingApprovals) {
      this._pendingApprovals = new PendingApprovals(this);
    }
    return this._pendingApprovals;
  }

  /**
   * A factory method to create a new Wallet object, initialized with the wallet params
   * Can be used to reconstitute a wallet from cached data
   * @param walletParams
   * @deprecated
   */
  newWalletObject(walletParams): any {
    return new Wallet(this, walletParams);
  }

  /**
   * Get all the address labels on all of the user's wallets
   *
   * @deprecated
   */
  async labels(): Promise<any> {
    return this.get(this.url('/labels')).result('labels');
  }

  /**
   * Estimates approximate fee per kb needed for a tx to get into a block
   * @param {number} params.numBlocks target blocks for the transaction to be confirmed
   * @param {number} params.maxFee maximum fee willing to be paid (for safety)
   * @param {array[string]} params.inputs list of unconfirmed txIds from which this transaction uses inputs
   * @param {number} params.txSize estimated transaction size in bytes, optional parameter used for CPFP estimation.
   * @param {boolean} params.cpfpAware flag indicating fee should take into account CPFP
   * @deprecated
   */
  async estimateFee(params: EstimateFeeOptions = {}): Promise<any> {
    const queryParams: any = { version: 12 };
    if (params.numBlocks) {
      if (!_.isNumber(params.numBlocks)) {
        throw new Error('invalid argument');
      }
      queryParams.numBlocks = params.numBlocks;
    }
    if (params.maxFee) {
      if (!_.isNumber(params.maxFee)) {
        throw new Error('invalid argument');
      }
      queryParams.maxFee = params.maxFee;
    }
    if (params.inputs) {
      if (!Array.isArray(params.inputs)) {
        throw new Error('invalid argument');
      }
      queryParams.inputs = params.inputs;
    }
    if (params.txSize) {
      if (!_.isNumber(params.txSize)) {
        throw new Error('invalid argument');
      }
      queryParams.txSize = params.txSize;
    }
    if (params.cpfpAware) {
      if (!_.isBoolean(params.cpfpAware)) {
        throw new Error('invalid argument');
      }
      queryParams.cpfpAware = params.cpfpAware;
    }

    return this.get(this.url('/tx/fee')).query(queryParams).result();
  }

  /**
   * Get BitGo's guarantee using an instant id
   * @param params
   * @deprecated
   */
  async instantGuarantee(params: { id: string }): Promise<any> {
    if (!_.isString(params.id)) {
      throw new Error('required string id');
    }

    const body = await this.get(this.url('/instant/' + params.id)).result();
    if (!body.guarantee) {
      throw new Error('no guarantee found in response body');
    }
    if (!body.signature) {
      throw new Error('no signature found in guarantee response body');
    }
    const signingAddress = common.Environments[this.getEnv()].signingAddress;
    const signatureBuffer = Buffer.from(body.signature, 'hex');
    const prefix = utxolib.networks[common.Environments[this.getEnv()].network].messagePrefix;
    const isValidSignature = bitcoinMessage.verify(body.guarantee, signingAddress, signatureBuffer, prefix);
    if (!isValidSignature) {
      throw new Error('incorrect signature');
    }
    return body;
  }

  /**
   * Get a target address for payment of a BitGo fee
   * @deprecated
   */
  async getBitGoFeeAddress(): Promise<any> {
    return this.post(this.url('/billing/address')).send({}).result();
  }

  /**
   * Gets an address object (including the wallet id) for a given address.
   * @param {string} params.address The address to look up.
   * @deprecated
   */
  async getWalletAddress({ address }: { address: string }): Promise<any> {
    return this.get(this.url(`/walletaddress/${address}`)).result();
  }

  /**
   * Fetch list of user webhooks
   *
   * @returns {*}
   * @deprecated
   */
  async listWebhooks(): Promise<any> {
    return this.get(this.url('/webhooks')).result();
  }

  /**
   * Add new user webhook
   *
   * @param params
   * @returns {*}
   * @deprecated
   */
  async addWebhook(params: WebhookOptions): Promise<any> {
    if (!_.isString(params.url)) {
      throw new Error('required string url');
    }

    if (!_.isString(params.type)) {
      throw new Error('required string type');
    }

    return this.post(this.url('/webhooks')).send(params).result();
  }

  /**
   * Remove user webhook
   *
   * @param params
   * @returns {*}
   * @deprecated
   */
  async removeWebhook(params: WebhookOptions): Promise<any> {
    if (!_.isString(params.url)) {
      throw new Error('required string url');
    }

    if (!_.isString(params.type)) {
      throw new Error('required string type');
    }

    return this.del(this.url('/webhooks')).send(params).result();
  }

  /**
   * Fetch list of webhook notifications for the user
   *
   * @param params
   * @returns {*}
   */
  async listWebhookNotifications(params: ListWebhookNotificationsOptions = {}): Promise<any> {
    const query: any = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }
    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    return this.get(this.url('/webhooks/notifications')).query(query).result();
  }

  /**
   * Simulate a user webhook
   *
   * @param params
   * @returns {*}
   */
  async simulateWebhook(params: BitGoSimulateWebhookOptions): Promise<any> {
    common.validateParams(params, ['webhookId', 'blockId'], []);
    if (!_.isString(params.webhookId)) {
      throw new Error('required string webhookId');
    }

    if (!_.isString(params.blockId)) {
      throw new Error('required string blockId');
    }

    return this.post(this.url(`/webhooks/${params.webhookId}/simulate`))
      .send(params)
      .result();
  }

  /**
   * Synchronously get constants which are relevant to the client.
   *
   * Note: This function has a known race condition. It may return different values over time,
   * especially if called shortly after creation of the BitGo object.
   *
   * New code should call fetchConstants() directly instead.
   *
   * @deprecated
   * @return {Object} The client constants object
   */
  getConstants(): any {
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

  /**
   * V1 method for calculating miner fee amounts, given the number and
   * type of transaction inputs, along with a fee rate in satoshis per vkB.
   *
   * This method should not be used for new code.
   *
   * @deprecated
   * @param params
   * @return {any}
   */
  async calculateMinerFeeInfo(params: any): Promise<any> {
    return TransactionBuilder.calculateMinerFeeInfo(params);
  }

}
