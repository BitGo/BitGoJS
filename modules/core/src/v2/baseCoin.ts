/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import * as bitcoin from 'bitgo-utxo-lib';
import { hdPath } from '../bitcoin';
const bitcoinMessage = require('bitcoinjs-message');
import * as Bluebird from 'bluebird';
import * as errors from '../errors';
import { NodeCallback } from './types';
const co = Bluebird.coroutine;

import { Wallet } from './wallet';
import { Wallets } from './wallets';
import { Markets } from './markets';
import { Webhooks } from './webhooks';
import { PendingApprovals } from './pendingApprovals';
import { Keychains } from './keychains';
import { Enterprises } from './enterprises';
import { KeyPair } from './keychains';

export interface BaseCoinTransactionOutput {
  address: string;
  amount: string;
}

export interface BaseCoinTransactionFee {
  fee: string;
  feeRate?: number;
  size?: number;
}

export interface BaseCoinTransactionExplanation {
  displayOrder: string[];
  id: string;
  outputs: BaseCoinTransactionOutput[];
  outputAmount: string;
  changeOutputs: BaseCoinTransactionOutput[];
  changeAmount: string;
  fee: BaseCoinTransactionFee;
}

export abstract class BaseCoin {
  protected readonly bitgo;
  protected readonly _url: string;
  protected readonly _enterprises: Enterprises;
  protected readonly _wallets: Wallets;
  protected readonly _keychains: Keychains;
  protected readonly _webhooks: Webhooks;
  protected readonly _pendingApprovals;
  protected readonly _markets: Markets;

  protected constructor(bitgo) {
    this.bitgo = bitgo;
    this._url = this.bitgo._baseUrl + '/api/v2/';
    this._wallets = new Wallets(this.bitgo, this);
    this._keychains = new Keychains(this.bitgo, this);
    this._webhooks = new Webhooks(this.bitgo, this);
    this._pendingApprovals = new PendingApprovals(this.bitgo, this);
    this._enterprises = new Enterprises(this.bitgo, this);
    this._markets = new Markets(this.bitgo, this);
  }

  public url(suffix: string): string {
    return this._url + this.getChain() + suffix;
  }

  public wallets(): Wallets {
    return this._wallets;
  }

  public enterprises(): Enterprises {
    return this._enterprises;
  }

  public keychains(): any {
    return this._keychains;
  }

  public webhooks(): Webhooks {
    return this._webhooks;
  }

  public pendingApprovals(): any {
    return this._pendingApprovals;
  }

  public markets(): Markets {
    return this._markets;
  }

  public get type(): string {
    return this.getChain();
  }

  /**
   * Name of the chain which supports this coin (eg, 'btc', 'eth')
   */
  getChain(): string {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Name of the coin family (eg. for tbtc, this would be btc)
   */
  getFamily(): string {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Human readable full name for the coin
   */
  getFullName(): string {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor(): any {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Convert a currency amount represented in base units (satoshi, wei, atoms, drops, stroops)
   * to big units (btc, eth, rmg, xrp, xlm)
   * @param {string|number} baseUnits
   * @returns {string}
   */
  baseUnitsToBigUnits(baseUnits) {
    const dividend = this.getBaseFactor();
    const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
    // set the format so commas aren't added to large coin amounts
    return bigNumber.toFormat(null, null, { groupSeparator: '', decimalSeparator: '.' });
  }

  /**
   * Convert a currency amount represented in big units (btc, eth, rmg, xrp, xlm)
   * to base units (satoshi, wei, atoms, drops, stroops)
   * @param bigUnits
   */
  bigUnitsToBaseUnits(bigUnits) {
    const multiplier = this.getBaseFactor();
    const bigNumber = new BigNumber(bigUnits).times(multiplier);
    if (!bigNumber.isInteger()) {
      throw new Error(`non-integer output resulted from multiplying ${bigUnits} by ${multiplier}`);
    }
    return bigNumber.toFixed(0);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  signMessage(key, message) {
    const privateKey = bitcoin.HDNode.fromBase58(key.prv).getKey();
    const privateKeyBuffer = privateKey.d.toBuffer(32);
    const isCompressed = privateKey.compressed;
    const prefix = bitcoin.networks.bitcoin.messagePrefix;
    return bitcoinMessage.sign(message, privateKeyBuffer, isCompressed, prefix);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   */
  verifyTransaction(params, callback?: NodeCallback<any>) {
    return Bluebird.resolve(true).asCallback(callback);
  }

  /**
   * Verify that an address belongs to a wallet
   * @returns {boolean}
   */
  verifyAddress(params): any {
    return true;
  }

  /**
   * Check whether a coin supports blockTarget for transactions to be included in
   * @returns {boolean}
   */
  supportsBlockTarget() {
    return false;
  }

  /**
   * If a coin needs to add additional parameters to the wallet generation, it does it in this method
   * @param walletParams
   * @return {*}
   */
  supplementGenerateWallet(walletParams, keychains): Bluebird<any> {
    return Bluebird.resolve(walletParams);
  }

  /**
   * Get extra parameters for prebuilding a tx. Add things like hop transaction params
   */
  getExtraPrebuildParams(buildParams, callback?: NodeCallback<any>): Bluebird<any> {
    return Bluebird.method(function() {
      return {};
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  postProcessPrebuild(prebuildResponse, callback?: NodeCallback<any>): Bluebird<any> {
    return Bluebird.method(function() {
      return prebuildResponse;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   */
  presignTransaction(params, callback?: NodeCallback<any>): Bluebird<any> {
    return Bluebird.method(function() {
      return params;
    })
      .call(this)
      .asCallback(callback);
  }

  newWalletObject(walletParams) {
    return new Wallet(this.bitgo, this, walletParams);
  }

  toJSON() {
    return undefined;
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {Integer} params.numBlocks The number of blocks to target for conformation (Only works for btc)
   * @param callback
   * @returns {Object} The info returned from the merchant server
   */
  feeEstimate(params, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function* coFeeEstimate() {
      const query: any = {};
      if (params && params.numBlocks) {
        query.numBlocks = params.numBlocks;
      }

      return this.bitgo
        .get(this.url('/tx/fee'))
        .query(query)
        .result();
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * The cold wallet tool uses this function to derive an extended key that is based on the passed key and seed
   * @param key
   * @param seed
   * @returns {{key: string, derivationPath: string}}
   */
  deriveKeyWithSeed({ key, seed }: { key: string; seed: string }): { key: string; derivationPath: string } {
    const derivationPathInput = bitcoin.crypto.hash256(`${seed}`).toString('hex');
    const derivationPathParts = [
      parseInt(derivationPathInput.slice(0, 7), 16),
      parseInt(derivationPathInput.slice(7, 14), 16),
    ];
    const derivationPath = 'm/999999/' + derivationPathParts.join('/');
    const keyNode = bitcoin.HDNode.fromBase58(key);
    const derivedKeyNode = hdPath(keyNode).derive(derivationPath);
    return {
      key: derivedKeyNode.toBase58(),
      derivationPath: derivationPath,
    };
  }

  /**
   * Specifies what key we will need for signing - right now we just need the
   * user key.
   */
  keyIdsForSigning(): number[] {
    return [0];
  }

  /**
   * Perform additional checks before adding a bitgo key. Base controller
   * is a no-op, but coin-specific controller may do something
   * @param params
   */
  preCreateBitGo(params) {
    return;
  }

  initiateRecovery(params): Bluebird<any> {
    return co(function* initiateRecovery() {
      const self = this;
      const keys = [];
      const userKey = params.userKey; // Box A
      let backupKey = params.backupKey; // Box B
      const bitgoXpub = params.bitgoKey; // Box C
      const destinationAddress = params.recoveryDestination;
      const passphrase = params.walletPassphrase;

      const isKrsRecovery = backupKey.startsWith('xpub') && !userKey.startsWith('xpub');

      const validatePassphraseKey = function(userKey, passphrase) {
        try {
          if (!userKey.startsWith('xprv') && !userKey.startsWith('xpub')) {
            userKey = self.bitgo.decrypt({
              input: userKey,
              password: passphrase,
            });
          }
          const userHDNode = bitcoin.HDNode.fromBase58(userKey);
          return Promise.resolve(userHDNode);
        } catch (e) {
          throw new Error('Failed to decrypt user key with passcode - try again!');
        }
      };

      const key = yield validatePassphraseKey(userKey, passphrase);

      keys.push(key);

      // Validate the backup key
      try {
        if (!backupKey.startsWith('xprv') && !isKrsRecovery && !backupKey.startsWith('xpub')) {
          backupKey = self.bitgo.decrypt({
            input: backupKey,
            password: passphrase,
          });
        }
        const backupHDNode = bitcoin.HDNode.fromBase58(backupKey);
        keys.push(backupHDNode);
      } catch (e) {
        throw new Error('Failed to decrypt backup key with passcode - try again!');
      }
      try {
        const bitgoHDNode = bitcoin.HDNode.fromBase58(bitgoXpub);
        keys.push(bitgoHDNode);
      } catch (e) {
        if (this.getFamily() !== 'xrp') {
          // in XRP recoveries, the BitGo xpub is optional
          throw new Error('Failed to parse bitgo xpub!');
        }
      }
      // Validate the destination address
      try {
        if (!this.isValidAddress(destinationAddress)) {
          throw new Error('Invalid destination address!');
        }
      } catch (e) {
        // if isValidAddress is not implemented, assume the destination
        // address is valid and let the tx go through. If the destination
        // is actually invalid (`isValidAddress` returns false and does
        // not throw), this method will still throw
        if (!(e instanceof errors.MethodNotImplementedError)) {
          throw e;
        }
      }

      return keys;
    }).call(this);
  }

  // Some coins can have their tx info verified, if a public tx decoder is available
  verifyRecoveryTransaction(txInfo): Bluebird<any> {
    // yieldable no-op
    return Bluebird.reject(new errors.MethodNotImplementedError());
  }

  parseTransaction(params, callback?: NodeCallback<any>): Bluebird<any> {
    return Bluebird.resolve({});
  }

  /**
   * Generate a key pair on the curve used by the coin
   *
   * @param seed
   */
  generateKeyPair(seed): KeyPair {
    throw new Error('abstract method');
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Return wether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }) {
    return m === 2 && n === 3;
  }

  abstract isValidAddress(address: string): boolean;
}
