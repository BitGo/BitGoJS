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
const bitcoin = require('bitgo-bitcoinjs-lib');
const prova = require('../prova');
const Promise = require('bluebird');
const sjcl = require('../sjcl.min');

const BaseCoin = function(bitgo, coin) {
  const coinInstance = BaseCoin.initializeCoin(coin, bitgo);
  coinInstance.bitgo = bitgo;

  coinInstance.type = coin;

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
};

BaseCoin.initializeCoin = function(coin, bitgo) {
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
      txrp: require('./coins/txrp')
    };
  }
  if (!Token) {
    Token = require('./coins/token');
  }

  const tokens = bitgo.getConstants().eth.tokens;
  tokens.forEach((token) => {
    if (!coinGenerators[token.type]) {
      coinGenerators[token.type] = Token(token);
    }
  });

  const CoinGenerator = coinGenerators[coin];
  if (!CoinGenerator) {
    throw new Error('Coin or token type ' + coin + ' not supported');
  }
  return new CoinGenerator();
};

/**
 * Convert a currency amount represented in base units (satoshi, wei, atoms, drops) to big units (btc, eth, rmg, xrp)
 * @param baseUnits
 */
BaseCoin.prototype.baseUnitsToBigUnits = function(baseUnits) {
  const dividend = this.getBaseFactor();
  const bigNumber = new BigNumber(baseUnits).dividedBy(dividend);
  return bigNumber.toFormat();
};

/**
 * Verify that a transaction prebuild complies with the original intention
 */
BaseCoin.prototype.verifyTransaction = Promise.method(function() {
  return true;
});

/**
 * Verify that an address belongs to a wallet
 * @returns {boolean}
 */
BaseCoin.prototype.verifyAddress = function() {
  return true;
};

/**
 * Check whether a coin supports blockTarget for transactions to be included in
 * @returns {boolean}
 */
BaseCoin.prototype.supportsBlockTarget = function() {
  return false;
};

/**
 * If a coin needs to add additional parameters to the wallet generation, it does it in this method
 * @param walletParams
 * @return {*}
 */
BaseCoin.prototype.supplementGenerateWallet = Promise.method(function(walletParams) {
  return walletParams;
});

BaseCoin.prototype.newWalletObject = function(walletParams) {
  if (!Wallet) {
    Wallet = require('./wallet');
  }
  return new Wallet(this.bitgo, this, walletParams);
};

BaseCoin.prototype.toJSON = function() {
  return undefined;
};

/**
 * The cold wallet tool uses this function to derive an extended key that is based on the passed key and seed
 * @param key
 * @param seed
 * @returns {{key: *, derivationPath: string}}
 */
BaseCoin.prototype.deriveKeyWithSeed = function({ key, seed }) {
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
};

/**
 * Perform additional checks before adding a bitgo key. Base controller
 * is a no-op, but coin-specific controller may do something
 * @param params
 */
BaseCoin.prototype.preCreateBitGo = function(params) {
  return;
};

BaseCoin.prototype.initiateRecovery = function(params) {
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
      const userHDNode = prova.HDNode.fromBase58(userKey);
      return Promise.resolve(userHDNode);
    } catch (e) {
      throw new Error('Failed to decrypt user key with passcode - try again!');
    }
  };

  const self = this;
  return Promise.try(function() {
    // TODO: Arik add Ledger support
    return validatePassphraseKey(userKey, passphrase);
  })
  .then(function(key) {
    keys.push(key);
    // Validate the backup key
    try {
      if (!backupKey.startsWith('xprv')) {
        backupKey = sjcl.decrypt(passphrase, backupKey);
      }
      const backupHDNode = prova.HDNode.fromBase58(backupKey);
      keys.push(backupHDNode);
    } catch (e) {
      throw new Error('Failed to decrypt backup key with passcode - try again!');
    }
    try {
      const bitgoHDNode = prova.HDNode.fromBase58(bitgoXpub);
      keys.push(bitgoHDNode);
    } catch (e) {
      if (self.getFamily() !== 'xrp') {
        // in XRP recoveries, the BitGo xpub is optional
        throw new Error('Failed to parse bitgo xpub!');
      }
    }
    // Validate the destination address
    if (!self.isValidAddress(destinationAddress)) {
      throw new Error('Invalid destination address!');
    }

    return keys;
  });
};

module.exports = BaseCoin;
