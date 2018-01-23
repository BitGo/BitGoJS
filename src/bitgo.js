//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

// signed commit test

const superagent = require('superagent');
const bitcoin = require('./bitcoin');
const bitcoinMessage = require('bitcoinjs-message');
const sanitizeHtml = require('sanitize-html');
const eol = require('eol');
const BaseCoin = require('./v2/baseCoin');
const Blockchain = require('./blockchain');
const EthBlockchain = require('./eth/ethBlockchain');
const Keychains = require('./keychains');
const TravelRule = require('./travelRule');
const Wallet = require('./wallet');
const EthWallet = require('./eth/ethWallet');
const Wallets = require('./wallets');
const EthWallets = require('./eth/ethWallets');
const Markets = require('./markets');
const PendingApprovals = require('./pendingapprovals');
const shamir = require('secrets.js-grempe');
const sjcl = require('./sjcl.min');
const bs58 = require('bs58');
const common = require('./common');
const Util = require('./util');
const Promise = require('bluebird');
const co = Promise.coroutine;
const pjson = require('../package.json');
const moment = require('moment');
const _ = require('lodash');
const url = require('url');
const querystring = require('querystring');

if (!process.browser) {
  require('superagent-proxy')(superagent);
}

// Patch superagent to return promises
const _end = superagent.Request.prototype.end;
superagent.Request.prototype.end = function(cb) {
  const self = this;
  if (typeof cb === 'function') {
    return _end.call(self, cb);
  }

  return new Promise.Promise(function(resolve, reject) {
    let error;
    try {
      return _end.call(self, function(error, response) {
        if (error) {
          return reject(error);
        }
        return resolve(response);
      });
    } catch (_error) {
      error = _error;
      return reject(error);
    }
  });
};

// Handle HTTP errors appropriately, returning the result body, or a named
// field from the body, if the optionalField parameter is provided.
superagent.Request.prototype.result = function(optionalField) {
  return this.then(handleResponseResult(optionalField), handleResponseError);
};

const handleResponseResult = function(optionalField) {
  return function(res) {
    if (_.isNumber(res.status) && res.status >= 200 && res.status < 300) {
      return optionalField ? res.body[optionalField] : res.body;
    }
    throw errFromResponse(res);
  };
};

const errFromResponse = function(res) {
  const errString = createResponseErrorString(res);
  const err = new Error(errString);

  err.status = res.status;
  if (res.body) {
    err.result = res.body;
  }
  if (_.has(res.headers, 'x-auth-required') && (res.headers['x-auth-required'] === 'true')) {
    err.invalidToken = true;
  }
  if (res.body.needsOTP) {
    err.needsOTP = true;
  }
  return err;
};

const handleResponseError = function(e) {
  if (e.response) {
    throw errFromResponse(e.response);
  }
  throw e;
};

/**
 * There are many ways a request can fail, and may ways information on that failure can be
 * communicated to the client. This function tries to handle those cases and create a sane error string
 * @param res Response from an HTTP request
 * @returns {String}
 */
const createResponseErrorString = function(res) {
  let errString = res.statusCode.toString(); // at the very least we'll have the status code
  if (res.body.error) {
    // this is the case we hope for, where the server gives us a nice error from the JSON body
    errString = res.body.error;
  } else {
    // things get messy from here on, we try different parts of the response, salvaging what we can
    if (res.res && res.res.statusMessage) {
      errString = errString + '\n' + res.res.statusMessage;
    }
    if (res.text) {
      // if the response came back as text, we try to parse it as HTML and remove all tags, leaving us
      // just the bare text, which we then trim of excessive newlines and limit to a certain length
      try {
        let sanitizedText = sanitizeHtml(res.text, { allowedTags: [] });
        sanitizedText = sanitizedText.trim();
        sanitizedText = eol.lf(sanitizedText); // use '\n' for all newlines
        sanitizedText = _.replace(sanitizedText, /\n[ |\t]{1,}\n/g, '\n\n'); // remove the spaces/tabs between newlines
        sanitizedText = _.replace(sanitizedText, /[\n]{3,}/g, '\n\n'); // have at most 2 consecutive newlines
        sanitizedText = sanitizedText.substring(0, 5000); // prevent message from getting too large
        errString = errString + '\n' + sanitizedText; // add it to our existing errString (at this point the more info the better!)
      } catch (e) {
        // do nothing, the response's HTML was too wacky to be parsed cleanly
      }
    }
  }

  return errString;
};

//
// Constructor for BitGo Object
// arguments:
//   @useProduction: flag to use the production bitcoin network rather than the
//                   testnet network.
//
let testNetWarningMessage = false;
const BitGo = function(params) {
  params = params || {};
  if (!common.validateParams(params, [], ['clientId', 'clientSecret', 'refreshToken', 'accessToken', 'userAgent', 'customRootURI', 'customBitcoinNetwork']) ||
    (params.useProduction && !_.isBoolean(params.useProduction))) {
    throw new Error('invalid argument');
  }

  if ((!params.clientId) !== (!params.clientSecret)) {
    throw new Error('invalid argument - must provide both client id and secret');
  }

  // By default, we operate on the test server.
  // Deprecate useProduction in the future
  let env;

  if (params.useProduction) {
    if (params.env && params.env !== 'prod') {
      throw new Error('cannot use useProduction when env=' + params.env);
    }
    env = 'prod';
  } else if (params.customRootURI ||
    params.customBitcoinNetwork ||
    params.customSigningAddress ||
    process.env.BITGO_CUSTOM_ROOT_URI ||
    process.env.BITGO_CUSTOM_BITCOIN_NETWORK) {
    env = 'custom';
    if (params.customRootURI) {
      common.Environments['custom'].uri = params.customRootURI;
    }
    if (params.customBitcoinNetwork) {
      common.Environments['custom'].network = params.customBitcoinNetwork;
    }
    if (params.customSigningAddress) {
      common.Environments['custom'].customSigningAddress = params.customSigningAddress;
    }
  } else {
    env = params.env || process.env.BITGO_ENV;
  }

  if (env === 'production') {
    env = 'prod'; // make life easier
  }

  if (env) {
    if (common.Environments[env]) {
      this._baseUrl = common.Environments[env].uri;
    } else {
      throw new Error('invalid environment ' + env + '. Supported environments: test, prod');
    }
  } else {
    env = 'test';
    if (!testNetWarningMessage) {
      testNetWarningMessage = true;
      console.log('BitGo SDK env not set - defaulting to test at test.bitgo.com.');
    }
  }
  this.env = env;

  common.setNetwork(common.Environments[env].network);
  common.setEthNetwork(common.Environments[env].ethNetwork);
  common.setRmgNetwork(common.Environments[env].rmgNetwork);

  if (!this._baseUrl) {
    this._baseUrl = common.Environments[env].uri;
  }

  this._baseApiUrl = this._baseUrl + '/api/v1';
  this._baseApiUrlV2 = this._baseUrl + '/api/v2';
  this._user = null;
  this._keychains = null;
  this._wallets = null;
  this._clientId = params.clientId;
  this._clientSecret = params.clientSecret;
  this._token = params.accessToken || null;
  this._refreshToken = params.refreshToken || null;
  this._userAgent = params.userAgent || 'BitGoJS/' + this.version();
  this._promise = Promise;

  // whether to perform extra client-side validation for some things, such as
  // address validation or signature validation. defaults to true, but can be
  // turned off by setting to false. can also be overridden individually in the
  // functions that use it.
  this._validate = params.validate === undefined ? true : params.validate;

  // Create superagent methods specific to this BitGo instance.
  this.request = {};
  const methods = ['get', 'post', 'put', 'del'];

  if (!params.proxy && process.env.BITGO_USE_PROXY) {
    params.proxy = process.env.BITGO_USE_PROXY;
  }

  if (process.browser && params.proxy) {
    throw new Error('cannot use https proxy params while in browser');
  }

  const self = this;

  // This is a patching function which can apply our authorization
  // headers to any outbound request.
  const createPatch = function(method) {
    return function() {
      let req = superagent[method].apply(null, arguments);
      if (params.proxy) {
        req = req.proxy(params.proxy);
      }

      // Patch superagent to return promises
      req.prototypicalEnd = req.end;
      req.end = function() {
        // intercept a request before it's submitted to the server for v2 authentication (based on token)
        const bitgo = self;
        this.set('BitGo-SDK-Version', bitgo.version());

        // if there is no token, and we're not logged in, the request cannot be v2 authenticated
        this.isV2Authenticated = true;
        this.authenticationToken = bitgo._token;
        // some of the older tokens appear to be only 40 characters long
        if ((bitgo._token && bitgo._token.length !== 67 && bitgo._token.indexOf('v2x') !== 0)
          || req.forceV1Auth) {
          // use the old method
          this.isV2Authenticated = false;

          this.set('Authorization', 'Bearer ' + bitgo._token);
          return this.prototypicalEnd.apply(this, arguments);
        }

        this.set('BitGo-Auth-Version', '2.0');
        // prevent IE from caching requests
        this.set('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT');
        if (bitgo._token) {

          // do a localized data serialization process
          let data = this._data;
          if (typeof data !== 'string') {
            function isJSON(mime) {
              return /[\/+]json\b/.test(mime);
            }

            let contentType = this.getHeader('Content-Type');
            // Parse out just the content type from the header (ignore the charset)
            if (contentType) {
              contentType = contentType.split(';')[0];
            }
            let serialize = superagent.serialize[contentType];
            if (!serialize && isJSON(contentType)) {
              serialize = superagent.serialize['application/json'];
            }
            if (serialize) {
              data = serialize(data);
            }
          }
          this._data = data;

          let urlDetails = url.parse(req.url);

          let queryString = null;
          if (req._query && req._query.length > 0) {
            // browser version
            queryString = req._query.join('&');
            req._query = [];
          } else if (req.qs) {
            // node version
            queryString = querystring.stringify(req.qs);
            req.qs = null;
          }

          if (queryString) {
            if (urlDetails.search) {
              urlDetails.search += '&' + queryString;
            } else {
              urlDetails.search = '?' + queryString;
            }
            req.url = urlDetails.format();
            urlDetails = url.parse(req.url);
          }

          const queryPath = (urlDetails.query && urlDetails.query.length > 0) ? urlDetails.path : urlDetails.pathname;
          const timestamp = Date.now();
          const signatureSubject = [timestamp, queryPath, data].join('|');

          this.set('Auth-Timestamp', timestamp);

          // calculate the SHA256 hash of the token
          const hashDigest = sjcl.hash.sha256.hash(bitgo._token);
          const hash = sjcl.codec.hex.fromBits(hashDigest);

          // we're not sending the actual token, but only its hash
          this.set('Authorization', 'Bearer ' + hash);

          // calculate the HMAC
          const hmacKey = sjcl.codec.utf8String.toBits(bitgo._token);
          const hmacDigest = (new sjcl.misc.hmac(hmacKey, sjcl.hash.sha256)).mac(signatureSubject);
          const hmac = sjcl.codec.hex.fromBits(hmacDigest);

          this.set('HMAC', hmac);
        }

        return this.prototypicalEnd.apply(this, arguments);
      };

      // verify that the response received from the server is signed correctly
      // right now, it is very permissive with the timestamp variance
      req.verifyResponse = function(response) {
        const bitgo = self;

        if (!req.isV2Authenticated || !req.authenticationToken) {
          return response;
        }

        const urlDetails = url.parse(req.url);

        // verify the HMAC and timestamp
        const timestamp = response.headers.timestamp;
        const queryPath = (urlDetails.query && urlDetails.query.length > 0) ? urlDetails.path : urlDetails.pathname;

        const signatureSubject = [timestamp, queryPath, response.statusCode, response.text].join('|');

        // calculate the HMAC
        const hmacKey = sjcl.codec.utf8String.toBits(req.authenticationToken);
        const hmacDigest = (new sjcl.misc.hmac(hmacKey, sjcl.hash.sha256)).mac(signatureSubject);
        const expectedHmac = sjcl.codec.hex.fromBits(hmacDigest);

        const receivedHmac = response.headers.hmac;
        if (expectedHmac !== receivedHmac) {
          const errorDetails = {
            expectedHmac,
            receivedHmac,
            hmacInput: signatureSubject,
            requestToken: req.authenticationToken,
            bitgoToken: bitgo._token
          };
          const error = new Error(`invalid response HMAC, possible man-in-the-middle-attack: ${JSON.stringify(errorDetails, null, 4)}`);
          error.result = errorDetails;
          error.status = 511;
          throw error;
        }
        return response;
      };

      let lastPromise = null;
      req.then = function() {

        if (!lastPromise) {
          const reference = req.end()
          .then(req.verifyResponse);
          lastPromise = reference.then.apply(reference, arguments);
        } else {
          lastPromise = lastPromise.then.apply(lastPromise, arguments);
        }

        return lastPromise;
      };

      if (!process.browser) {
        // If not in the browser, set the User-Agent. Browsers don't allow
        // setting of User-Agent, so we must disable this when run in the
        // browser (browserify sets process.browser).
        req.set('User-Agent', self._userAgent);
      }

      // Set the request timeout to just above 5 minutes by default
      req.timeout(process.env.BITGO_TIMEOUT * 1000 || 305 * 1000);
      return req;
    };
  };

  for (const index in methods) {
    const method = methods[index];
    self[method] = createPatch(method);
  }

  // Kick off first load of constants
  this.fetchConstants({}, function(err) {
    if (err) {
      // make sure an error does not terminate the entire script
      console.trace(err);
    }
  });
};

/**
 * Create a basecoin object
 * @param coinName
 */
BitGo.prototype.coin = function(coinName) {
  return BaseCoin(this, coinName);
};

/**
 * Create a basecoin object for a virtual token
 * @param tokenName
 */
BitGo.prototype.token = function(tokenName, callback) {
  return co(function *() {
    yield this.fetchConstants();
    return this.coin(tokenName);
  }).call(this).asCallback(callback);
};

// Accessor object for Ethereum methods
BitGo.prototype.eth = function() {
  const self = this;

  const ethBlockchain = function() {
    if (!self._ethBlockchain) {
      self._ethBlockchain = new EthBlockchain(self);
    }
    return self._ethBlockchain;
  };

  const ethWallets = function() {
    if (!self._ethWallets) {
      self._ethWallets = new EthWallets(self);
    }
    return self._ethWallets;
  };

  const newEthWalletObject = function(walletParams) {
    return new EthWallet(self, walletParams);
  };

  const verifyEthAddress = function(params) {
    params = params || {};
    common.validateParams(params, ['address'], []);

    const address = params.address;
    return address.indexOf('0x') === 0 && address.length === 42;
  };

  const retrieveGasBalance = function(params, callback) {
    return self.get(self.url('/eth/user/gas'))
    .result()
    .nodeify(callback);
  };

  return {
    blockchain: ethBlockchain,
    wallets: ethWallets,
    newWalletObject: newEthWalletObject,
    verifyAddress: verifyEthAddress,
    weiToEtherString: Util.weiToEtherString,
    gasBalance: retrieveGasBalance
  };
};

BitGo.prototype.getValidate = function() {
  return this._validate;
};

BitGo.prototype.setValidate = function(validate) {
  if (!_.isBoolean(validate)) {
    throw new Error('invalid argument');
  }
  this._validate = validate;
};

// Return the current BitGo environment
BitGo.prototype.getEnv = function() {
  return this.env;
};

BitGo.prototype.clear = function() {
  // TODO: are there any other fields which should be cleared?
  this._user = undefined;
  this._token = undefined;
  this._refreshToken = undefined;
  this._ecdhXprv = undefined;
};

// Helper function to return a rejected promise or call callback with error
BitGo.prototype.reject = function(msg, callback) {
  return Promise.reject(new Error(msg)).nodeify(callback);
};

//
// version
// Gets the version of the BitGoJS API
//
BitGo.prototype.version = function() {
  return pjson.version;
};

BitGo.prototype.toJSON = function() {
  return {
    user: this._user,
    token: this._token,
    extensionKey: this._extensionKey ? this._extensionKey.toWIF() : null
  };
};

BitGo.prototype.fromJSON = function(json) {
  this._user = json.user;
  this._token = json.token;
  if (json.extensionKey) {
    this._extensionKey = bitcoin.ECPair.fromWIF(json.extensionKey, bitcoin.getNetwork());
  }
};

BitGo.prototype.user = function() {
  return this._user;
};

BitGo.prototype.verifyAddress = function(params) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  let address;

  try {
    address = bitcoin.address.fromBase58Check(params.address);
  } catch (e) {
    return false;
  }

  const network = bitcoin.getNetwork();
  return address.version === network.pubKeyHash || address.version === network.scriptHash;
};

BitGo.prototype.verifyPassword = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['password'], []);

  if (!this._user || !this._user.username) {
    throw new Error('no current user');
  }
  const key = sjcl.codec.utf8String.toBits(this._user.username);
  const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  const hmacPassword = sjcl.codec.hex.fromBits(hmac.encrypt(params.password));

  return this.post(this.url('/user/verifypassword'))
  .send({ password: hmacPassword })
  .result('valid')
  .nodeify(callback);
};

//
// encrypt
// Utility function to encrypt locally.
//
BitGo.prototype.encrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['input', 'password'], []);

  // SJCL internally reuses salts for the same password, so we force a new random salt everytime
  // We use random.randomWords(2,0) because it's what SJCL uses for randomness by default
  const randomSalt = sjcl.random.randomWords(2, 0);
  const encryptOptions = { iter: 10000, ks: 256, salt: randomSalt };
  return sjcl.encrypt(params.password, params.input, encryptOptions);
};

/**
 *
 * @param params.password The password
 * @param params.input The input
 * @returns {*}
 */
BitGo.prototype.decrypt = function(params) {
  params = params || {};
  common.validateParams(params, ['input', 'password'], []);
  try {
    return sjcl.decrypt(params.password, params.input);
  } catch (error) {
    if (error.message.includes('ccm: tag doesn\'t match')) {
      error.message = 'password error - ' + error.message;
    }
    throw error;
  }
};

/**
 * Generate a random password on the client
 * @param   {Number} numWords     Number of 32-bit words
 * @returns {String}          base58 random password
 */
BitGo.prototype.generateRandomPassword = function(numWords = 5) {
  const bytes = sjcl.codec.bytes.fromBits(sjcl.random.randomWords(numWords));
  return bs58.encode(bytes);
};

/**
 *
 * @param seed A hexadecimal secret to split
 * @param passwords An array of the passwords used to encrypt each share
 * @param m The threshold number of shards necessary to reconstitute the secret
 * @returns {{xpub: *, xprv: *}}
 */
BitGo.prototype.splitSecret = function({ seed, passwords, m }) {
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
  const secrets = shamir.share(seed, n, m);
  const shards = _.zipWith(secrets, passwords, (shard, password) => {
    return this.encrypt({ input: shard, password });
  });
  const node = bitcoin.HDNode.fromSeedHex(seed);
  return {
    xpub: node.neutered().toBase58(),
    m,
    n,
    seedShares: shards
  };
};

/**
 *
 * @param shards
 * @param passwords
 * @returns {{xpub: *, xprv: *}}
 */
BitGo.prototype.reconstituteSecret = function({ shards, passwords }) {
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
  const seed = shamir.combine(secrets);
  const node = bitcoin.HDNode.fromSeedHex(seed);
  return {
    xpub: node.neutered().toBase58(),
    xprv: node.toBase58(),
    seed
  };
};

/**
 *
 * @param shards
 * @param passwords
 * @param m
 * @param xpub Optional xpub to verify the results against
 */
BitGo.prototype.verifyShards = function({ shards, passwords, m, xpub }) {
  /**
   * Generate all possible combinations of a given array's values given subset size m
   * @param array The array whose values are to be arranged in all combinations
   * @param m The size of each subset
   * @param entryIndices Recursively trailing set of currently chosen array indices for the combination subset under construction
   * @returns {Array}
   */
  const generateCombinations = (array, m, entryIndices = []) => {

    let combinations = [];

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
  const seeds = secretCombinations.map(currentCombination => {
    return shamir.combine(currentCombination);
  });
  const uniqueSeeds = _.uniq(seeds);
  if (uniqueSeeds.length !== 1) {
    return false;
  }
  const seed = _.first(uniqueSeeds);
  const node = bitcoin.HDNode.fromSeedHex(seed);
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
};

//
// ecdhSecret
// Construct an ECDH secret from a private key and other user's public key
//
BitGo.prototype.getECDHSecret = function(params) {
  params = params || {};
  common.validateParams(params, ['otherPubKeyHex'], []);

  if (!_.isObject(params.eckey)) {
    throw new Error('eckey object required');
  }

  const otherKeyPub = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(params.otherPubKeyHex, 'hex'));
  const secretPoint = otherKeyPub.Q.multiply(params.eckey.d);
  const secret = Util.bnToByteArrayUnsigned(secretPoint.affineX);
  return new Buffer(secret).toString('hex');
};

//
// user sharing keychain
// Gets the user's private keychain, used for receiving shares
BitGo.prototype.getECDHSharingKeychain = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], []);

  const self = this;

  return this.get(this.url('/user/settings'))
  .result()
  .then(function(result) {
    if (!result.settings.ecdhKeychain) {
      return self.reject('ecdh keychain not found for user', callback);
    }

    return self.keychains().get({ xpub: result.settings.ecdhKeychain });
  })
  .nodeify(callback);
};

/**
 * Get bitcoin market data
 */
BitGo.prototype.markets = function() {
  if (!this._markets) {
    this._markets = new Markets(this);
  }
  return this._markets;
};

//
// (Deprecated: Will be removed in the future) use bitgo.markets().latest()
// market
// Get the latest bitcoin prices.
//
BitGo.prototype.market = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/market/latest'))
  .result()
  .nodeify(callback);
};

//
// (Deprecated: Will be removed in the future) use bitgo.markets().yesterday()
// market data yesterday
// Get market data from yesterday
//
BitGo.prototype.yesterday = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/market/yesterday'))
  .result()
  .nodeify(callback);
};

/**
 * Synchronous method for activating an access token.
 * @param params
 *  - accessToken: the token to be used
 * @param callback
 */
BitGo.prototype.authenticateWithAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['accessToken'], [], callback);

  this._token = params.accessToken;
};

/**
 *
 * @param responseBody Response body object
 * @param password Password for the symmetric decryption
 */
BitGo.prototype.handleTokenIssuance = function(responseBody, password) {
  // make sure the response body contains the necessary properties
  common.validateParams(responseBody, ['derivationPath'], ['encryptedECDHXprv']);

  const serverXpub = common.Environments[this.env].serverXpub;
  let ecdhXprv = this._ecdhXprv;
  if (!ecdhXprv) {
    if (!password || !responseBody.encryptedECDHXprv) {
      throw new Error('ecdhXprv property must be set or password and encrypted encryptedECDHXprv must be provided');
    }
    try {
      ecdhXprv = this.decrypt({ input: responseBody.encryptedECDHXprv, password: password });
    } catch (e) {
      e.errorCode = 'ecdh_xprv_decryption_failure';
      console.error('Failed to decrypt encryptedECDHXprv.');
      throw e;
    }
  }

  // construct HDNode objects for client's xprv and server's xpub
  const clientHDNode = bitcoin.HDNode.fromBase58(ecdhXprv);
  const serverHDNode = bitcoin.HDNode.fromBase58(serverXpub);

  // BIP32 derivation path is applied to both client and server master keys
  const derivationPath = responseBody.derivationPath;
  const clientDerivedNode = bitcoin.hdPath(clientHDNode).derive(derivationPath);
  const serverDerivedNode = bitcoin.hdPath(serverHDNode).derive(derivationPath);

  // calculating one-time ECDH key
  const secretPoint = serverDerivedNode.keyPair.__Q.multiply(clientDerivedNode.keyPair.d);
  const secret = secretPoint.getEncoded().toString('hex');

  // decrypt token with symmetric ECDH key
  const response = {};
  try {
    response.token = this.decrypt({ input: responseBody.encryptedToken, password: secret });
  } catch (e) {
    e.errorCode = 'token_decryption_failure';
    console.error('Failed to decrypt token.');
    throw e;
  }
  if (!this._ecdhXprv) {
    response.ecdhXprv = ecdhXprv;
  }
  return response;
};

//
// authenticate
// Login to the bitgo system.
// Params:
// - forceV1Auth (boolean)
// Returns:
//   {
//     token: <user's token>,
//     user: <user object
//   }
BitGo.prototype.authenticate = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['username', 'password'], ['otp'], callback);

  const username = params.username.toLowerCase();
  const password = params.password;
  const otp = params.otp;
  const trust = params.trust;
  const forceV1Auth = !!params.forceV1Auth;

  // Calculate the password HMAC so we don't send clear-text passwords
  const key = sjcl.codec.utf8String.toBits(username);
  const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
  const hmacPassword = sjcl.codec.hex.fromBits(hmac.encrypt(password));

  const authParams = {
    email: username,
    password: hmacPassword,
    forceSMS: !!params.forceSMS
  };

  if (otp) {
    authParams.otp = otp;
    if (trust) {
      authParams.trust = 1;
    }
  }

  if (params.extensible) {
    this._extensionKey = bitcoin.makeRandomKey();
    authParams.extensible = true;
    authParams.extensionAddress = this._extensionKey.getAddress();
  }

  const self = this;
  if (this._token) {
    return this.reject('already logged in', callback);
  }

  const request = this.post(this.url('/user/login'));
  if (forceV1Auth) {
    request.forceV1Auth = true;
    // tell the server that the client was forced to downgrade the authentication protocol
    authParams.forceV1Auth = true;
  }
  return request.send(authParams)
  .then(function(response) {
    // extract body and user information
    const body = response.body;
    self._user = body.user;

    if (body.access_token) {
      self._token = body.access_token;
      // if the downgrade was forced, adding a warning message might be prudent
    } else {
      // check the presence of an encrypted ECDH xprv
      // if not present, legacy account
      const encryptedXprv = body.encryptedECDHXprv;
      if (!encryptedXprv) {
        throw new Error('Keychain needs encryptedXprv property');
      }

      const responseDetails = self.handleTokenIssuance(response.body, password);
      self._token = responseDetails.token;
      self._ecdhXprv = responseDetails.ecdhXprv;

      // verify the response's authenticity
      request.verifyResponse(response);

      // add the remaining component for easier access
      response.body.access_token = self._token;
    }

    return response;
  })
  .then(handleResponseResult(), handleResponseError)
  .nodeify(callback);
};

/**
 *
 * @param params
 * - operatingSystem: one of ios, android
 * - pushToken: hex-formatted token for the respective native push notification service
 * @param callback
 * @returns {*}
 */
BitGo.prototype.registerPushToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['pushToken', 'operatingSystem'], [], callback);

  if (!this._token) {
    // this device has to be registered to an extensible session
    return this.reject('not logged in', callback);
  }

  const postParams = _.pick(params, ['pushToken', 'operatingSystem']);

  return this.post(this.url('/devices'))
  .send(postParams)
  .result()
  .nodeify(callback);
};

/**
 *
 * @param params
 * - pushVerificationToken: the token received via push notification to confirm the device's mobility
 * @param callback
 */
BitGo.prototype.verifyPushToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['pushVerificationToken'], [], callback);

  if (!this._token) {
    // this device has to be registered to an extensible session
    return this.reject('not logged in', callback);
  }

  const postParams = _.pick(params, 'pushVerificationToken');

  return this.post(this.url('/devices/verify'))
  .send(postParams)
  .result()
  .nodeify(callback);
};

//
// authenticateWithAuthCode
// Login to the bitgo system using an authcode generated via Oauth
// Returns:
//   {
//     authCode: <authentication code sent from the BitGo OAuth redirect>
//   }
BitGo.prototype.authenticateWithAuthCode = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['authCode'], [], callback);

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  const authCode = params.authCode;

  const self = this;
  if (this._token) {
    return this.reject('already logged in', callback);
  }

  let token_result;

  const request = this.post(this._baseUrl + '/oauth/token');
  request.forceV1Auth = true; // OAuth currently only supports v1 authentication
  return request
  .send({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .result()
  .then(function(body) {
    token_result = body;
    self._token = body.access_token;
    self._refreshToken = body.refresh_token;
    return self.me();
  })
  .then(function(user) {
    self._user = user;
    return token_result;
  })
  .nodeify(callback);
};

//
// refreshToken
// Use refresh token to get new access token.
// If the refresh token is null/defined, then we use the stored token from auth
// Returns:
//   {
//     refreshToken: <optional refresh code sent from a previous authcode>
//   }
BitGo.prototype.refreshToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['refreshToken'], callback);

  const refreshToken = params.refreshToken || this._refreshToken;

  if (!refreshToken) {
    throw new Error('Must provide refresh token or have authenticated with Oauth before');
  }

  if (!this._clientId || !this._clientSecret) {
    throw new Error('Need client id and secret set first to use this');
  }

  const self = this;
  return this.post(this._baseUrl + '/oauth/token')
  .send({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: self._clientId,
    client_secret: self._clientSecret
  })
  .result()
  .then(function(body) {
    self._token = body.access_token;
    self._refreshToken = body.refresh_token;
    return body;
  })
  .nodeify(callback);
};

//
// listAccessTokens
// Get information on all of the BitGo access tokens on the user
// Returns:
// {
//    id: <id of the token>
//    label: <the user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.listAccessTokens = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/user/accesstoken'))
  .send()
  .result('accessTokens')
  .nodeify(callback);
};

//
// addAccessToken
// Add a BitGo API Access Token to the current user account
// Params:
// {
//    otp: (required) <valid otp code>
//    label: (required) <label for the token>
//    duration: <length of time in seconds the token will be valid for>
//    ipRestrict: <array of IP address strings to whitelist>
//    txValueLimit: <number of outgoing satoshis allowed on this token>
//    scope: (required) <authorization scope of the requested token>
// }
// Returns:
// {
//    id: <id of the token>
//    token: <access token hex string to be used for BitGo API request verification>
//    label: <user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.addAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['label'], ['otp'], callback);

  // check non-string params
  if (params.duration) {
    if (!_.isNumber(params.duration) || params.duration < 0) {
      throw new Error('duration must be a non-negative number');
    }
  }
  if (params.ipRestrict) {
    if (!_.isArray(params.ipRestrict)) {
      throw new Error('ipRestrict must be an array');
    }
    _.forEach(params.ipRestrict, function(ipAddr) {
      if (!_.isString(ipAddr)) {
        throw new Error('ipRestrict must be an array of IP address strings');
      }
    });
  }
  if (params.txValueLimit) {
    if (!_.isNumber(params.txValueLimit)) {
      throw new Error('txValueLimit must be a number');
    }
    if (params.txValueLimit < 0) {
      throw new Error('txValueLimit must be a non-negative number');
    }
  }
  if (params.scope && params.scope.length > 0) {
    if (!_.isArray(params.scope)) {
      throw new Error('scope must be an array');
    }
  } else {
    throw new Error('must specify scope for token');
  }

  const bitgo = this;

  const request = this.post(this.url('/user/accesstoken'));
  if (!bitgo._ecdhXprv) {
    // without a private key, the user cannot decrypt the new access token the server will send
    request.forceV1Auth = true;
  }

  return request.send(params)
  .then(function(response) {
    if (request.forceV1Auth) {
      response.body.warning = 'A protocol downgrade has occurred because this is a legacy account.';
      return response;
    }

    // verify the authenticity of the server's response before proceeding any further
    request.verifyResponse(response);

    const responseDetails = bitgo.handleTokenIssuance(response.body);
    response.body.token = responseDetails.token;

    return response;
  })
  .then(handleResponseResult(), handleResponseError)
  .nodeify(callback);
};

//
// removeAccessToken
// Sets the expire time of an access token matching either the id or label to the current date, effectively deleting it
// Params:
// {
//    id: <id of the access token to be deleted>
//    label: <label of the access token to be deleted>
// }
// Returns:
// {
//    id: <id of the token>
//    label: <user-provided label for this token>
//    user: <id of the user on the token>
//    enterprise <id of the enterprise this token is valid for>
//    client: <the auth client that this token belongs to>
//    scope: <list of allowed OAuth scope values>
//    created: <date the token was created>
//    expires: <date the token will expire>
//    origin: <the origin for which this token is valid>
//    isExtensible: <flag indicating if the token can be extended>
//    extensionAddress: <address whose private key's signature is necessary for extensions>
//    unlock: <info for actions that require an unlock before firing>
// }
//
BitGo.prototype.removeAccessToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['id', 'label'], callback);
  const exactlyOne = !!params.id ^ !!params.label;
  if (!exactlyOne) {
    throw new Error('must provide exactly one of id or label');
  }

  const self = this;

  return Promise.try(function() {
    if (params.id) {
      return params.id;
    }

    // we have to get the id of the token by using the label before we can delete it
    return self.listAccessTokens()
    .then(function(tokens) {
      if (!tokens) {
        throw new Error('token with this label does not exist');
      }

      const matchingTokens = _.filter(tokens, { label: params.label });
      if (matchingTokens.length > 1) {
        throw new Error('ambiguous call: multiple tokens matching this label');
      }
      if (matchingTokens.length === 0) {
        throw new Error('token with this label does not exist');
      }
      return matchingTokens[0].id;
    });
  })
  .then(function(tokenId) {
    return self.del(self.url('/user/accesstoken/' + tokenId))
    .send()
    .result();
  })
  .nodeify(callback);
};

//
// logout
// Logout of BitGo
//
BitGo.prototype.logout = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const self = this;
  return this.get(this.url('/user/logout'))
  .result()
  .then(function() {
    self.clear();
  })
  .nodeify(callback);
};

//
// getUser
// Get a user by ID (name/email only)
//
BitGo.prototype.getUser = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.get(this.url('/user/' + params.id))
  .result('user')
  .nodeify(callback);
};

//
// me
// Get the current logged in user
//
BitGo.prototype.me = function(params, callback) {
  return this.getUser({ id: 'me' }, callback);
};

/**
 * Unlock the session by providing OTP
 * @param {string} otp Required OTP code for the account.
 * @param {number} duration Desired duration of the unlock in seconds (default=600, max=3600).
 */
BitGo.prototype.unlock = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['otp'], callback);

  return this.post(this.url('/user/unlock'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// lock
// Lock the session
//
BitGo.prototype.lock = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.post(this.url('/user/lock'))
  .result()
  .nodeify(callback);
};

//
// me
// Get the current session
//
BitGo.prototype.session = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/user/session'))
  .result('session')
  .nodeify(callback);
};

/**
 * Trigger a push/sms for the OTP code
 * @param {boolean} forceSMS If set to true, will use SMS to send the OTP to the user even if they have other 2FA method set up.
 */
BitGo.prototype.sendOTP = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.post(this.url('/user/sendotp'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Extend token, provided the current token is extendable
 * @param params
 * - duration: duration in seconds by which to extend the token, starting at the current time
 * @param callback
 */
BitGo.prototype.extendToken = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const timestamp = Date.now();
  const duration = params.duration;
  const message = timestamp + '|' + this._token + '|' + duration;
  const privateKey = this._extensionKey.d.toBuffer();
  const isCompressed = this._extensionKey.compressed;
  const prefix = bitcoin.networks.bitcoin.messagePrefix;
  const signature = bitcoinMessage.sign(message, privateKey, isCompressed, prefix).toString('hex');

  return this.post(this.url('/user/extendtoken'))
  .send(params)
  .set('timestamp', timestamp)
  .set('signature', signature)
  .result()
  .nodeify(callback);
};

//
// getSharingKey
// Get a key for sharing a wallet with a user
//
BitGo.prototype.getSharingKey = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['email'], [], callback);

  return this.post(this.url('/user/sharingkey'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// ping
// Test connectivity to the server
//
BitGo.prototype.ping = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/ping'))
  .result()
  .nodeify(callback);
};

//
// Blockchain
// Get the blockchain object.
//
BitGo.prototype.blockchain = function() {
  if (!this._blockchain) {
    this._blockchain = new Blockchain(this);
  }
  return this._blockchain;
};

//
// keychains
// Get the user's keychains object.
//
BitGo.prototype.keychains = function() {
  if (!this._keychains) {
    this._keychains = new Keychains(this);
  }
  return this._keychains;
};

//
// wallets
// Get the user's wallets object.
//
BitGo.prototype.wallets = function() {
  if (!this._wallets) {
    this._wallets = new Wallets(this);
  }
  return this._wallets;
};

//
// travel rule
// Get the travel rule object
//
BitGo.prototype.travelRule = function() {
  if (!this._travel) {
    this._travelRule = new TravelRule(this);
  }
  return this._travelRule;
};

//
// pendingApprovals
// Get pending approvals that can be approved/ or rejected
//
BitGo.prototype.pendingApprovals = function() {
  if (!this._pendingApprovals) {
    this._pendingApprovals = new PendingApprovals(this);
  }
  return this._pendingApprovals;
};

//
// newWalletObject
// A factory method to create a new Wallet object, initialized with the wallet params
// Can be used to reconstitute a wallet from cached data
//
BitGo.prototype.newWalletObject = function(walletParams) {
  return new Wallet(this, walletParams);
};

BitGo.prototype.url = function(path, version = 1) {
  const baseUrl = version === 2 ? this._baseApiUrlV2 : this._baseApiUrl;
  return baseUrl + path;
};

//
// labels
// Get all the address labels on all of the user's wallets
//
BitGo.prototype.labels = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.get(this.url('/labels'))
  .result('labels')
  .nodeify(callback);
};

/**
* Estimates approximate fee per kb needed for a tx to get into a block
* @param {number} numBlocks target blocks for the transaction to be confirmed
* @param {number} maxFee maximum fee willing to be paid (for safety)
* @param {array[string]} inputs list of unconfirmed txIds from which this transaction uses inputs
* @param {number} txSize estimated transaction size in bytes, optional parameter used for CPFP estimation.
* @param {boolean} cpfpAware flag indicating fee should take into account CPFP
* @returns
*/
BitGo.prototype.estimateFee = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const queryParams = { version: 12 };
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

  return this.get(this.url('/tx/fee'))
  .query(queryParams)
  .result()
  .nodeify(callback);
};

//
// instantGuarantee
// Get BitGo's guarantee using an instant id
//
BitGo.prototype.instantGuarantee = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  const self = this;
  return this.get(this.url('/instant/' + params.id))
  .result()
  .then(function(body) {
    if (!body.guarantee) {
      throw new Error('no guarantee found in response body');
    }
    if (!body.signature) {
      throw new Error('no signature found in guarantee response body');
    }
    const signingAddress = common.Environments[self.env].signingAddress;
    const signatureBuffer = new Buffer(body.signature, 'hex');
    const prefix = bitcoin.getNetwork().messagePrefix;
    const isValidSignature = bitcoinMessage.verify(body.guarantee, signingAddress, signatureBuffer, prefix);
    if (!isValidSignature) {
      throw new Error('incorrect signature');
    }
    return body;
  })
  .nodeify(callback);
};

//
// getBitGoFeeAddress
// Get a target address for payment of a BitGo fee
//
BitGo.prototype.getBitGoFeeAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.post(this.url('/billing/address'))
  .send({})
  .result()
  .nodeify(callback);
};

/**
 * Gets an address object (including the wallet id) for a given address.
 * @param {string} address The address to look up.
 */
BitGo.prototype.getWalletAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  return this.get(this.url('/walletaddress/' + params.address))
  .result()
  .nodeify(callback);
};

/**
 * Fetch list of user webhooks
 *
 * @param callback
 * @returns {*}
 */
BitGo.prototype.listWebhooks = function(callback) {
  return this.get(this.url('/webhooks'))
  .result()
  .nodeify(callback);
};

/**
 * Add new user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
BitGo.prototype.addWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.post(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Remove user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
BitGo.prototype.removeWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.del(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Fetch list of webhook notifications for the user
 *
 * @param params
 * @param callback
 * @returns {*}
 */
BitGo.prototype.listWebhookNotifications = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};
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

  return this.get(this.url('/webhooks/notifications'))
  .query(query)
  .result()
  .nodeify(callback);
};

/**
 * Simulate a user webhook
 *
 * @param params
 * @param callback
 * @returns {*}
 */
BitGo.prototype.simulateWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['webhookId', 'blockId'], [], callback);

  const webhookId = params.webhookId;
  return this.post(this.url('/webhooks/' + webhookId + '/simulate'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// fetchConstants
// Receives a TTL and refetches as necessary
//
BitGo.prototype.fetchConstants = function(params, callback) {
  return co(function *() {
    const env = this.env;

    if (!BitGo.prototype._constants) {
      BitGo.prototype._constants = {};
    }
    if (!BitGo.prototype._constantsExpire) {
      BitGo.prototype._constantsExpire = {};
    }

    if (BitGo.prototype._constants[env] && BitGo.prototype._constantsExpire[env] && new Date() < BitGo.prototype._constantsExpire[env]) {
      return BitGo.prototype._constants[env];
    }

    const result = yield superagent.get(this.url('/client/constants'));
    BitGo.prototype._constants[env] = result.body.constants;

    BitGo.prototype._constantsExpire[env] = moment.utc().add(result.body.ttl, 'second').toDate();
    return BitGo.prototype._constants[env];
  }).call(this).asCallback(callback);
};

//
// getConstants
// Get a set of constants from the server to use as defaults
//
BitGo.prototype.getConstants = function(params) {
  params = params || {};

  // TODO: once server starts returning eth address keychains, remove bitgoEthAddress
  const defaultConstants = {
    maxFee: 0.1e8,
    maxFeeRate: 1000000,
    minFeeRate: 5000,
    fallbackFeeRate: 50000,
    minOutputSize: 2730,
    minInstantFeeRate: 10000,
    bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47',
    eth: {
      tokens: []
    }
  };

  this.fetchConstants(params, function(err) {
    if (err) {
      // make sure an error does not terminate the entire script
      console.trace(err);
    }
  });

  // use defaultConstants as the backup for keys that are not set in this._constants
  return _.merge({}, defaultConstants, BitGo.prototype._constants[this.env]);
};

module.exports = BitGo;
