//
// BitGo JavaScript SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import * as superagent from 'superagent';
import * as bitcoin from 'bitgo-utxo-lib';
import { makeRandomKey, hdPath } from './bitcoin';
import bitcoinMessage = require('bitcoinjs-message');
import sanitizeHtml = require('sanitize-html');
import eol = require('eol');
import { BaseCoin } from './v2/baseCoin';
const PendingApprovals = require('./pendingapprovals');
import shamir = require('secrets.js-grempe');
import sjcl = require('./vendor/sjcl.min.js');
import bs58 = require('bs58');
import * as common from './common';
import { EnvironmentName } from './v2/environments';
import { NodeCallback, V1Network } from './v2/types';
import { RequestTracer, Util } from './v2/internal/util';
import { RequestTracer as IRequestTracer } from './v2/types';
import * as Bluebird from 'bluebird';
import co = Bluebird.coroutine;
import pjson = require('../package.json');
import moment = require('moment');
import * as _ from 'lodash';
import * as url from 'url';
import * as querystring from 'querystring';
import * as config from './config';
import * as crypto from 'crypto';
import * as debugLib from 'debug';
import { bytesToWord } from './v2/internal/internal';

const TransactionBuilder = require('./transactionBuilder');
const Blockchain = require('./blockchain');
const Keychains = require('./keychains');
const TravelRule = require('./travelRule');
import Wallet = require('./wallet');
const Wallets = require('./wallets');
const Markets = require('./markets');
import { GlobalCoinFactory } from './v2/coinFactory';

const debug = debugLib('bitgo:index');

if (!(process as any).browser) {
  require('superagent-proxy')(superagent);
}

// Patch superagent to return bluebird promises
const _end = (superagent as any).Request.prototype.end;
(superagent as any).Request.prototype.end = function(cb) {
  const self = this;
  if (typeof cb === 'function') {
    return _end.call(self, cb);
  }

  return new Bluebird.Promise(function(resolve, reject) {
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
(superagent as any).Request.prototype.result = function(optionalField?: string) {
  return this.then(handleResponseResult(optionalField), handleResponseError);
};

function handleResponseResult(optionalField?: string): (res: superagent.Response) => any {
  return function(res: superagent.Response) {
    if (_.isNumber(res.status) && res.status >= 200 && res.status < 300) {
      return optionalField ? res.body[optionalField] : res.body;
    }
    throw errFromResponse(res);
  };
}

function errFromResponse(res: superagent.Response): Error {
  const errString = createResponseErrorString(res);
  const err: any = new Error(errString);

  err.status = res.status;
  if (res.body) {
    err.result = res.body;
  }
  if (_.has(res.header, 'x-auth-required') && (res.header['x-auth-required'] === 'true')) {
    err.invalidToken = true;
  }
  if (res.body.needsOTP) {
    err.needsOTP = true;
  }
  return err;
}

function handleResponseError(e): never {
  if (e.response) {
    throw errFromResponse(e.response);
  }
  throw e;
}

/**
 * There are many ways a request can fail, and may ways information on that failure can be
 * communicated to the client. This function tries to handle those cases and create a sane error string
 * @param res Response from an HTTP request
 */
function createResponseErrorString(res: superagent.Response): string {
  let errString = res.status.toString(); // at the very least we'll have the status code
  if (res.body.error) {
    // this is the case we hope for, where the server gives us a nice error from the JSON body
    errString = res.body.error;
  } else {
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
}

export interface BitGoOptions {
  env?: EnvironmentName;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  userAgent?: string;
  customRootURI?: string;
  customBitcoinNetwork?: V1Network;
  customSigningAddress?: string;
  serverXpub?: string;
  stellarFederationServerUrl?: string;
  useProduction?: boolean;
  microservicesUri?: string;
  refreshToken?: string;
  validate?: boolean;
  proxy?: string;
}

export interface User {
  username: string;
}

export interface BitGoJson {
  user?: User;
  token?: string;
  extensionKey?: string;
}

/**
 * @deprecated
 */
export interface DeprecatedVerifyAddressOptions {
  address?: string;
}

export interface VerifyPasswordOptions {
  password?: string;
}

export interface EncryptOptions {
  input?: string;
  password?: string;
}

export interface DecryptOptions {
  input?: string;
  password?: string;
}

export interface SplitSecretOptions {
  seed: string;
  passwords: string[];
  m: number;
}

export interface SplitSecret {
  xpub: string;
  m: number;
  n: number;
  seedShares: any;
}

export interface ReconstituteSecretOptions {
  shards: string[];
  passwords: string[];
}

export interface ReconstitutedSecret {
  xpub: string;
  xprv: string;
  seed: string;
}

export interface VerifyShardsOptions {
  shards: string[];
  passwords: string[];
  m: number;
  xpub: string;
}

export interface GetEcdhSecretOptions {
  otherPubKeyHex: string;
  eckey: bitcoin.ECPair;
}

export interface AccessTokenOptions {
  accessToken: string;
}

export interface TokenIssuanceResponse {
  derivationPath: string;
  encryptedToken: string;
  encryptedECDHXprv?: string;
}

export interface TokenIssuance {
  token: string;
  ecdhXprv?: string;
}

export interface CalculateHmacSubjectOptions {
  urlPath: string;
  text: string;
  timestamp: number;
  statusCode?: number;
}

export interface CalculateRequestHmacOptions {
  url: string;
  text: string;
  timestamp: number;
  token: string;
}

export interface CalculateRequestHeadersOptions {
  url: string;
  text: string;
  token: string;
}

export interface RequestHeaders {
  hmac: string;
  timestamp: number;
  tokenHash: string;
}

export interface VerifyResponseOptions extends CalculateRequestHeadersOptions {
  hmac: string;
  url: string;
  text: string;
  timestamp: number;
  statusCode?: number;
}

export interface AuthenticateOptions {
  username: string;
  password: string;
  otp?: string;
  trust?: number;
  forceSMS?: boolean;
  extensible?: boolean;
  forceV1Auth?: boolean;
}

export interface ProcessedAuthenticationOptions {
  email: string;
  password: string;
  forceSMS: boolean;
  otp?: string;
  trust?: number;
  extensible?: boolean;
  extensionAddress?: string;
  forceV1Auth?: boolean;
}

export interface AddAccessTokenOptions {
  label: string;
  otp?: string;
  duration?: number;
  ipRestrict?: string[];
  txValueLimit?: number;
  scope: string[];
}

export interface RemoveAccessTokenOptions {
  id?: string;
  label?: string;
}

export interface GetUserOptions {
  id: string;
}

export interface ChangePasswordOptions {
  oldPassword: string;
  newPassword: string;
}

export interface UnlockOptions {
  otp?: string;
  duration?: number
}

export interface ExtendTokenOptions {
  duration?: string;
}

export interface GetSharingKeyOptions {
  email: string;
}

export interface PingOptions {
  reqId?: IRequestTracer;
}

/**
 * @deprecated
 */
export interface EstimateFeeOptions {
  numBlocks?: number;
  maxFee?: number;
  inputs?: string[];
  txSize?: number;
  cpfpAware?: boolean;
}

/**
 * @deprecated
 */
export interface WebhookOptions {
  url: string;
  type: string;
}

export interface ListWebhookNotificationsOptions {
  prevId?: string;
  limit?: number;
}

export interface BitGoSimulateWebhookOptions {
  webhookId: string;
  blockId: string;
}

export interface AuthenticateWithAuthCodeOptions {
  authCode: string;
}

/**
 * @deprecated
 */
export interface VerifyPushTokenOptions {
  pushVerificationToken: string;
}

export interface BitGoRequest extends superagent.Request {
  result: (optionalField?: string) => Bluebird<any>;
  end: (callback?: NodeCallback<superagent.Response>) => Bluebird<superagent.Response>;
}

export interface BitGo {
  get(url: string, callback?: NodeCallback<superagent.Response>): BitGoRequest;
  post(url: string, callback?: NodeCallback<superagent.Response>): BitGoRequest;
  put(url: string, callback?: NodeCallback<superagent.Response>): BitGoRequest;
  del(url: string, callback?: NodeCallback<superagent.Response>): BitGoRequest;
  patch(url: string, callback?: NodeCallback<superagent.Response>): BitGoRequest;
}

export class BitGo {
  private static _testnetWarningMessage = false;
  private static _constants: any;
  private static _constantsExpire: any;
  private readonly _env: EnvironmentName;
  /**
   * Expose env property for backwards compatibility
   * @deprecated
   */
  public readonly env: EnvironmentName;
  private readonly _baseUrl: string;
  private readonly _microservicesUrl?: string;
  private readonly _baseApiUrl: string;
  private readonly _baseApiUrlV2: string;
  private _user?: User;
  private _keychains: any;
  private _wallets: any;
  private readonly _clientId?: string;
  private readonly _clientSecret?: string;
  private _token?: string;
  private _refreshToken?: string;
  private readonly _userAgent: string;
  private readonly _promise: typeof Bluebird;
  private _validate: boolean;
  private readonly _proxy?: string;
  private _reqId?: IRequestTracer;
  private _ecdhXprv?: string;
  private _extensionKey?: bitcoin.ECPair;
  private _markets?: any;
  private _blockchain?: any;
  private _travelRule?: any;
  private _pendingApprovals?: any;

  /**
   * Constructor for BitGo Object
   */
  constructor(params: BitGoOptions = {}) {
    if (!common.validateParams(params, [], ['clientId', 'clientSecret', 'refreshToken', 'accessToken', 'userAgent', 'customRootURI', 'customBitcoinNetwork', 'serverXpub', 'stellarFederationServerUrl']) ||
      (params.useProduction && !_.isBoolean(params.useProduction))) {
      throw new Error('invalid argument');
    }

    if ((!params.clientId) !== (!params.clientSecret)) {
      throw new Error('invalid argument - must provide both client id and secret');
    }

    // By default, we operate on the test server.
    // Deprecate useProduction in the future
    let env: EnvironmentName;

    if (params.useProduction) {
      if (params.env && params.env !== 'prod') {
        throw new Error('cannot use useProduction when env=' + params.env);
      }
      env = 'prod';
    } else if (params.customRootURI ||
      params.customBitcoinNetwork ||
      params.customSigningAddress ||
      params.serverXpub ||
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
        (common.Environments['custom'] as any).customSigningAddress = params.customSigningAddress;
      }
      if (params.serverXpub) {
        common.Environments['custom'].serverXpub = params.serverXpub;
      }
      if (params.stellarFederationServerUrl) {
        common.Environments['custom'].stellarFederationServerUrl = params.stellarFederationServerUrl;
      }
    } else {
      env = params.env || process.env.BITGO_ENV as EnvironmentName;
    }

    if (env as string === 'production') {
      env = 'prod'; // make life easier
    }

    if (env === 'custom' && _.isUndefined(common.Environments[env].uri)) {
      throw new Error('must use --customrooturi or set the BITGO_CUSTOM_ROOT_URI environment variable when using the custom environment');
    }

    if (env) {
      if (common.Environments[env]) {
        this._baseUrl = common.Environments[env].uri;
      } else {
        throw new Error('invalid environment ' + env + '. Supported environments: test, prod');
      }
    } else {
      env = 'test';
      if (!BitGo._testnetWarningMessage) {
        BitGo._testnetWarningMessage = true;
        console.log('BitGo SDK env not set - defaulting to test at test.bitgo.com.');
      }
      this._baseUrl = common.Environments[env].uri;
    }
    this._env = this.env = env;

    common.setNetwork(common.Environments[env].network);
    common.setRmgNetwork(common.Environments[env].rmgNetwork);

    this._microservicesUrl = params.microservicesUri;
    this._baseApiUrl = this._baseUrl + '/api/v1';
    this._baseApiUrlV2 = this._baseUrl + '/api/v2';
    this._keychains = null;
    this._wallets = null;
    this._clientId = params.clientId;
    this._clientSecret = params.clientSecret;
    this._token = params.accessToken;
    this._refreshToken = params.refreshToken;
    this._userAgent = params.userAgent || 'BitGoJS/' + this.version();
    this._promise = Bluebird;
    this._reqId = undefined;

    // whether to perform extra client-side validation for some things, such as
    // address validation or signature validation. defaults to true, but can be
    // turned off by setting to false. can also be overridden individually in the
    // functions that use it.
    this._validate = params.validate === undefined ? true : params.validate;

    // Create superagent methods specific to this BitGo instance.
    const methods = ['get', 'post', 'put', 'del', 'patch'];

    if (!params.proxy && process.env.BITGO_USE_PROXY) {
      params.proxy = process.env.BITGO_USE_PROXY;
    }

    if ((process as any).browser && params.proxy) {
      throw new Error('cannot use https proxy params while in browser');
    }

    this._proxy = params.proxy;

    for (const index in methods) {
      const method = methods[index];
      this[method] = this.createPatch(method);
    }

    // capture outer stack so we have useful debug information if fetch constants fails
    const e = new Error();

    // Kick off first load of constants
    this.fetchConstants({}, function(err) {
      if (err) {
        // make sure an error does not terminate the entire script
        console.error('failed to fetch initial client constants from BitGo');
        debug(e.stack);
      }
    });
  }

  /**
   * This is a patching function which can apply our authorization
   * headers to any outbound request.
   * @param method
   */
  private createPatch(method: string): (url: string, callback?: NodeCallback<superagent.Response>) => superagent.Request {
    const self = this;
    return function(...args) {
      let req: superagent.SuperAgentRequest = superagent[method].apply(null, args);
      if (self._proxy) {
        req = req.proxy(self._proxy);
      }

      // Patch superagent to return promises
      const prototypicalEnd = req.end;
      req.end = function() {
        const thisReq: superagent.SuperAgentRequest = this;
        // intercept a request before it's submitted to the server for v2 authentication (based on token)
        thisReq.set('BitGo-SDK-Version', self.version());

        if (!_.isUndefined(self._reqId)) {
          thisReq.set('Request-ID', self._reqId.toString());

          // increment after setting the header so the sequence numbers start at 0
          self._reqId.inc();

          // request ids must be set before each request instead of being kept
          // inside the bitgo object. This is to prevent reentrancy issues where
          // multiple simultaneous requests could cause incorrect reqIds to be used
          delete self._reqId;
        }

        // if there is no token, and we're not logged in, the request cannot be v2 authenticated
        thisReq.isV2Authenticated = true;
        thisReq.authenticationToken = self._token;
        // some of the older tokens appear to be only 40 characters long
        if ((self._token && self._token.length !== 67 && self._token.indexOf('v2x') !== 0)
          || req.forceV1Auth) {
          // use the old method
          thisReq.isV2Authenticated = false;

          thisReq.set('Authorization', 'Bearer ' + self._token);
          return prototypicalEnd.apply(thisReq, arguments as any);
        }

        thisReq.set('BitGo-Auth-Version', '2.0');
        // prevent IE from caching requests
        thisReq.set('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT');
        if (self._token) {

          // do a localized data serialization process
          let data = (thisReq as any)._data;
          if (typeof data !== 'string') {

            let contentType = thisReq.get('Content-Type');
            // Parse out just the content type from the header (ignore the charset)
            if (contentType) {
              contentType = contentType.split(';')[0];
            }
            let serialize = superagent.serialize[contentType];
            if (!serialize && /[\/+]json\b/.test(contentType)) {
              serialize = superagent.serialize['application/json'];
            }
            if (serialize) {
              data = serialize(data);
            }
          }
          (thisReq as any)._data = data;

          const urlDetails = url.parse(req.url);

          let queryString: string | undefined;
          const query: string[] = (req as any)._query;
          const qs: { [key: string]: string } = (req as any).qs;
          if (query && query.length > 0) {
            // browser version
            queryString = query.join('&');
            (req as any)._query = [];
          } else if (qs) {
            // node version
            queryString = querystring.stringify(qs);
            (req as any).qs = null;
          }

          if (queryString) {
            if (urlDetails.search) {
              urlDetails.search += '&' + queryString;
            } else {
              urlDetails.search = '?' + queryString;
            }
            req.url = url.format(urlDetails);
          }

          const requestProperties = self.calculateRequestHeaders({ url: req.url, token: self._token, text: data });
          thisReq.set('Auth-Timestamp', requestProperties.timestamp.toString());

          // we're not sending the actual token, but only its hash
          thisReq.set('Authorization', 'Bearer ' + requestProperties.tokenHash);

          // set the HMAC
          thisReq.set('HMAC', requestProperties.hmac);
        }

        return prototypicalEnd.apply(thisReq, arguments as any);
      };

      // verify that the response received from the server is signed correctly
      // right now, it is very permissive with the timestamp variance
      req.verifyResponse = function(response) {
        if (!req.isV2Authenticated || !req.authenticationToken) {
          return response;
        }

        const verificationResponse = self.verifyResponse({
          url: req.url,
          hmac: response.header.hmac,
          statusCode: response.status,
          text: response.text,
          timestamp: response.header.timestamp,
          token: req.authenticationToken
        });

        if (!verificationResponse.isValid) {
          // calculate the HMAC
          const receivedHmac = response.header.hmac;
          const expectedHmac = verificationResponse.expectedHmac;
          const signatureSubject = verificationResponse.signatureSubject;
          // Log only the first 10 characters of the token to ensure the full token isn't logged.
          const partialBitgoToken = self._token ? self._token.substring(0, 10) : '';
          const errorDetails = {
            expectedHmac,
            receivedHmac,
            hmacInput: signatureSubject,
            requestToken: req.authenticationToken,
            bitgoToken: partialBitgoToken
          };
          debug('Invalid response HMAC: %O', errorDetails);
          const error: any = new Error('invalid response HMAC, possible man-in-the-middle-attack');
          error.result = errorDetails;
          error.status = 511;
          throw error;
        }
        return response;
      };

      let lastPromise: Bluebird<any> | null = null;
      req.then = function() {
        if (!lastPromise) {
          // cannot redefine end() to return a Bluebird<any>, even though
          // that gets monkey patched in at runtime, so this cast is required
          const reference: Bluebird<any> = (req.end() as unknown as Bluebird<any>)
            .then(req.verifyResponse);
          lastPromise = reference.then.apply(reference, arguments as any);
        } else {
          lastPromise = lastPromise.then.apply(lastPromise, arguments as any);
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return lastPromise!;
      };

      if (!(process as any).browser) {
        // If not in the browser, set the User-Agent. Browsers don't allow
        // setting of User-Agent, so we must disable this when run in the
        // browser (browserify sets process.browser).
        req.set('User-Agent', self._userAgent);
      }

      // Set the request timeout to just above 5 minutes by default
      req.timeout((process.env.BITGO_TIMEOUT as any) * 1000 || 305 * 1000);
      return req;
    };
  }

  /**
   * Calculate the HMAC for the given key and message
   * @param key {String} - the key to use for the HMAC
   * @param message {String} - the actual message to HMAC
   * @returns {*} - the result of the HMAC operation
   */
  calculateHMAC(key: string, message: string): string {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }

  /**
   * Create a basecoin object
   * @param coinName
   */
  coin(coinName: string): BaseCoin {
    return GlobalCoinFactory.getInstance(this, coinName);
  }

  /**
   * Create a basecoin object for a virtual token
   * @param tokenName
   * @param callback
   */
  token(tokenName: string, callback?: NodeCallback<BaseCoin>): Bluebird<BaseCoin> {
    const self = this;
    return co<BaseCoin>(function *() {
      yield self.fetchConstants();
      return self.coin(tokenName);
    }).call(this).asCallback(callback);
  }

  /**
   *
   */
  getValidate(): boolean {
    return this._validate;
  }

  /**
   *
   */
  setValidate(validate: boolean): void {
    if (!_.isBoolean(validate)) {
      throw new Error('invalid argument');
    }
    this._validate = validate;
  }

  /**
   * Return the current BitGo environment
   */
  getEnv(): EnvironmentName {
    return this._env;
  }

  /**
   * Clear out all state from this BitGo object, effectively logging out the current user.
   */
  clear(): void {
    // TODO: are there any other fields which should be cleared?
    this._user = undefined;
    this._token = undefined;
    this._refreshToken = undefined;
    this._ecdhXprv = undefined;
  }

  /**
   * Helper function to return a rejected promise or call callback with error
   *
   * @deprecated
   */
  reject(msg: string, callback?: NodeCallback<never>): Bluebird<never> {
    return Bluebird.reject(new Error(msg)).nodeify(callback);
  }

  /**
   * Gets the version of the BitGoJS package
   */
  version(): string {
    return pjson.version;
  }

  /**
   * Serialize this BitGo object to a JSON object.
   *
   * Caution: contains sensitive data
   */
  toJSON(): BitGoJson {
    return {
      user: this._user,
      token: this._token,
      extensionKey: this._extensionKey ? this._extensionKey.toWIF() : undefined,
    };
  }

  /**
   * Deserialize a JSON serialized BitGo object.
   *
   * Overwrites the properties on the current BitGo object with
   * those of the deserialzed object.
   *
   * @param json
   */
  fromJSON(json: BitGoJson): void {
    this._user = json.user;
    this._token = json.token;
    if (json.extensionKey) {
      const network = common.Environments[this.getEnv()].network;
      this._extensionKey = bitcoin.ECPair.fromWIF(
        json.extensionKey,
        bitcoin.networks[network]
      );
    }
  }

  /**
   * Get the current user
   */
  user(): User | undefined {
    return this._user;
  }

  /**
   * Verify a Bitcoin address is a valid base58 address
   * @deprecated
   */
  verifyAddress(params: DeprecatedVerifyAddressOptions = {}): boolean {
    common.validateParams(params, ['address'], []);

    if (!_.isString(params.address)) {
      throw new Error('missing required string address');
    }

    let address;
    try {
      address = bitcoin.address.fromBase58Check(params.address);
    } catch (e) {
      return false;
    }

    const networkName = common.Environments[this.getEnv()].network;
    const network = bitcoin.networks[networkName];
    return address.version === network.pubKeyHash || address.version === network.scriptHash;
  }

  /**
   */
  verifyPassword(params: VerifyPasswordOptions = {}, callback?: NodeCallback<any>) {
    if (!_.isString(params.password)) {
      throw new Error('missing required string password');
    }

    if (!this._user || !this._user.username) {
      throw new Error('no current user');
    }
    const hmacPassword = this.calculateHMAC(this._user.username, params.password);

    return this.post(this.url('/user/verifypassword'))
      .send({ password: hmacPassword })
      .result('valid')
      .nodeify(callback);
  }

  /**
   * Utility function to encrypt locally.
   */
  encrypt(params: EncryptOptions = {}): string {
    common.validateParams(params, ['input', 'password'], []);

    const randomSalt = crypto.randomBytes(8);
    const randomIV = crypto.randomBytes(16);
    const encryptOptions = {
      iter: 10000,
      ks: 256,
      salt: [
        bytesToWord(randomSalt.slice(0, 4)),
        bytesToWord(randomSalt.slice(4))
      ],
      iv: [
        bytesToWord(randomIV.slice(0, 4)),
        bytesToWord(randomIV.slice(4, 8)),
        bytesToWord(randomIV.slice(8, 12)),
        bytesToWord(randomIV.slice(12, 16))
      ]
    };

    return sjcl.encrypt(params.password, params.input, encryptOptions);
  }

  /**
   * Decrypt an encrypted string locally.
   */
  decrypt(params: DecryptOptions = {}): string {
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
  }

  /**
   * Generate a random password
   * @param   {Number} numWords     Number of 32-bit words
   * @returns {String}          base58 random password
   */
  generateRandomPassword(numWords: number = 5): string {
    const bytes = sjcl.codec.bytes.fromBits(sjcl.random.randomWords(numWords));
    return bs58.encode(bytes);
  }

  /**
   * Split a secret into shards using Shamir Secret Sharing.
   * @param seed A hexadecimal secret to split
   * @param passwords An array of the passwords used to encrypt each share
   * @param m The threshold number of shards necessary to reconstitute the secret
   */
  splitSecret({ seed, passwords, m }: SplitSecretOptions): SplitSecret {
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
    const secrets: string[] = shamir.share(seed, n, m);
    const shards = _.zipWith(secrets, passwords, (shard, password) => {
      return this.encrypt({ input: shard, password });
    });
    const node = bitcoin.HDNode.fromSeedHex(seed);
    return {
      xpub: node.neutered().toBase58(),
      m,
      n,
      seedShares: shards,
    };
  }

  /**
   * Reconstitute a secret which was sharded with `splitSecret`.
   * @param shards
   * @param passwords
   */
  reconstituteSecret({ shards, passwords }: ReconstituteSecretOptions): ReconstitutedSecret {
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
    const seed: string = shamir.combine(secrets);
    const node = bitcoin.HDNode.fromSeedHex(seed);
    return {
      xpub: node.neutered().toBase58() as string,
      xprv: node.toBase58() as string,
      seed,
    };
  }

  /**
   *
   * @param shards
   * @param passwords
   * @param m
   * @param xpub Optional xpub to verify the results against
   */
  verifyShards({ shards, passwords, m, xpub }: VerifyShardsOptions): boolean {
    /**
     * Generate all possible combinations of a given array's values given subset size m
     * @param array The array whose values are to be arranged in all combinations
     * @param m The size of each subset
     * @param entryIndices Recursively trailing set of currently chosen array indices for the combination subset under construction
     * @returns {Array}
     */
    const generateCombinations = (array: string[], m: number, entryIndices: number[] = []): string[][] => {
      let combinations: string[][] = [];

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
  }

  /**
   * Construct an ECDH secret from a private key and other user's public key
   */
  getECDHSecret({ otherPubKeyHex, eckey }: GetEcdhSecretOptions) {
    if (!_.isString(otherPubKeyHex)) {
      throw new Error('otherPubKeyHex string required');
    }
    if (!_.isObject(eckey)) {
      throw new Error('eckey object required');
    }

    const otherKeyPub = bitcoin.ECPair.fromPublicKeyBuffer(new Buffer(otherPubKeyHex, 'hex'));
    const secretPoint = otherKeyPub.Q.multiply((eckey as bitcoin.ECPair).d);
    const secret = Util.bnToByteArrayUnsigned(secretPoint.affineX);
    return new Buffer(secret).toString('hex');
  }

  /**
   * Gets the user's private keychain, used for receiving shares
   */
  getECDHSharingKeychain(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
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
  }

  /**
   * Get bitcoin market data
   */
  markets() {
    if (!this._markets) {
      this._markets = new Markets(this);
    }
    return this._markets;
  }

  /**
   * Get the latest bitcoin prices
   * (Deprecated: Will be removed in the future) use `bitgo.markets().latest()`
   * @deprecated
   */
  market(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/market/latest'))
      .result()
      .nodeify(callback);
  }

  /**
   * Get market data from yesterday
   * (Deprecated: Will be removed in the future) use bitgo.markets().yesterday()
   */
  yesterday(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/market/yesterday'))
      .result()
      .nodeify(callback);
  }

  /**
   * Synchronous method for activating an access token.
   */
  authenticateWithAccessToken({ accessToken }: AccessTokenOptions): void {
    this._token = accessToken;
  }

  /**
   *
   * @param responseBody Response body object
   * @param password Password for the symmetric decryption
   */
  handleTokenIssuance(responseBody: TokenIssuanceResponse, password?: string): TokenIssuance {
    // make sure the response body contains the necessary properties
    common.validateParams(responseBody, ['derivationPath'], ['encryptedECDHXprv']);

    const environment = this._env;
    const environmentConfig = common.Environments[environment];
    const serverXpub = environmentConfig.serverXpub;
    let ecdhXprv = this._ecdhXprv;
    if (!ecdhXprv) {
      if (!password || !responseBody.encryptedECDHXprv) {
        throw new Error('ecdhXprv property must be set or password and encrypted encryptedECDHXprv must be provided');
      }
      try {
        ecdhXprv = this.decrypt({
          input: responseBody.encryptedECDHXprv,
          password: password
        });
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
    const clientDerivedNode = hdPath(clientHDNode).derive(derivationPath);
    const serverDerivedNode = hdPath(serverHDNode).derive(derivationPath);

    // calculating one-time ECDH key
    const secretPoint = serverDerivedNode.keyPair.__Q.multiply(clientDerivedNode.keyPair.d);
    const secret = secretPoint.getEncoded().toString('hex');

    // decrypt token with symmetric ECDH key
    let response: TokenIssuance;
    try {
      response = {
        token: this.decrypt({
          input: responseBody.encryptedToken,
          password: secret
        })
      };
    } catch (e) {
      e.errorCode = 'token_decryption_failure';
      console.error('Failed to decrypt token.');
      throw e;
    }
    if (!this._ecdhXprv) {
      response.ecdhXprv = ecdhXprv;
    }
    return response;
  }

  /**
   * Calculate the string that is to be HMACed for a certain HTTP request or response
   * @param urlPath
   * @param text
   * @param timestamp
   * @param statusCode Only set for HTTP responses, leave blank for requests
   * @returns {string}
   */
  calculateHMACSubject({ urlPath, text, timestamp, statusCode }: CalculateHmacSubjectOptions): string {
    const urlDetails = url.parse(urlPath);
    const queryPath = (urlDetails.query && urlDetails.query.length > 0) ? urlDetails.path : urlDetails.pathname;
    if (!_.isUndefined(statusCode) && _.isInteger(statusCode) && _.isFinite(statusCode)) {
      return [timestamp, queryPath, statusCode, text].join('|');
    }
    return [timestamp, queryPath, text].join('|');
  }

  /**
   * Calculate the HMAC for an HTTP request
   */
  calculateRequestHMAC({ url: urlPath, text, timestamp, token }: CalculateRequestHmacOptions): string {
    const signatureSubject = this.calculateHMACSubject({ urlPath, text, timestamp });

    // calculate the HMAC
    return this.calculateHMAC(token, signatureSubject);
  }

  /**
   * Calculate request headers with HMAC
   */
  calculateRequestHeaders({ url, text, token }: CalculateRequestHeadersOptions): RequestHeaders {
    const timestamp = Date.now();
    const hmac = this.calculateRequestHMAC({ url, text, timestamp, token });

    // calculate the SHA256 hash of the token
    const hashDigest = sjcl.hash.sha256.hash(token);
    const tokenHash = sjcl.codec.hex.fromBits(hashDigest);
    return {
      hmac,
      timestamp,
      tokenHash,
    };
  }

  /**
   * Verify the HMAC for an HTTP response
   */
  verifyResponse({ url: urlPath, statusCode, text, timestamp, token, hmac }: VerifyResponseOptions) {
    const signatureSubject = this.calculateHMACSubject({
      urlPath,
      text,
      timestamp,
      statusCode,
    });

    // calculate the HMAC
    const expectedHmac = this.calculateHMAC(token, signatureSubject);

    // verify the HMAC and timestamp
    return {
      isValid: expectedHmac === hmac,
      expectedHmac,
      signatureSubject,
    };
  }

  /**
   *
   */
  preprocessAuthenticationParams({ username, password, otp, forceSMS, extensible, trust }: AuthenticateOptions): ProcessedAuthenticationOptions {
    if (!_.isString('username')) {
      throw new Error('expected string username');
    }

    if (!_.isString('password')) {
      throw new Error('expected string password');
    }

    const lowerName = username.toLowerCase();
    // Calculate the password HMAC so we don't send clear-text passwords
    const hmacPassword = this.calculateHMAC(lowerName, password);

    const authParams: ProcessedAuthenticationOptions = {
      email: lowerName,
      password: hmacPassword,
      forceSMS: !!forceSMS,
    };

    if (otp) {
      authParams.otp = otp;
      if (trust) {
        authParams.trust = 1;
      }
    }

    if (extensible) {
      this._extensionKey = makeRandomKey();
      authParams.extensible = true;
      authParams.extensionAddress = this._extensionKey.getAddress();
    }

    return authParams;
  }

  /**
   * Login to the bitgo platform.
   */
  authenticate(params: AuthenticateOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co<superagent.Response>(function *() {
      if (!_.isObject(params)) {
        throw new Error('required object params');
      }

      if (callback && !_.isFunction(callback)) {
        throw new Error('callback parameter must be a function');
      }

      if (!_.isString(params.password)) {
        throw new Error('expected string password');
      }

      const forceV1Auth = !!params.forceV1Auth;
      const authParams = self.preprocessAuthenticationParams(params);
      const password = params.password;

      if (self._token) {
        return self.reject('already logged in', callback);
      }

      const authUrl = self._microservicesUrl ?
        self.microservicesUrl('/api/auth/v1/session') :
        self.url('/user/login');
      const request = self.post(authUrl);

      if (forceV1Auth) {
        (request as any).forceV1Auth = true;
        // tell the server that the client was forced to downgrade the authentication protocol
        authParams.forceV1Auth = true;
      }
      const response: superagent.Response = yield request.send(authParams);
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
    }).call(this)
      .then(handleResponseResult(), handleResponseError)
      .nodeify(callback);
  }

  /**
   * @param params
   * - operatingSystem: one of ios, android
   * - pushToken: hex-formatted token for the respective native push notification service
   * @param callback
   * @returns {*}
   * @deprecated
   */
  registerPushToken(params, callback?: NodeCallback<any>): Bluebird<any> {
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
  }


  /**
   *
   * @param params
   * - pushVerificationToken: the token received via push notification to confirm the device's mobility
   * @param callback
   * @deprecated
   */
  verifyPushToken(params: VerifyPushTokenOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      if (!_.isObject(params)) {
        throw new Error('required object params');
      }

      if (!_.isString(params.pushVerificationToken)) {
        throw new Error('required string pushVerificationToken');
      }

      if (!self._token) {
        // this device has to be registered to an extensible session
        throw new Error('not logged in');
      }

      const postParams = _.pick(params, 'pushVerificationToken');

      return self.post(self.url('/devices/verify'))
        .send(postParams)
        .result();
    }).call(this)
      .nodeify(callback);
  }

  /**
   * Login to the bitgo system using an authcode generated via Oauth
   */
  authenticateWithAuthCode(params: AuthenticateWithAuthCodeOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      if (!_.isObject(params)) {
        throw new Error('required object params');
      }

      if (!_.isString(params.authCode)) {
        throw new Error('required string authCode');
      }

      if (!self._clientId || !self._clientSecret) {
        throw new Error('Need client id and secret set first to use this');
      }

      const authCode = params.authCode;

      if (self._token) {
        return self.reject('already logged in', callback);
      }

      const request = self.post(self._baseUrl + '/oauth/token');
      request.forceV1Auth = true; // OAuth currently only supports v1 authentication
      const body = yield request
        .send({
          grant_type: 'authorization_code',
          code: authCode,
          client_id: self._clientId,
          client_secret: self._clientSecret,
        })
        .result();

      self._token = body.access_token;
      self._refreshToken = body.refresh_token;
      self._user = yield self.me();
      return body;
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Use refresh token to get new access token.
   * If the refresh token is null/defined, then we use the stored token from auth
   */
  refreshToken(params: { refreshToken?: string } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      common.validateParams(params, [], ['refreshToken'], callback);

      const refreshToken = params.refreshToken || self._refreshToken;

      if (!refreshToken) {
        throw new Error('Must provide refresh token or have authenticated with Oauth before');
      }

      if (!self._clientId || !self._clientSecret) {
        throw new Error('Need client id and secret set first to use this');
      }

      const body = yield self.post(self._baseUrl + '/oauth/token')
        .send({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: self._clientId,
          client_secret: self._clientSecret
        })
        .result();
      self._token = body.access_token;
      self._refreshToken = body.refresh_token;
      return body;
    })
    .call(this)
    .nodeify(callback);
  }

  /**
   *
   * listAccessTokens
   * Get information on all of the BitGo access tokens on the user
   * @return {
   *  id: <id of the token>
   *  label: <the user-provided label for this token>
   *  user: <id of the user on the token>
   *  enterprise <id of the enterprise this token is valid for>
   *  client: <the auth client that this token belongs to>
   *  scope: <list of allowed OAuth scope values>
   *  created: <date the token was created>
   *  expires: <date the token will expire>
   *  origin: <the origin for which this token is valid>
   *  isExtensible: <flag indicating if the token can be extended>
   *  extensionAddress: <address whose private key's signature is necessary for extensions>
   *  unlock: <info for actions that require an unlock before firing>
   * }
   */
  listAccessTokens(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/user/accesstoken'))
      .send()
      .result('accessTokens')
      .nodeify(callback);
  }

  /**
   * addAccessToken
   * Add a BitGo API Access Token to the current user account
   * @param params {
   *    otp: (required) <valid otp code>
   *    label: (required) <label for the token>
   *    duration: <length of time in seconds the token will be valid for>
   *    ipRestrict: <array of IP address strings to whitelist>
   *    txValueLimit: <number of outgoing satoshis allowed on this token>
   *    scope: (required) <authorization scope of the requested token>
   * }
   * @param callback
   * @return {
   *    id: <id of the token>
   *    token: <access token hex string to be used for BitGo API request verification>
   *    label: <user-provided label for this token>
   *    user: <id of the user on the token>
   *    enterprise <id of the enterprise this token is valid for>
   *    client: <the auth client that this token belongs to>
   *    scope: <list of allowed OAuth scope values>
   *    created: <date the token was created>
   *    expires: <date the token will expire>
   *    origin: <the origin for which this token is valid>
   *    isExtensible: <flag indicating if the token can be extended>
   *    extensionAddress: <address whose private key's signature is necessary for extensions>
   *    unlock: <info for actions that require an unlock before firing>
   * }
   */
  addAccessToken(params: AddAccessTokenOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co<superagent.Response>(function *() {
      if (!_.isString(params.label)) {
        throw new Error('required string label');
      }

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

      const authUrl = self._microservicesUrl ?
        self.microservicesUrl('/api/auth/v1/accesstoken') :
        self.url('/user/accesstoken');
      const request = self.post(authUrl);

      if (!self._ecdhXprv) {
        // without a private key, the user cannot decrypt the new access token the server will send
        request.forceV1Auth = true;
      }

      const response = yield request.send(params);
      if (request.forceV1Auth) {
        response.body.warning = 'A protocol downgrade has occurred because this is a legacy account.';
        return response;
      }

      // verify the authenticity of the server's response before proceeding any further
      request.verifyResponse(response);

      const responseDetails = self.handleTokenIssuance(response.body);
      response.body.token = responseDetails.token;

      return response;
    }).call(this)
      .then(handleResponseResult(), handleResponseError)
      .nodeify(callback);
  }

  /**
   * Sets the expire time of an access token matching either the id or label to the current date, effectively deleting it
   *
   * Params:
   * id: <id of the access token to be deleted>
   * label: <label of the access token to be deleted>
   *
   * Returns:
   * id: <id of the token>
   * label: <user-provided label for this token>
   * user: <id of the user on the token>
   * enterprise <id of the enterprise this token is valid for>
   * client: <the auth client that this token belongs to>
   * scope: <list of allowed OAuth scope values>
   * created: <date the token was created>
   * expires: <date the token will expire>
   * origin: <the origin for which this token is valid>
   * isExtensible: <flag indicating if the token can be extended>
   * extensionAddress: <address whose private key's signature is ne*cessary for extensions>
   * unlock: <info for actions that require an unlock before firing>
   * @param params
   * @param callback
   */
  removeAccessToken({ id, label }: RemoveAccessTokenOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function*() {
      if ((!id && !label) || (id && label)) {
        throw new Error('must provide exactly one of id or label');
      }
      if (id) {
        return self.del(self.url(`/user/accesstoken/${id}`))
          .send()
          .result();
      }

      const tokens = yield self.listAccessTokens();

      if (!tokens) {
        throw new Error('token with this label does not exist');
      }

      const matchingTokens: any = _.filter(tokens, { label });
      if (matchingTokens.length > 1) {
        throw new Error('ambiguous call: multiple tokens matching this label');
      }
      if (matchingTokens.length === 0) {
        throw new Error('token with this label does not exist');
      }

      return self.del(self.url(`/user/accesstoken/${matchingTokens[0].id}`))
        .send()
        .result();
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Logout of BitGo
   * @param params
   * @param callback
   */
  logout(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      const result = yield self.get(self.url('/user/logout')).result();
      self.clear();
      return result;
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Get a user by ID (name/email only)
   * @param id
   * @param callback
   */
  getUser({ id }: GetUserOptions, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      if (!_.isString(id)) {
        throw new Error('expected string id');
      }
      return this.get(this.url(`/user/${id}`)).result('user');
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Change the password of the currently logged in user.
   * Also change all v1 and v2 keychain passwords if they match the
   * given oldPassword. Returns nothing on success.
   * @param oldPassword {String} - the current password
   * @param newPassword {String} - the new password
   * @param callback
   */
  changePassword({ oldPassword, newPassword }: ChangePasswordOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *coChangePassword() {
      if (!_.isString(oldPassword)) {
        throw new Error('expected string oldPassword');
      }

      if (!_.isString(newPassword)) {
        throw new Error('expected string newPassword');
      }

      const user = self.user();
      if (typeof user !== 'object' || !user.username) {
        throw new Error('missing required object user');
      }

      const validation = yield self.verifyPassword({ password: oldPassword });
      if (!validation) {
        throw new Error('the provided oldPassword is incorrect');
      }

      // it doesn't matter which coin we choose because the v2 updatePassword functions updates all v2 keychains
      // we just need to choose a coin that exists in the current environment
      const coin = common.Environments[self.getEnv()].network === 'bitcoin' ? 'btc' : 'tbtc';

      const updateKeychainPasswordParams = { oldPassword, newPassword };
      const v1KeychainUpdatePWResult = yield self.keychains().updatePassword(updateKeychainPasswordParams);
      const v2Keychains = yield self.coin(coin).keychains().updatePassword(updateKeychainPasswordParams);

      const updatePasswordParams = {
        keychains: v1KeychainUpdatePWResult.keychains,
        v2_keychains: v2Keychains,
        version: v1KeychainUpdatePWResult.version,
        oldPassword: self.calculateHMAC(user.username, oldPassword),
        password: self.calculateHMAC(user.username, newPassword)
      };

      return self.post(self.url('/user/changepassword'))
        .send(updatePasswordParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Get the current logged in user
   * @param params
   * @param callback
   */
  me(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.getUser({ id: 'me' }, callback);
  }

  /**
   * Unlock the session by providing OTP
   * @param {string} otp Required OTP code for the account.
   * @param {number} duration Desired duration of the unlock in seconds (default=600, max=3600).
   * @param callback
   */
  unlock({ otp, duration }: UnlockOptions, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      if (otp && !_.isString(otp)) {
        throw new Error('expected string or undefined otp');
      }
      return self.post(self.url('/user/unlock'))
        .send({ otp, duration })
        .result();
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Lock the session
   * @param params
   * @param callback
   */
  lock(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.post(this.url('/user/lock'))
      .result()
      .nodeify(callback);
  }

  /**
   * Get the current session
   */
  session(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/user/session'))
      .result('session')
      .nodeify(callback);
  }

  /**
   * Trigger a push/sms for the OTP code
   * @param {boolean} params.forceSMS If set to true, will use SMS to send the OTP to the user even if they have other 2FA method set up.
   * @deprecated
   */
  sendOTP(params: { forceSMS?: boolean } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.post(this.url('/user/sendotp'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Extend token, provided the current token is extendable
   * @param params
   * - duration: duration in seconds by which to extend the token, starting at the current time
   * @param callback
   */
  extendToken(params: ExtendTokenOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    if (!this._extensionKey) {
      throw new Error('missing required property _extensionKey');
    }

    const timestamp = Date.now();
    const duration = params.duration;
    const message = timestamp + '|' + this._token + '|' + duration;
    const privateKey = this._extensionKey.d.toBuffer(32);
    const isCompressed = this._extensionKey.compressed;
    const prefix = bitcoin.networks.bitcoin.messagePrefix;
    const signature = bitcoinMessage.sign(message, privateKey, isCompressed, prefix).toString('hex');

    return this.post(this.url('/user/extendtoken'))
      .send(params)
      .set('timestamp', timestamp.toString())
      .set('signature', signature)
      .result()
      .nodeify(callback);
  }

  /**
   * Get a key for sharing a wallet with a user
   * @param email email of user to share wallet with
   * @param callback
   */
  getSharingKey({ email }: GetSharingKeyOptions, callback?: NodeCallback<any>): Bluebird<any> {
    if (!_.isString(email)) {
      throw new Error('required string email');
    }

    return this.post(this.url('/user/sharingkey'))
      .send({ email })
      .result()
      .nodeify(callback);
  }

  /**
   * Test connectivity to the server
   * @param params
   * @param callback
   */
  ping({ reqId }: PingOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    if (reqId) {
      this._reqId = reqId;
    }

    return this.get(this.url('/ping'))
      .result()
      .nodeify(callback);
  }

  /**
   * Get the blockchain object.
   * @deprecated
   */
  blockchain(): any {
    if (!this._blockchain) {
      this._blockchain = new Blockchain(this);
    }
    return this._blockchain;
  }

  /**
   * Get the user's keychains object.
   * @deprecated
   */
  keychains(): any {
    if (!this._keychains) {
      this._keychains = new Keychains(this);
    }
    return this._keychains;
  }

  /**
   * Get the user's wallets object.
   * @deprecated
   */
  wallets() {
    if (!this._wallets) {
      this._wallets = new Wallets(this);
    }
    return this._wallets;
  }

  /**
   * Get the travel rule object
   * @deprecated
   */
  travelRule(): any {
    if (!this._travelRule) {
      this._travelRule = new TravelRule(this);
    }
    return this._travelRule;
  }

  /**
   * Get pending approvals that can be approved/ or rejected
   * @deprecated
   */
  pendingApprovals(): any {
    if (!this._pendingApprovals) {
      this._pendingApprovals = new PendingApprovals(this);
    }
    return this._pendingApprovals;
  }

  /**
   * A factory method to create a new Wallet object, initialized with the wallet params
   * Can be used to reconstitute a wallet from cached data
   * @param walletParams
   * @deprecated
   */
  newWalletObject(walletParams): any {
    return new Wallet(this, walletParams);
  }

  /**
   * Create a url for calling BitGo platform APIs
   * @param path
   * @param version
   */
  url(path: string, version = 1): string {
    const baseUrl = version === 2 ? this._baseApiUrlV2 : this._baseApiUrl;
    return baseUrl + path;
  }

  /**
   * Create a url for calling BitGo microservice APIs
   */
  microservicesUrl(path: string): string {
    return this._microservicesUrl + path;
  }

  /**
   * Get all the address labels on all of the user's wallets
   */
  labels(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/labels'))
      .result('labels')
      .nodeify(callback);
  }

  /**
   * Estimates approximate fee per kb needed for a tx to get into a block
   * @param {number} params.numBlocks target blocks for the transaction to be confirmed
   * @param {number} params.maxFee maximum fee willing to be paid (for safety)
   * @param {array[string]} params.inputs list of unconfirmed txIds from which this transaction uses inputs
   * @param {number} params.txSize estimated transaction size in bytes, optional parameter used for CPFP estimation.
   * @param {boolean} params.cpfpAware flag indicating fee should take into account CPFP
   * @deprecated
   */
  estimateFee(params: EstimateFeeOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const queryParams: any = { version: 12 };
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
  }

  /**
   * Get BitGo's guarantee using an instant id
   * @param params
   * @param callback
   * @deprecated
   */
  instantGuarantee(params: { id: string }, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      if (!_.isString(params.id)) {
        throw new Error('required string id');
      }

      const body = yield self.get(self.url('/instant/' + params.id)).result();
      if (!body.guarantee) {
        throw new Error('no guarantee found in response body');
      }
      if (!body.signature) {
        throw new Error('no signature found in guarantee response body');
      }
      const signingAddress = common.Environments[self.getEnv()].signingAddress;
      const signatureBuffer = new Buffer(body.signature, 'hex');
      const prefix = bitcoin.networks[common.Environments[self.getEnv()].network].messagePrefix;
      const isValidSignature = bitcoinMessage.verify(body.guarantee, signingAddress, signatureBuffer, prefix);
      if (!isValidSignature) {
        throw new Error('incorrect signature');
      }
      return body;
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Get a target address for payment of a BitGo fee
   * @param params
   * @param callback
   * @deprecated
   */
  getBitGoFeeAddress(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.post(this.url('/billing/address'))
      .send({})
      .result()
      .nodeify(callback);
  }

  /**
   * Gets an address object (including the wallet id) for a given address.
   * @param {string} params.address The address to look up.
   * @deprecated
   */
  getWalletAddress({ address }: { address: string }, callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url(`/walletaddress/${address}`))
      .result()
      .nodeify(callback);
  }

  /**
   * Fetch list of user webhooks
   *
   * @param callback
   * @returns {*}
   * @deprecated
   */
  listWebhooks(callback?: NodeCallback<any>): Bluebird<any> {
    return this.get(this.url('/webhooks'))
      .result()
      .nodeify(callback);
  }

  /**
   * Add new user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   * @deprecated
   */
  addWebhook(params: WebhookOptions, callback?: NodeCallback<any>): Bluebird<any> {
    if (!_.isString(params.url)) {
      throw new Error('required string url');
    }

    if (!_.isString(params.type)) {
      throw new Error('required string type');
    }

    return this.post(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Remove user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   * @deprecated
   */
  removeWebhook(params: WebhookOptions, callback) {
    if (!_.isString(params.url)) {
      throw new Error('required string url');
    }

    if (!_.isString(params.type)) {
      throw new Error('required string type');
    }

    return this.del(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Fetch list of webhook notifications for the user
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  listWebhookNotifications(params: ListWebhookNotificationsOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: any = {};
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
  }

  /**
   * Simulate a user webhook
   *
   * @param params
   * @param callback
   * @returns {*}
   */
  simulateWebhook(params: BitGoSimulateWebhookOptions, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['webhookId', 'blockId'], [], callback);
    if (!_.isString(params.webhookId)) {
      throw new Error('required string webhookId');
    }

    if (!_.isString(params.blockId)) {
      throw new Error('required string blockId');
    }

    return this.post(this.url(`/webhooks/${params.webhookId}/simulate`))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Receives a TTL and refetches as necessary
   * @param params
   * @param callback
   */
  fetchConstants(params?: {}, callback?: NodeCallback<any>): Bluebird<any> {
    const self = this;
    return co(function *() {
      const env = self.getEnv();

      if (!BitGo._constants) {
        BitGo._constants = {};
      }
      if (!BitGo._constantsExpire) {
        BitGo._constantsExpire = {};
      }

      if (BitGo._constants[env] && BitGo._constantsExpire[env] && new Date() < BitGo._constantsExpire[env]) {
        return BitGo._constants[env];
      }

      // client constants call cannot be authenticated using the normal HMAC validation
      // scheme, so we need to use a raw superagent instance to do this request.
      // Proxy settings must still be respected however
      const resultPromise = superagent.get(self.url('/client/constants'));
      const result = yield (self._proxy ? resultPromise.proxy(self._proxy) : resultPromise);
      BitGo._constants[env] = result.body.constants;

      BitGo._constantsExpire[env] = moment.utc().add(result.body.ttl, 'second').toDate();
      return BitGo._constants[env];
    }).call(this).asCallback(callback);
  }

  /**
   * Synchronously get constants which are relevant to the client.
   *
   * Note: This function has a known race condition. It may return different values over time,
   * especially if called shortly after creation of the BitGo object.
   *
   * New code should call fetchConstants() directly instead.
   *
   * @deprecated
   * @param params
   * @return {Object} The client constants object
   */
  getConstants(params?: {}) {
    // kick off a fresh request for the client constants
    this.fetchConstants(params, function(err) {
      if (err) {
        // make sure an error does not terminate the entire script
        console.error('failed to fetch client constants from BitGo');
        console.trace(err);
      }
    });

    // use defaultConstants as the backup for keys that are not set in this._constants
    return _.merge({}, config.defaultConstants(this.getEnv()), BitGo._constants[this.getEnv()]);
  }

  /**
   * V1 method for calculating miner fee amounts, given the number and
   * type of transaction inputs, along with a fee rate in satoshis per vkB.
   *
   * This method should not be used for new code.
   *
   * @deprecated
   * @param params
   * @param callback
   * @return {any}
   */
  calculateMinerFeeInfo(params: any, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      return TransactionBuilder.calculateMinerFeeInfo(params);
    }).call(this).asCallback(callback);
  }

  /**
   * Set a request tracer to provide request IDs during multi-request workflows
   */
  setRequestTracer(reqTracer: IRequestTracer) {
    if (reqTracer) {
      this._reqId = reqTracer;
    }
  }
}
