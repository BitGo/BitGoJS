let Keychains;
const BigNumber = require('bignumber.js');
let Enterprises;
let PendingApprovals;
let Wallet;
let Wallets;
let Markets;
let Token;
let Webhooks;
let coinGenerators;
const bitcoin = require('bitgo-utxo-lib');
const bitcoinMessage = require('bitcoinjs-message');
const Promise = require('bluebird');
const co = Promise.coroutine;
const sjcl = require('../sjcl.min');

class BaseCoin {

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

  static initializeCoin(coin, bitgo) {
    if (!coinGenerators) {
      // initialization has to be asynchronous to avoid circular dependencies
      coinGenerators = {
        btc: require('./coins/btc'),
        tbtc: require('./coins/tbtc'),
        bch: require('./coins/bch'),
        tbch: require('./coins/tbch'),
        btg: require('./coins/btg'),
        tbtg: require('./coins/tbtg'),
        ltc: require('./coins/ltc'),
        tltc: require('./coins/tltc'),
        eth: require('./coins/eth'),
        teth: require('./coins/teth'),
        rmg: require('./coins/rmg'),
        trmg: require('./coins/trmg'),
        xrp: require('./coins/xrp'),
        txrp: require('./coins/txrp'),
        xlm: require('./coins/xlm'),
        txlm: require('./coins/txlm'),
        dash: require('./coins/dash'),
        tdash: require('./coins/tdash'),
        zec: require('./coins/zec'),
        tzec: require('./coins/tzec')
      };
    }
    if (!Token) {
      Token = require('./coins/token');
    }

    const tokens = bitgo.getConstants().eth.tokens;
    tokens.forEach((tokenConfig) => {
      const generatedToken = Token.generateToken(tokenConfig);
      if (!coinGenerators[tokenConfig.type]) {
        coinGenerators[tokenConfig.type] = generatedToken;
      }
      // users can specify a coin by the token contract hash
      if (!coinGenerators[tokenConfig.tokenContractAddress]) {
        coinGenerators[tokenConfig.tokenContractAddress] = generatedToken;
      }
    });

    const CoinGenerator = coinGenerators[coin];
    if (!CoinGenerator) {
      const ethCoin = new coinGenerators['eth']();
      if (ethCoin.isValidAddress(coin)) {
        // return a token which we don't support but can sign
        const unknownToken = Token.generateToken({ type: 'unknown', coin: 'eth', network: 'Mainnet', name: 'Unknown', tokenContractAddress: coin, decimalPlaces: 0 });
        return new unknownToken();
      } else {
        throw new Error('Coin or token type ' + coin + ' not supported');
      }
    }
    return new CoinGenerator();
  }

  /**
   * Convert a currency amount represented in base units (satoshi, wei, atoms, drops, stroops)
   * to big units (btc, eth, rmg, xrp, xlm)
   * @param baseUnits
   */
  baseUnitsToBigUnits(baseUnits) {
    const dividend = this.getBaseFactor();
    const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
    return bigNumber.toFormat();
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
    const privateKeyBuffer = privateKey.d.toBuffer();
    const isCompressed = privateKey.compressed;
    const prefix = bitcoin.networks.bitcoin.messagePrefix;
    return bitcoinMessage.sign(message, privateKeyBuffer, isCompressed, prefix);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   */
  verifyTransaction() {
    return Promise.resolve(true);
  }

  /**
   * Verify that an address belongs to a wallet
   * @returns {boolean}
   */
  verifyAddress() {
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
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  postProcessPrebuild(prebuildResponse) {
    return Promise.method(function() {
      return prebuildResponse;
    }).call(this);
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
      const query = {};
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
      const keys = [];
      const userKey = params.userKey; // Box A
      let backupKey = params.backupKey; // Box B
      const bitgoXpub = params.bitgoKey; // Box C
      const destinationAddress = params.recoveryDestination;
      const passphrase = params.walletPassphrase;

      const validatePassphraseKey = function(userKey, passphrase) {
        try {
          if (!userKey.startsWith('xprv')) {
            userKey = sjcl.decrypt(passphrase, userKey);
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
        if (!backupKey.startsWith('xprv')) {
          backupKey = sjcl.decrypt(passphrase, backupKey);
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
    return Promise.reject(new Error('BaseCoin method not implemented'));
  }

  parseTransaction() {
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

}


module.exports = BaseCoin;
