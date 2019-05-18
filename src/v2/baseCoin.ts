let Keychains;
const BigNumber = require('bignumber.js');
let Enterprises;
let PendingApprovals;
let Wallet;
let Wallets;
let Markets;
let Token;
let OFCToken;
let Webhooks;
let coinGenerators;
import bitcoin = require('bitgo-utxo-lib');
const bitcoinMessage = require('bitcoinjs-message');
const Promise = require('bluebird');
const co = Promise.coroutine;
const errors = require('../errors');
const _ = require('lodash');

class BaseCoin {

  public bitgo;

  static getInstance(bitgo, coin) {
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

  static setupTokens(coins, bitgo) {
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


  static setupOffchainTokens(coins, bitgo) {
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

  static initializeCoin(coin, bitgo) {
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
  getChain() {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Name of the coin family (eg. for tbtc, this would be btc)
   */
  getFamily() {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Human readable full name for the coin
   */
  getFullName() {
    throw new Error('Basecoin method not implemented');
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return false;
  }

  getBaseFactor() {
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
  verifyTransaction(params, callback) {
    return Promise.resolve(true);
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
  supplementGenerateWallet(walletParams) {
    return Promise.resolve(walletParams);
  }

  /**
   * Get extra parameters for prebuilding a tx. Add things like hop transaction params
   */
  getExtraPrebuildParams(buildParams, callback) {
    return Promise.method(function() {
      return { };
    }).call(this).asCallback(callback);
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  postProcessPrebuild(prebuildResponse, callback) {
    return Promise.method(function() {
      return prebuildResponse;
    }).call(this).asCallback(callback);
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   */
  presignTransaction(params, callback) {
    return Promise.method(function() {
      return params;
    }).call(this).asCallback(callback);
  }

  newWalletObject(walletParams) {
    if (!Wallet) {
      Wallet = require('./wallet');
    }
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
  feeEstimate(params, callback) {
    return co(function *coFeeEstimate() {
      const query : any = {};
      if (params && params.numBlocks) {
        query.numBlocks = params.numBlocks;
      }

      return this.bitgo.get(this.url('/tx/fee')).query(query).result();
    }).call(this).asCallback(callback);
  }

  /**
   * The cold wallet tool uses this function to derive an extended key that is based on the passed key and seed
   * @param key
   * @param seed
   * @returns {{key: *, derivationPath: string}}
   */
  deriveKeyWithSeed({ key, seed }) {
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
  preCreateBitGo(params) {
    return;
  }

  initiateRecovery(params) {
    return co(function *initiateRecovery() {
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

      const key = yield validatePassphraseKey(userKey, passphrase);

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
    }).call(this);
  }

  // Some coins can have their tx info verified, if a public tx decoder is available
  verifyRecoveryTransaction(txInfo) {
    // yieldable no-op
    return Promise.reject(new errors.MethodNotImplementedError());
  }

  parseTransaction(params, callback) {
    return Promise.resolve({});
  }

  /**
   * Generate a key pair on the curve used by the coin
   *
   * @param seed
   */
  generateKeyPair(seed) {
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

}


export = BaseCoin;
