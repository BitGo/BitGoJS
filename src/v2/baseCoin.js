var Keychains;
var PendingApprovals;
var Wallet;
var Wallets;
var coinInstances;

var BaseCoin = function(bitgo, coin) {
  this.bitgo = bitgo;
  this.initializeCoin(coin);

  var self = this;
  this.type = coin;

  this.url = function(suffix) {
    return bitgo._baseUrl + '/api/v2/' + coin + suffix;
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
  }
};

BaseCoin.prototype.initializeCoin = function(coin) {
  if (!coinInstances) {
    // initialization has to be asynchronous to avoid circular dependencies
    coinInstances = {
      btc: require('./coins/btc'),
      tbtc: require('./coins/tbtc'),
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

module.exports = BaseCoin;
