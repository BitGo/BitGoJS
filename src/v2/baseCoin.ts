let Keychains;
let Enterprises;
let PendingApprovals;
let Wallet;
let Wallets;
let Markets;
let Token;
let OFCToken;
let Webhooks;
let coinGenerators;
import BigNumber from 'bignumber.js';
import bitcoin = require('bitgo-utxo-lib');
import bitcoinMessage = require('bitcoinjs-message');
import errors = require('../errors');
import * as _ from 'lodash';

abstract class BaseCoin {

  private bitgo;
  private type;
  public url;
  public wallets;
  private coinWallets;
  public enterprises;
  private coinEnterprises;
  public keychains;
  private coinKeychains;
  public webhooks;
  private coinWebhooks;
  public pendingApprovals;
  private coinPendingApprovals;
  public markets;
  private coinMarkets;

  public static getInstance(bitgo, coin): BaseCoin {
    const coinInstance = BaseCoin.initializeCoin(coin, bitgo);
    coinInstance.bitgo = bitgo;
    // Incase of a token, the type is already set
    // We don't want to override it because it can be instantiated with contract hash directly as well
    if (coinInstance.getFullName() !== 'ERC20 Token') {
      coinInstance.type = coin;
    }

    coinInstance.url = (suffix) => {
      return bitgo._baseUrl + '/api/v2/' + coinInstance.getChain() + suffix;
    };

    coinInstance.wallets = function() {
      if (!coinInstance.coinWallets) {
        if (!Wallets) {
          Wallets = require('./wallets');
        }
        coinInstance.coinWallets = new Wallets(bitgo, coinInstance);
      }
      return coinInstance.coinWallets;
    };

    coinInstance.enterprises = function() {
      if (!coinInstance.coinEnterprises) {
        if (!Enterprises) {
          Enterprises = require('./enterprises');
        }
        coinInstance.coinEnterprises = new Enterprises(bitgo, coinInstance);
      }
      return coinInstance.coinEnterprises;
    };

    coinInstance.keychains = function() {
      if (!coinInstance.coinKeychains) {
        if (!Keychains) {
          Keychains = require('./keychains');
        }
        coinInstance.coinKeychains = new Keychains(bitgo, coinInstance);
      }
      return coinInstance.coinKeychains;
    };

    coinInstance.webhooks = function() {
      if (!coinInstance.coinWebhooks) {
        if (!Webhooks) {
          Webhooks = require('./webhooks');
        }
        coinInstance.coinWebhooks = new Webhooks(bitgo, coinInstance);
      }
      return coinInstance.coinWebhooks;
    };

    coinInstance.pendingApprovals = function() {
      if (!coinInstance.coinPendingApprovals) {
        if (!PendingApprovals) {
          PendingApprovals = require('./pendingApprovals');
        }
        coinInstance.coinPendingApprovals = new PendingApprovals(bitgo, coinInstance);
      }
      return coinInstance.coinPendingApprovals;
    };

    coinInstance.markets = function() {
      if (!coinInstance.coinMarkets) {
        if (!Markets) {
          Markets = require('./markets');
        }
        coinInstance.coinMarkets = new Markets(bitgo, this);
      }
      return coinInstance.coinMarkets;
    };

    return coinInstance;
  }

  private static setupTokens(coins, bitgo) {
    if (!Token) {
      Token = require('./coins/token');
    }

    const tokens = bitgo.getConstants().eth.tokens;
    tokens.forEach((tokenConfig) => {
      const generatedToken = Token.generateToken(tokenConfig);
      if (!coins[tokenConfig.type]) {
        coins[tokenConfig.type] = generatedToken;
      }
      // users can specify a coin by the token contract hash
      if (!coins[tokenConfig.tokenContractAddress]) {
        coins[tokenConfig.tokenContractAddress] = generatedToken;
      }
    });
  }


  private static setupOffchainTokens(coins, bitgo) {
    if (!OFCToken) {
      OFCToken = require('./coins/ofcToken');
    }

    const constants = bitgo.getConstants();
    const tokens = _.get(constants, 'ofc.tokens');
    if (tokens) {
      tokens.forEach((tokenConfig) => {
        const generatedToken = OFCToken.generateToken(tokenConfig);
        if (!coins[tokenConfig.type]) {
          coins[tokenConfig.type] = generatedToken;
        }
      });
    }
  }
  /**
   * This feature is mostly for browsers where we don't want to have a build with coins that people don't need
   * In order to specify the coins you want, you must pass the env.coins="csv coins"
   * If nothing is passed, all coins are going to be available.
   * In webpack, we have to define via plugin what we want. to exclude but also we want to include the coins if the
   * user didn't specify anything or in node environments
   * @returns {}
   */
  static getCoinsToInitialize(bitgo) {
    const coins: any = {};

    if (process.env.BITGO_EXCLUDE_BTC !== 'exclude') {
      coins.btc = require('./coins/btc');
      coins.tbtc = require('./coins/tbtc');
    }

    if (process.env.BITGO_EXCLUDE_BCH !== 'exclude') {
      coins.bch = require('./coins/bch');
      coins.tbch = require('./coins/tbch');
    }

    if (process.env.BITGO_EXCLUDE_BSV !== 'exclude') {
      coins.bsv = require('./coins/bsv');
      coins.tbsv = require('./coins/tbsv');
    }

    if (process.env.BITGO_EXCLUDE_BTG !== 'exclude') {
      coins.btg = require('./coins/btg');
      coins.tbtg = require('./coins/tbtg');
    }

    if (process.env.BITGO_EXCLUDE_LTC !== 'exclude') {
      coins.ltc = require('./coins/ltc');
      coins.tltc = require('./coins/tltc');
    }

    if (process.env.BITGO_EXCLUDE_ETH !== 'exclude') {
      coins.eth = require('./coins/eth');
      coins.teth = require('./coins/teth');

      // Initialize the tokens
      BaseCoin.setupTokens(coins, bitgo);
    }

    if (process.env.BITGO_EXCLUDE_RMG !== 'exclude') {
      coins.rmg = require('./coins/rmg');
      coins.trmg = require('./coins/trmg');
    }

    if (process.env.BITGO_EXCLUDE_XRP !== 'exclude') {
      coins.xrp = require('./coins/xrp');
      coins.txrp = require('./coins/txrp');
    }

    if (process.env.BITGO_EXCLUDE_XLM !== 'exclude') {
      coins.xlm = require('./coins/xlm');
      coins.txlm = require('./coins/txlm');
    }

    if (process.env.BITGO_EXCLUDE_DASH !== 'exclude') {
      coins.dash = require('./coins/dash');
      coins.tdash = require('./coins/tdash');
    }

    if (process.env.BITGO_EXCLUDE_ZEC !== 'exclude') {
      coins.zec = require('./coins/zec');
      coins.tzec = require('./coins/tzec');
    }

    if (process.env.BITGO_EXCLUDE_OFC !== 'exclude') {
      coins.ofc = require('./coins/ofc');

      // Initialize the tokens
      BaseCoin.setupOffchainTokens(coins, bitgo);
    }

    if (process.env.BITGO_EXCLUDE_SUSD !== 'exclude') {
      coins.susd = require('./coins/susd');
      coins.tsusd = require('./coins/tsusd');
    }

    return coins;
  }

  public static initializeCoin(coin, bitgo): BaseCoin {
    if (!coinGenerators) {
      // initialization has to be asynchronous to avoid circular dependencies
      coinGenerators = BaseCoin.getCoinsToInitialize(bitgo);
    }

    const CoinGenerator = coinGenerators[coin];
    if (!CoinGenerator && coinGenerators['eth']) {
      const ethCoin = new coinGenerators['eth']();
      if (ethCoin.isValidAddress(coin)) {
        // return a token which we don't support but can sign
        const unknownToken = Token.generateToken({ type: 'unknown', coin: 'eth', network: 'Mainnet', name: 'Unknown', tokenContractAddress: coin, decimalPlaces: 0 });
        return new unknownToken();
      }
    }

    if (!CoinGenerator) {
      throw new errors.UnsupportedCoinError(coin);
    }

    return new CoinGenerator();
  }


  /**
   * Name of the chain which supports this coin (eg, 'btc', 'eth')
   */
  public abstract getChain();

  /**
   * Name of the coin family (eg. for tbtc, this would be btc)
   */
  public abstract getFamily();

  /**
   * Human readable full name for the coin
   */
  public abstract getFullName();

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  public valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  public transactionDataAllowed() {
    return false;
  }

  /**
   * Convert a currency amount represented in base units (satoshi, wei, atoms, drops, stroops)
   * to big units (btc, eth, rmg, xrp, xlm)
   * @param {string|number} baseUnits
   * @returns {string}
   */
  public baseUnitsToBigUnits(baseUnits) {
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
  public bigUnitsToBaseUnits(bigUnits) {
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
  public signMessage(key, message) {
    const privateKey = bitcoin.HDNode.fromBase58(key.prv).getKey();
    const privateKeyBuffer = privateKey.d.toBuffer();
    const isCompressed = privateKey.compressed;
    const prefix = bitcoin.networks.bitcoin.messagePrefix;
    return bitcoinMessage.sign(message, privateKeyBuffer, isCompressed, prefix);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   */
  public async verifyTransaction() {
    return true;
  }

  /**
   * Verify that an address belongs to a wallet
   * @returns {boolean}
   */
  public verifyAddress() {
    return true;
  }

  /**
   * Check whether a coin supports blockTarget for transactions to be included in
   * @returns {boolean}
   */
  public supportsBlockTarget() {
    return false;
  }

  /**
   * If a coin needs to add additional parameters to the wallet generation, it does it in this method
   * @param walletParams
   * @return {*}
   */
  public abstract async supplementGenerateWallet(walletParams);

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  public abstract async postProcessPrebuild(prebuildResponse);

  public newWalletObject(walletParams) {
    if (!Wallet) {
      Wallet = require('./wallet');
    }
    return new Wallet(this.bitgo, this, walletParams);
  }

  public abstract toJSON();

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {number} params.numBlocks The number of blocks to target for conformation (Only works for btc)
   * @returns {Object} The info returned from the merchant server
   */
  public async feeEstimate(params: { numBlocks?: number } = {}) {
    const query: any = {};
    if (params && params.numBlocks && _.isInteger(params.numBlocks)) {
      query.numBlocks = params.numBlocks;
    }

    return this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * The cold wallet tool uses this function to derive an extended key that is based on the passed key and seed
   * @param key
   * @param seed
   * @returns {{key: *, derivationPath: string}}
   */
  public deriveKeyWithSeed({ key, seed }) {
    const derivationPathInput = bitcoin.crypto.hash256(`${seed}`).toString('hex');
    const derivationPathParts = [
      parseInt(derivationPathInput.slice(0, 7), 16),
      parseInt(derivationPathInput.slice(7, 14), 16)
    ];
    const derivationPath = 'm/999999/' + derivationPathParts.join('/');
    const keyNode = bitcoin.HDNode.fromBase58(key);
    const derivedKeyNode = bitcoin.hdPath(keyNode).derive(derivationPath);
    return {
      key: derivedKeyNode.toBase58(),
      derivationPath: derivationPath
    };
  }

  /**
   * Perform additional checks before adding a bitgo key. Base controller
   * is a no-op, but coin-specific controller may do something
   * @param params
   */
  public preCreateBitGo() {}

  public async initiateRecovery(params) {
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
            password: passphrase
          });
        }
        const userHDNode = bitcoin.HDNode.fromBase58(userKey);
        return Promise.resolve(userHDNode);
      } catch (e) {
        throw new Error('Failed to decrypt user key with passcode - try again!');
      }
    };

    const key = await validatePassphraseKey(userKey, passphrase);

    keys.push(key);

    // Validate the backup key
    try {
      if (!backupKey.startsWith('xprv') && !isKrsRecovery && !backupKey.startsWith('xpub')) {
        backupKey = self.bitgo.decrypt({
          input: backupKey,
          password: passphrase
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
    if (!this.isValidAddress(destinationAddress)) {
      throw new Error('Invalid destination address!');
    }

    return keys;
  }

  // Some coins can have their tx info verified, if a public tx decoder is available
  public async verifyRecoveryTransaction(txInfo) {
    throw new errors.MethodNotImplementedError();
  };

  public abstract parseTransaction();

  /**
   * Generate a key pair on the curve used by the coin
   *
   * @param seed
   */
  public abstract generateKeyPair(seed): any;

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  public abstract isValidPub(pub): boolean;

  /**
   * Return wether the given m of n wallet signers/ key amounts are valid for the coin
   */
  public isValidMofNSetup({ m, n }) {
    return m === 2 && n === 3;
  }

  public abstract getBaseFactor(): string | number;
  public abstract isValidAddress(address): boolean;
}


module.exports = BaseCoin;
