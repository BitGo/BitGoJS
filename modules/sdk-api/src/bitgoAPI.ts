import * as _ from 'lodash';
import * as bip32 from 'bip32';
import * as secp256k1 from 'secp256k1';
import * as bs58 from 'bs58';
import * as bitcoinMessage from 'bitcoinjs-message';
import {
  handleResponseError,
  handleResponseResult,
  serializeRequestData,
  setRequestQueryString,
  toBitgoRequest,
  verifyResponse,
} from './api';
import debugLib from 'debug';
import * as superagent from 'superagent';
import * as urlLib from 'url';
import { createHmac } from 'crypto';
import * as utxolib from '@bitgo/utxo-lib';
import {
  AliasEnvironments,
  BitGoBase,
  BitGoRequest,
  CoinConstructor,
  common,
  DecryptOptions,
  EncryptOptions,
  EnvironmentName,
  GetSharingKeyOptions,
  GlobalCoinFactory,
  IBaseCoin,
  IRequestTracer,
  sanitizeLegacyPath,
} from '@bitgo/sdk-core';
import { getAddressP2PKH, makeRandomKey } from './util';
import * as sjcl from '@bitgo/sjcl';
import {
  AccessTokenOptions,
  AddAccessTokenOptions,
  AuthenticateOptions,
  BitGoAPIOptions,
  BitGoJson,
  CalculateHmacSubjectOptions,
  CalculateRequestHeadersOptions,
  CalculateRequestHmacOptions,
  ExtendTokenOptions,
  GetUserOptions,
  PingOptions,
  ProcessedAuthenticationOptions,
  RemoveAccessTokenOptions,
  RequestHeaders,
  TokenIssuance,
  TokenIssuanceResponse,
  UnlockOptions,
  User,
  VerifyPasswordOptions,
  VerifyResponseInfo,
  VerifyResponseOptions,
} from './types';
import pjson = require('../package.json');
import { decrypt, encrypt } from './encrypt';

const debug = debugLib('bitgo:api');

if (!(process as any)?.browser) {
  debug('enabling superagent-proxy wrapper');
  require('superagent-proxy')(superagent);
}

const patchedRequestMethods = ['get', 'post', 'put', 'del', 'patch'] as const;

export class BitGoAPI implements BitGoBase {
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
  protected _user?: User;
  protected _extensionKey?: utxolib.ECPair.ECPairInterface;
  protected _reqId?: IRequestTracer;
  protected _token?: string;
  protected _version = pjson.version;
  protected _userAgent?: string;
  protected _ecdhXprv?: string;
  protected _refreshToken?: string;
  protected readonly _clientId?: string;
  protected readonly _clientSecret?: string;
  protected _validate: boolean;

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
    this._userAgent = params.userAgent || 'BitGoJS-api/' + this.version();
    this._reqId = undefined;
    this._refreshToken = params.refreshToken;
    this._clientId = params.clientId;
    this._clientSecret = params.clientSecret;

    // whether to perform extra client-side validation for some things, such as
    // address validation or signature validation. defaults to true, but can be
    // turned off by setting to false. can also be overridden individually in the
    // functions that use it.
    this._validate = params.validate === undefined ? true : params.validate;

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

  wallets(): any {
    throw new Error('Method not implemented.');
  }

  /**
   * Create a basecoin object
   * @param name
   */
  public coin(name: string): IBaseCoin {
    return GlobalCoinFactory.getInstance(this, name);
  }

  getECDHSharingKeychain(): Promise<any> {
    throw new Error('Method not implemented.');
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
    resultPromise.set('BitGo-SDK-Version', this._version);
    const result = await (this._proxy ? resultPromise.proxy(this._proxy) : resultPromise);
    BitGoAPI._constants[env] = result.body.constants;

    if (result.body?.ttl && typeof result.body?.ttl === 'number') {
      BitGoAPI._constantsExpire[env] = new Date(new Date().getTime() + (result.body.ttl as number) * 1000);
    }

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
      ecdhXprv: this._ecdhXprv,
    };
  }

  /**
   * Get the current user
   */
  user(): User | undefined {
    return this._user;
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
    this._ecdhXprv = json.ecdhXprv;
    if (json.extensionKey) {
      const network = common.Environments[this.getEnv()].network;
      this._extensionKey = utxolib.ECPair.fromWIF(
        json.extensionKey,
        utxolib.networks[network] as utxolib.BitcoinJSNetwork
      );
    }
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
   * Synchronous method for activating an access token.
   */
  authenticateWithAccessToken({ accessToken }: AccessTokenOptions): void {
    debug('now authenticating with access token %s', accessToken.substring(0, 8));
    this._token = accessToken;
  }

  /**
   * Login to the bitgo platform.
   */
  async authenticate(params: AuthenticateOptions): Promise<any> {
    try {
      if (!_.isObject(params)) {
        throw new Error('required object params');
      }

      if (!_.isString(params.password)) {
        throw new Error('expected string password');
      }

      const forceV1Auth = !!params.forceV1Auth;
      const authParams = this.preprocessAuthenticationParams(params);
      const password = params.password;

      if (this._token) {
        return new Error('already logged in');
      }

      const authUrl = this.microservicesUrl('/api/auth/v1/session');
      const request = this.post(authUrl);

      if (forceV1Auth) {
        request.forceV1Auth = true;
        // tell the server that the client was forced to downgrade the authentication protocol
        authParams.forceV1Auth = true;
        debug('forcing v1 auth for call to authenticate');
      }
      const response: superagent.Response = await request.send(authParams);
      // extract body and user information
      const body = response.body;
      this._user = body.user;

      if (body.access_token) {
        this._token = body.access_token;
        // if the downgrade was forced, adding a warning message might be prudent
      } else {
        // check the presence of an encrypted ECDH xprv
        // if not present, legacy account
        const encryptedXprv = body.encryptedECDHXprv;
        if (!encryptedXprv) {
          throw new Error('Keychain needs encryptedXprv property');
        }

        const responseDetails = this.handleTokenIssuance(response.body, password);
        this._token = responseDetails.token;
        this._ecdhXprv = responseDetails.ecdhXprv;

        // verify the response's authenticity
        verifyResponse(this, responseDetails.token, 'post', request, response);

        // add the remaining component for easier access
        response.body.access_token = this._token;
      }

      return handleResponseResult<any>()(response);
    } catch (e) {
      handleResponseError(e);
    }
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
          password: password,
        });
      } catch (e) {
        e.errorCode = 'ecdh_xprv_decryption_failure';
        console.error('Failed to decrypt encryptedECDHXprv.');
        throw e;
      }
    }

    // construct HDNode objects for client's xprv and server's xpub
    const clientHDNode = bip32.fromBase58(ecdhXprv);
    const serverHDNode = bip32.fromBase58(serverXpub);

    // BIP32 derivation path is applied to both client and server master keys
    const derivationPath = sanitizeLegacyPath(responseBody.derivationPath);
    const clientDerivedNode = clientHDNode.derivePath(derivationPath);
    const serverDerivedNode = serverHDNode.derivePath(derivationPath);

    const publicKey = serverDerivedNode.publicKey;
    const secretKey = clientDerivedNode.privateKey;
    if (!secretKey) {
      throw new Error('no client private Key');
    }
    const secret = Buffer.from(
      // FIXME(BG-34386): we should use `secp256k1.ecdh()` in the future
      //                  see discussion here https://github.com/bitcoin-core/secp256k1/issues/352
      secp256k1.publicKeyTweakMul(publicKey, secretKey)
    ).toString('hex');

    // decrypt token with symmetric ECDH key
    let response: TokenIssuance;
    try {
      response = {
        token: this.decrypt({
          input: responseBody.encryptedToken,
          password: secret,
        }),
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
   */
  verifyPassword(params: VerifyPasswordOptions = {}): Promise<any> {
    if (!_.isString(params.password)) {
      throw new Error('missing required string password');
    }

    if (!this._user || !this._user.username) {
      throw new Error('no current user');
    }
    const hmacPassword = this.calculateHMAC(this._user.username, params.password);

    return this.post(this.url('/user/verifypassword')).send({ password: hmacPassword }).result('valid');
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
   * Use refresh token to get new access token.
   * If the refresh token is null/defined, then we use the stored token from auth
   */
  async refreshToken(params: { refreshToken?: string } = {}): Promise<any> {
    common.validateParams(params, [], ['refreshToken']);

    const refreshToken = params.refreshToken || this._refreshToken;

    if (!refreshToken) {
      throw new Error('Must provide refresh token or have authenticated with Oauth before');
    }

    if (!this._clientId || !this._clientSecret) {
      throw new Error('Need client id and secret set first to use this');
    }

    const body = await this.post(this._baseUrl + '/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this._clientId,
        client_secret: this._clientSecret,
      })
      .result();
    this._token = body.access_token;
    this._refreshToken = body.refresh_token;
    return body;
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
  async listAccessTokens(): Promise<any> {
    return this.get(this.url('/user/accesstoken')).send().result('accessTokens');
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
  async addAccessToken(params: AddAccessTokenOptions): Promise<any> {
    try {
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
        _.forEach(params.ipRestrict, (ipAddr) => {
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

      const authUrl = this.microservicesUrl('/api/auth/v1/accesstoken');
      const request = this.post(authUrl);

      if (!this._ecdhXprv) {
        // without a private key, the user cannot decrypt the new access token the server will send
        request.forceV1Auth = true;
        debug('forcing v1 auth for adding access token using token %s', this._token?.substr(0, 8));
      }

      const response = await request.send(params);
      if (request.forceV1Auth) {
        (response as any).body.warning = 'A protocol downgrade has occurred because this is a legacy account.';
        return handleResponseResult()(response);
      }

      // verify the authenticity of the server's response before proceeding any further
      verifyResponse(this, this._token, 'post', request, response);

      const responseDetails = this.handleTokenIssuance(response.body);
      response.body.token = responseDetails.token;

      return handleResponseResult()(response);
    } catch (e) {
      handleResponseError(e);
    }
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
   */
  async removeAccessToken({ id, label }: RemoveAccessTokenOptions): Promise<any> {
    if ((!id && !label) || (id && label)) {
      throw new Error('must provide exactly one of id or label');
    }
    if (id) {
      return this.del(this.url(`/user/accesstoken/${id}`))
        .send()
        .result();
    }

    const tokens = await this.listAccessTokens();

    if (!tokens) {
      throw new Error('token with this label does not exist');
    }

    const matchingTokens = _.filter(tokens, { label });
    if (matchingTokens.length > 1) {
      throw new Error('ambiguous call: multiple tokens matching this label');
    }
    if (matchingTokens.length === 0) {
      throw new Error('token with this label does not exist');
    }

    return this.del(this.url(`/user/accesstoken/${matchingTokens[0].id}`))
      .send()
      .result();
  }

  /**
   * Generate a random password
   * @param   {Number} numWords     Number of 32-bit words
   * @returns {String}          base58 random password
   */
  generateRandomPassword(numWords = 5): string {
    const bytes = sjcl.codec.bytes.fromBits(sjcl.random.randomWords(numWords));
    return bs58.encode(bytes);
  }

  /**
   * Logout of BitGo
   */
  async logout(): Promise<any> {
    const result = await this.get(this.url('/user/logout')).result();
    this.clear();
    return result;
  }

  /**
   * Get a user by ID (name/email only)
   * @param id
   *
   * @deprecated
   */
  async getUser({ id }: GetUserOptions): Promise<any> {
    if (!_.isString(id)) {
      throw new Error('expected string id');
    }
    return this.get(this.url(`/user/${id}`)).result('user');
  }
  /**
   * Get the current logged in user
   */
  async me(): Promise<any> {
    return this.getUser({ id: 'me' });
  }

  /**
   * Unlock the session by providing OTP
   * @param {string} otp Required OTP code for the account.
   * @param {number} duration Desired duration of the unlock in seconds (default=600, max=3600).
   */
  async unlock({ otp, duration }: UnlockOptions): Promise<any> {
    if (otp && !_.isString(otp)) {
      throw new Error('expected string or undefined otp');
    }
    return this.post(this.url('/user/unlock')).send({ otp, duration }).result();
  }

  /**
   * Lock the session
   */
  async lock(): Promise<any> {
    return this.post(this.url('/user/lock')).result();
  }

  /**
   * Get the current session
   */
  async session(): Promise<any> {
    return this.get(this.url('/user/session')).result('session');
  }

  /**
   * Trigger a push/sms for the OTP code
   * @param {boolean} params.forceSMS If set to true, will use SMS to send the OTP to the user even if they have other 2FA method set up.
   * @deprecated
   */
  async sendOTP(params: { forceSMS?: boolean } = {}): Promise<any> {
    return this.post(this.url('/user/sendotp')).send(params).result();
  }

  /**
   * Extend token, provided the current token is extendable
   * @param params
   * - duration: duration in seconds by which to extend the token, starting at the current time
   */
  async extendToken(params: ExtendTokenOptions = {}): Promise<any> {
    if (!this._extensionKey) {
      throw new Error('missing required property _extensionKey');
    }

    const timestamp = Date.now();
    const duration = params.duration;
    const message = timestamp + '|' + this._token + '|' + duration;
    const privateKey = this._extensionKey.privateKey;
    if (!privateKey) {
      throw new Error('no privateKey on extensionKey');
    }
    const isCompressed = this._extensionKey.compressed;
    const prefix = utxolib.networks.bitcoin.messagePrefix;
    const signature = bitcoinMessage.sign(message, privateKey, isCompressed, prefix).toString('hex');

    return this.post(this.url('/user/extendtoken'))
      .send(params)
      .set('timestamp', timestamp.toString())
      .set('signature', signature)
      .result();
  }

  /**
   * Get a key for sharing a wallet with a user
   * @param email email of user to share wallet with
   */
  async getSharingKey({ email }: GetSharingKeyOptions): Promise<any> {
    if (!_.isString(email)) {
      throw new Error('required string email');
    }

    return this.post(this.url('/user/sharingkey')).send({ email }).result();
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
   * Register a new coin instance with its builder factory
   * @param {string} name coin name as it was registered in @bitgo/statics
   * @param {CoinConstructor} coin the builder factory class for that coin
   * @returns {void}
   */
  public register(name: string, coin: CoinConstructor): void {
    GlobalCoinFactory.register(name, coin);
  }
}
