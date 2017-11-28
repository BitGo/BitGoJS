const common = require('../common');
const crypto = require('crypto');
const prova = require('../prova');
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;

const Keychains = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
};

Keychains.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['xpub', 'ethAddress'], callback);

  if (!params.id) {
    throw new Error('id must be defined');
  }

  const id = params.id;
  return this.bitgo.get(this.baseCoin.url('/key/' + encodeURIComponent(id)))
  .result()
  .nodeify(callback);
};

Keychains.prototype.create = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  let seed;
  if (!params.seed) {
    // An extended private key has both a normal 256 bit private key and a 256
    // bit chain code, both of which must be random. 512 bits is therefore the
    // maximum entropy and gives us maximum security against cracking.
    seed = crypto.randomBytes(512 / 8);
  } else {
    seed = params.seed;
  }

  const extendedKey = prova.HDNode.fromSeedBuffer(seed);
  const xpub = extendedKey.neutered().toBase58();
  return {
    pub: xpub,
    prv: extendedKey.toBase58()
  };
};

Keychains.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['pub', 'encryptedPrv', 'type', 'source', 'originalPasscodeEncryptionCode', 'enterprise'], callback);

  return this.bitgo.post(this.baseCoin.url('/key'))
  .send({
    pub: params.pub,
    encryptedPrv: params.encryptedPrv,
    type: params.type,
    source: params.source,
    provider: params.provider,
    originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
    enterprise: params.enterprise
  })
  .result()
  .nodeify(callback);
};

Keychains.prototype.createBitGo = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  params.source = 'bitgo';

  this.baseCoin.preCreateBitGo(params);

  return this.add(params, callback);
};

Keychains.prototype.createBackup = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['provider'], callback);
    params.source = 'backup';

    if (!params.provider) {
      // if the provider is undefined, we generate a local key and add the source details
      const key = this.create();
      _.extend(params, key);
    }

    const serverResponse = yield this.add(params, callback);
    return _.extend({}, serverResponse, _.pick(params, ['prv', 'encryptedPrv', 'provider', 'source']));
  }).call(this).asCallback(callback);
};


module.exports = Keychains;
