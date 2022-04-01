import * as _ from 'lodash';
import { BitGoRequest, serializeRequestData, setRequestQueryString, toBitgoRequest, verifyResponse } from './api';
import debugLib from 'debug';
import * as superagent from 'superagent';
import * as urlLib from 'url';
import { createHmac } from 'crypto';
import * as utxolib from '@bitgo/utxo-lib';
import { AliasEnvironments, common, EnvironmentName } from '@bitgo/sdk-core';
import { getAddressP2PKH, makeRandomKey } from './util';
import * as sjcl from '@bitgo/sjcl';
import {
  AccessTokenOptions,
  IRequestTracer,
  PingOptions,
  AuthenticateOptions,
  CalculateHmacSubjectOptions,
  CalculateRequestHeadersOptions,
  CalculateRequestHmacOptions,
  ProcessedAuthenticationOptions,
  RequestHeaders,
  VerifyResponseInfo,
  VerifyResponseOptions,
  BitGoAPIOptions,
  DecryptOptions,
  EncryptOptions,
} from './types';
import moment = require('moment');
import pjson = require('../package.json');
import { decrypt, encrypt } from './encrypt';

const debug = debugLib('bitgo:api');

if (!(process as any).browser) {
  debug('enabling superagent-proxy wrapper');
  require('superagent-proxy')(superagent);
}

const patchedRequestMethods = ['get', 'post', 'put', 'del', 'patch'] as const;

export abstract class BitGoAPI {
  protected static _constants: any;
  protected static _constantsExpire: any;
  protected static _testnetWarningMessage = false;
  public readonly env: EnvironmentName;
  protected readonly _baseUrl: string;
  protected readonly _baseApiUrl: string;
  protected readonly _baseApiUrlV2: string;
  protected readonly _env: EnvironmentName;
  protected readonly _authVersion: Exclude<BitGoAPIOptions['authVersion'], undefined> = 2;
  protected _hmacVerification = true;
  protected readonly _proxy?: string;
  protected _extensionKey?: utxolib.ECPair.ECPairInterface;
  protected _reqId?: IRequestTracer;
  protected _token?: string;
  protected _version = pjson.version;
  protected _userAgent?: string;

  constructor(params: BitGoAPIOptions = {}) {
    if (
      !common.validateParams(
        params,
        [],
        [
          'accessToken',
          'userAgent',
          'customRootURI',
          'customBitcoinNetwork',
          'serverXpub',
          'stellarFederationServerUrl',
        ]
      ) ||
      (params.useProduction && !_.isBoolean(params.useProduction))
    ) {
      throw new Error('invalid argument');
    }

    // By default, we operate on the test server.
    // Deprecate useProduction in the future
    let env: EnvironmentName;

    if (params.useProduction) {
      if (params.env && params.env !== 'prod') {
        throw new Error('cannot use useProduction when env=' + params.env);
      }
      env = 'prod';
    } else if (
      params.customRootURI ||
      params.customBitcoinNetwork ||
      params.customSigningAddress ||
      params.serverXpub ||
      process.env.BITGO_CUSTOM_ROOT_URI ||
      process.env.BITGO_CUSTOM_BITCOIN_NETWORK
    ) {
      // for branch deploys, we want to be able to specify custom endpoints while still
      // maintaining the name of specified the environment
      env = params.env === 'branch' ? 'branch' : 'custom';
      if (params.customRootURI) {
        common.Environments[env].uri = params.customRootURI;
      }
      if (params.customBitcoinNetwork) {
        common.Environments[env].network = params.customBitcoinNetwork;
      }
      if (params.customSigningAddress) {
        (common.Environments[env] as any).customSigningAddress = params.customSigningAddress;
      }
      if (params.serverXpub) {
        common.Environments[env].serverXpub = params.serverXpub;
      }
      if (params.stellarFederationServerUrl) {
        common.Environments[env].stellarFederationServerUrl = params.stellarFederationServerUrl;
      }
    } else {
      env = params.env || (process.env.BITGO_ENV as EnvironmentName);
    }

    if (params.authVersion !== undefined) {
      this._authVersion = params.authVersion;
    }

    // if this env is an alias, swap it out with the equivalent supported environment
    if (env in AliasEnvironments) {
      env = AliasEnvironments[env];
    }

    if (env === 'custom' && _.isUndefined(common.Environments[env].uri)) {
      throw new Error(
        'must use --customrooturi or set the BITGO_CUSTOM_ROOT_URI environment variable when using the custom environment'
      );
    }

    if (env) {
      if (common.Environments[env]) {
        this._baseUrl = common.Environments[env].uri;
      } else {
        throw new Error('invalid environment ' + env + '. Supported environments: prod, test, dev, latest');
      }
    } else {
      env = 'test';
      if (!BitGoAPI._testnetWarningMessage) {
        BitGoAPI._testnetWarningMessage = true;
        console.log('BitGo SDK env not set - defaulting to test at test.bitgo.com.');
      }
      this._baseUrl = common.Environments[env].uri;
    }
    this._env = this.env = env;

    if (params.etherscanApiToken) {
      common.Environments[env].etherscanApiToken = params.etherscanApiToken;
    }

    common.setNetwork(common.Environments[env].network);

    this._baseApiUrl = this._baseUrl + '/api/v1';
    this._baseApiUrlV2 = this._baseUrl + '/api/v2';
    this._token = params.accessToken;
    this._userAgent = params.userAgent || 'BitGoJS/' + this.version();
    this._reqId = undefined;

    if (!params.hmacVerification && params.hmacVerification !== undefined) {
      if (common.Environments[env].hmacVerificationEnforced) {
        throw new Error(`Cannot disable request HMAC verification in environment ${this.getEnv()}`);
      }
      debug('HMAC verification explicitly disabled by constructor option');
      this._hmacVerification = params.hmacVerification;
    }
    if (!params.proxy && process.env.BITGO_USE_PROXY) {
      params.proxy = process.env.BITGO_USE_PROXY;
    }

    if ((process as any).browser && params.proxy) {
      throw new Error('cannot use https proxy params while in browser');
    }

    this._proxy = params.proxy;

    // capture outer stack so we have useful debug information if fetch constants fails
    const e = new Error();

    // Kick off first load of constants
    this.fetchConstants().catch((err) => {
      if (err) {
        // make sure an error does not terminate the entire script
        console.error('failed to fetch initial client constants from BitGo');
        debug(e.stack);
      }
    });
  }

  /**
   * Return the current BitGo environment
   */
  getEnv(): EnvironmentName {
    return this._env;
  }

  /**
   * Return the current auth version used for requests to the BitGo server
   */
  getAuthVersion(): number {
    return this._authVersion;
  }

  /**
   * This is a patching function which can apply our authorization
   * headers to any outbound request.
   * @param method
   */
  private requestPatch(method: typeof patchedRequestMethods[number], url: string) {
    let req: superagent.SuperAgentRequest = superagent[method](url);
    if (this._proxy) {
      debug('proxying request through %s', this._proxy);
      req = req.proxy(this._proxy);
    }

    const originalThen = req.then.bind(req);
    req.then = (onfulfilled, onrejected) => {
      // intercept a request before it's submitted to the server for v2 authentication (based on token)
      if (this._version) {
        // TODO - decide where to get version
        req.set('BitGo-SDK-Version', this._version);
      }

      if (!_.isUndefined(this._reqId)) {
        req.set('Request-ID', this._reqId.toString());

        // increment after setting the header so the sequence numbers start at 0
        this._reqId.inc();

        // request ids must be set before each request instead of being kept
        // inside the bitgo object. This is to prevent reentrancy issues where
        // multiple simultaneous requests could cause incorrect reqIds to be used
        delete this._reqId;
      }

      // prevent IE from caching requests
      req.set('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT');

      if (!(process as any).browser && this._userAgent) {
        // If not in the browser, set the User-Agent. Browsers don't allow
        // setting of User-Agent, so we must disable this when run in the
        // browser (browserify sets process.browser).
        req.set('User-Agent', this._userAgent);
      }

      // Set the request timeout to just above 5 minutes by default
      req.timeout((process.env.BITGO_TIMEOUT as any) * 1000 || 305 * 1000);

      // if there is no token, and we're not logged in, the request cannot be v2 authenticated
      req.isV2Authenticated = true;
      req.authenticationToken = this._token;
      // some of the older tokens appear to be only 40 characters long
      if ((this._token && this._token.length !== 67 && this._token.indexOf('v2x') !== 0) || req.forceV1Auth) {
        // use the old method
        req.isV2Authenticated = false;

        req.set('Authorization', 'Bearer ' + this._token);
        debug('sending v1 %s request to %s with token %s', method, url, this._token?.substr(0, 8));
        return originalThen(onfulfilled).catch(onrejected);
      }

      req.set('BitGo-Auth-Version', this._authVersion === 3 ? '3.0' : '2.0');

      if (this._token) {
        const data = serializeRequestData(req);
        setRequestQueryString(req);

        const requestProperties = this.calculateRequestHeaders({
          url: req.url,
          token: this._token,
          method,
          text: data || '',
        });
        req.set('Auth-Timestamp', requestProperties.timestamp.toString());

        // we're not sending the actual token, but only its hash
        req.set('Authorization', 'Bearer ' + requestProperties.tokenHash);
        debug('sending v2 %s request to %s with token %s', method, url, this._token?.substr(0, 8));

        // set the HMAC
        req.set('HMAC', requestProperties.hmac);
      }

      /**
       * Verify the response before calling the original onfulfilled handler,
       * and make sure onrejected is called if a verification error is encountered
       */
      const newOnFulfilled = onfulfilled
        ? (response: superagent.Response) => {
            // HMAC verification is only allowed to be skipped in certain environments.
            // This is checked in the constructor, but checking it again at request time
            // will help prevent against tampering of this property after the object is created
            if (!this._hmacVerification && !common.Environments[this.getEnv()].hmacVerificationEnforced) {
              return onfulfilled(response);
            }

            const verifiedResponse = verifyResponse(this, this._token, method, req, response);
            return onfulfilled(verifiedResponse);
          }
        : null;
      return originalThen(newOnFulfilled).catch(onrejected);
    };
    return toBitgoRequest(req);
  }

  get(url: string): BitGoRequest {
    return this.requestPatch('get', url);
  }
  post(url: string): BitGoRequest {
    return this.requestPatch('post', url);
  }
  put(url: string): BitGoRequest {
    return this.requestPatch('put', url);
  }
  del(url: string): BitGoRequest {
    return this.requestPatch('del', url);
  }
  patch(url: string): BitGoRequest {
    return this.requestPatch('patch', url);
  }

  /**
   * Calculate the HMAC for the given key and message
   * @param key {String} - the key to use for the HMAC
   * @param message {String} - the actual message to HMAC
   * @returns {*} - the result of the HMAC operation
   */
  calculateHMAC(key: string, message: string): string {
    return createHmac('sha256', key).update(message).digest('hex');
  }

  /**
   * Calculate the subject string that is to be HMAC'ed for a HTTP request or response
   * @param urlPath request url, including query params
   * @param text request body text
   * @param timestamp request timestamp from `Date.now()`
   * @param statusCode Only set for HTTP responses, leave blank for requests
   * @param method request method
   * @returns {string}
   */
  calculateHMACSubject({ urlPath, text, timestamp, statusCode, method }: CalculateHmacSubjectOptions): string {
    const urlDetails = urlLib.parse(urlPath);
    const queryPath = urlDetails.query && urlDetails.query.length > 0 ? urlDetails.path : urlDetails.pathname;
    if (!_.isUndefined(statusCode) && _.isInteger(statusCode) && _.isFinite(statusCode)) {
      if (this._authVersion === 3) {
        return [method.toUpperCase(), timestamp, queryPath, statusCode, text].join('|');
      }
      return [timestamp, queryPath, statusCode, text].join('|');
    }
    if (this._authVersion === 3) {
      return [method.toUpperCase(), timestamp, '3.0', queryPath, text].join('|');
    }
    return [timestamp, queryPath, text].join('|');
  }

  /**
   * Calculate the HMAC for an HTTP request
   */
  calculateRequestHMAC({ url: urlPath, text, timestamp, token, method }: CalculateRequestHmacOptions): string {
    const signatureSubject = this.calculateHMACSubject({ urlPath, text, timestamp, method });

    // calculate the HMAC
    return this.calculateHMAC(token, signatureSubject);
  }

  /**
   * Calculate request headers with HMAC
   */
  calculateRequestHeaders({ url, text, token, method }: CalculateRequestHeadersOptions): RequestHeaders {
    const timestamp = Date.now();
    const hmac = this.calculateRequestHMAC({ url, text, timestamp, token, method });

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
  verifyResponse({
    url: urlPath,
    statusCode,
    text,
    timestamp,
    token,
    hmac,
    method,
  }: VerifyResponseOptions): VerifyResponseInfo {
    const signatureSubject = this.calculateHMACSubject({
      urlPath,
      text,
      timestamp,
      statusCode,
      method,
    });

    // calculate the HMAC
    const expectedHmac = this.calculateHMAC(token, signatureSubject);

    // determine if the response is still within the validity window (5 minute window)
    const now = Date.now();
    const isInResponseValidityWindow = timestamp >= now - 1000 * 60 * 5 && timestamp <= now;

    // verify the HMAC and timestamp
    return {
      isValid: expectedHmac === hmac,
      expectedHmac,
      signatureSubject,
      isInResponseValidityWindow,
      verificationTime: now,
    };
  }

  /**
   * Process the username, password and otp into an object containing the username and hashed password, ready to
   * send to bitgo for authentication.
   */
  preprocessAuthenticationParams({
    username,
    password,
    otp,
    forceSMS,
    extensible,
    trust,
  }: AuthenticateOptions): ProcessedAuthenticationOptions {
    if (!_.isString(username)) {
      throw new Error('expected string username');
    }

    if (!_.isString(password)) {
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
      authParams.extensionAddress = getAddressP2PKH(this._extensionKey);
    }

    return authParams;
  }

  /**
   * Fetch useful constant values from the BitGo server.
   * These values do change infrequently, so they need to be fetched,
   * but are unlikely to change during the lifetime of a BitGo object,
   * so they can safely cached.
   */
  async fetchConstants(): Promise<any> {
    const env = this.getEnv();

    if (!BitGoAPI._constants) {
      BitGoAPI._constants = {};
    }
    if (!BitGoAPI._constantsExpire) {
      BitGoAPI._constantsExpire = {};
    }

    if (BitGoAPI._constants[env] && BitGoAPI._constantsExpire[env] && new Date() < BitGoAPI._constantsExpire[env]) {
      return BitGoAPI._constants[env];
    }

    // client constants call cannot be authenticated using the normal HMAC validation
    // scheme, so we need to use a raw superagent instance to do this request.
    // Proxy settings must still be respected however
    const resultPromise = superagent.get(this.url('/client/constants'));
    const result = await (this._proxy ? resultPromise.proxy(this._proxy) : resultPromise);
    BitGoAPI._constants[env] = result.body.constants;

    BitGoAPI._constantsExpire[env] = moment.utc().add(result.body.ttl, 'second').toDate();
    return BitGoAPI._constants[env];
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
    return this._baseUrl + path;
  }

  /**
   * Gets the version of the BitGoJS package
   */
  version(): string {
    return this._version;
  }

  /**
   * Synchronous method for activating an access token.
   */
  authenticateWithAccessToken({ accessToken }: AccessTokenOptions): void {
    debug('now authenticating with access token %s', accessToken.substring(0, 8));
    this._token = accessToken;
  }

  /**
   * Test connectivity to the server
   * @param params
   */
  ping({ reqId }: PingOptions = {}): Promise<any> {
    if (reqId) {
      this._reqId = reqId;
    }

    return this.get(this.url('/ping')).result();
  }

  /**
   * Set a request tracer to provide request IDs during multi-request workflows
   */
  setRequestTracer(reqTracer: IRequestTracer): void {
    if (reqTracer) {
      this._reqId = reqTracer;
    }
  }

  /**
   * Utility function to encrypt locally.
   */
  encrypt(params: EncryptOptions): string {
    common.validateParams(params, ['input', 'password'], []);
    if (!params.password) {
      throw new Error(`cannot encrypt without password`);
    }
    return encrypt(params.password, params.input);
  }

  /**
   * Decrypt an encrypted string locally.
   */
  decrypt(params: DecryptOptions): string {
    params = params || {};
    common.validateParams(params, ['input', 'password'], []);
    if (!params.password) {
      throw new Error(`cannot decrypt without password`);
    }
    try {
      return decrypt(params.password, params.input);
    } catch (error) {
      if (error.message.includes("ccm: tag doesn't match")) {
        error.message = 'password error - ' + error.message;
      }
      throw error;
    }
  }
}
