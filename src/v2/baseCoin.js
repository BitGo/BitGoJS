var Keychains;
var BigNumber = require('bignumber.js');
var PendingApprovals;
var Wallet;
var Wallets;
var coinInstances;
var bitcoin = require('bitcoinjs-lib');
var prova = require('../prova');
var Q = require('q');
var sjcl = require('../sjcl.min');

var BaseCoin = function(bitgo, coin) {
  this.bitgo = bitgo;
  this.initializeCoin(coin);

  var self = this;
  this.type = coin;

  this.url = (suffix) => {
    return bitgo._baseUrl + '/api/v2/' + this.getChain() + suffix;
  };

  this.wallets = function() {
    if (!self.coinWallets) {
      if (!Wallets) {
        Wallets = require('./wallets');
      }
      self.coinWallets = new Wallets(bitgo, this);
    }
    return self.coinWallets;
  };

  this.keychains = function() {
    if (!self.coinKeychains) {
      if (!Keychains) {
        Keychains = require('./keychains');
      }
      self.coinKeychains = new Keychains(bitgo, this);
    }
    return self.coinKeychains;
  };

  this.pendingApprovals = function() {
    if (!self.coinPendingApprovals) {
      if (!PendingApprovals) {
        PendingApprovals = require('./pendingApprovals');
      }
      self.coinPendingApprovals = new PendingApprovals(bitgo, this);
    }
    return self.coinPendingApprovals;
  };
};

BaseCoin.prototype.initializeCoin = function(coin) {
  if (!coinInstances) {
    // initialization has to be asynchronous to avoid circular dependencies
    coinInstances = {
      btc: require('./coins/btc'),
      tbtc: require('./coins/tbtc'),
      bch: require('./coins/bch'),
      tbch: require('./coins/tbch'),
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

  var coinInstance = coinInstances[coin];
  if (!coinInstance) {
    throw new Error('Coin type ' + coin + ' not supported');
  }
  coinInstance.call(this);
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
 * If a coin needs to add additional parameters to the wallet generation, it does it in this method
 * @param walletParams
 * @return {*}
 */
BaseCoin.prototype.supplementGenerateWallet = function(walletParams) {
  return walletParams;
};

BaseCoin.prototype.newWalletObject = function(walletParams) {
  if (!Wallet) {
    Wallet = require('./wallet');
  }
  return new Wallet(this.bitgo, this, walletParams);
};

BaseCoin.prototype.toJSON = function() {
  return undefined;
};

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
      return Q(userHDNode);
    } catch (e) {
      throw new Error('Failed to decrypt user key with passcode - try again!');
    }
  };

  const self = this;
  return Q.try(function() {
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
