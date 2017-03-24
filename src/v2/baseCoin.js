var Keychains;
var Wallet;
var Wallets;
var coinInstances;

var BaseCoin = function(bitgo, coin) {
  this.bitgo = bitgo;
  this.initializeCoin(coin);

  var self = this;

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

};

BaseCoin.prototype.initializeCoin = function(coin) {
  if (!coinInstances) {
    // initialization has to be asynchronous to avoid circular dependencies
    coinInstances = {
      btc: require('./coins/btc'),
      tbtc: require('./coins/tbtc'),
      rmg: require('./coins/rmg'),
      trmg: require('./coins/trmg')
    };
  }

  var coinInstance = coinInstances[coin];
  if (!coinInstance) {
    throw new Error('Coin type ' + coin + ' not supported');
  }
  coinInstance.call(this);
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
