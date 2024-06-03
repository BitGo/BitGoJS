import { EnvironmentName, IRequestTracer, V1Network } from '@bitgo/sdk-core';
import { ECPairInterface } from '@bitgo/utxo-lib';

export interface BitGoAPIOptions {
  accessToken?: string;
  authVersion?: 2 | 3;
  customBitcoinNetwork?: V1Network;
  customRootURI?: string;
  customSigningAddress?: string;
  clientId?: string;
  clientSecret?: string;
  env?: EnvironmentName;
  etherscanApiToken?: string;
  polygonscanApiToken?: string;
  arbiscanApiToken?: string;
  optimisticEtherscanApiToken?: string;
  zksyncExplorerApiToken?: string;
  hmacVerification?: boolean;
  proxy?: string;
  refreshToken?: string;
  serverXpub?: string;
  stellarFederationServerUrl?: string;
  useProduction?: boolean;
  userAgent?: string;
  validate?: boolean;
  cookiesPropagationEnabled?: boolean;
}

export interface AccessTokenOptions {
  accessToken: string;
}

export interface PingOptions {
  reqId?: IRequestTracer;
}

export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch', 'options'] as const;

export interface CalculateHmacSubjectOptions {
  urlPath: string;
  text: string;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
}

export interface CalculateRequestHmacOptions {
  url: string;
  text: string;
  timestamp: number;
  token: string;
  method: (typeof supportedRequestMethods)[number];
}

export interface RequestHeaders {
  hmac: string;
  timestamp: number;
  tokenHash: string;
}

export interface CalculateRequestHeadersOptions {
  url: string;
  text: string;
  token: string;
  method: (typeof supportedRequestMethods)[number];
}

export interface VerifyResponseOptions extends CalculateRequestHeadersOptions {
  hmac: string;
  url: string;
  text: string;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
}

export interface VerifyResponseInfo {
  isValid: boolean;
  expectedHmac: string;
  signatureSubject: string;
  isInResponseValidityWindow: boolean;
  verificationTime: number;
}

export interface AuthenticateOptions {
  username: string;
  password: string;
  otp?: string;
  trust?: number;
  forceSMS?: boolean;
  extensible?: boolean;
  forceV1Auth?: boolean;
  /**
   * Whether or not to ensure that the user's ECDH keychain is created.
   * @type {boolean}
   * @default false
   * @description If set to true, the user's ECDH keychain will be created if it does not already exist.
   * The ecdh keychain is a user level keychain that enables the sharing of secret material,
   * primarily for wallet sharing, as well as the signing of less private material such as various cryptographic challenges.
   * It is highly recommended that this is always set to avoid any issues when using a BitGo wallet
   */
  ensureEcdhKeychain?: boolean;
  forReset2FA?: boolean;
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
  forReset2FA?: boolean;
}

export interface User {
  username: string;
}

export interface BitGoJson {
  user?: User;
  token?: string;
  extensionKey?: string;
  ecdhXprv?: string;
}

export interface VerifyPasswordOptions {
  password?: string;
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

export interface AccessTokenSpendingLimit {
  coin: string;
  txCount?: number;
  txValue?: string;
  txValueLimit?: string;
}

export interface AddAccessTokenOptions {
  label: string;
  otp?: string;
  duration?: number;
  ipRestrict?: string[];
  txValueLimit?: number;
  scope: string[];
  spendingLimits?: AccessTokenSpendingLimit[];
}

export interface AddAccessTokenResponse {
  id: string;
  client: string;
  user: string;
  scope: string[];
  created: string;
  expires: string;
  ip: string;
  ipRestrict: string[];
  origin: string;
  label: string;
  isExtensible: boolean;
  encryptedToken: string;
  derivationPath: string;
  token: string;
  enterprise?: string;
  extensionAddress?: string;
}

export interface RemoveAccessTokenOptions {
  id?: string;
  label?: string;
}

export interface GetUserOptions {
  id: string;
}

export interface UnlockOptions {
  otp?: string;
  duration?: number;
}
export interface ExtendTokenOptions {
  duration?: string;
}

/**
 * @deprecated
 */
export interface DeprecatedVerifyAddressOptions {
  address?: string;
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
  eckey: ECPairInterface;
}

export interface ChangePasswordOptions {
  oldPassword: string;
  newPassword: string;
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

/**
 * @deprecated
 */
export interface RegisterPushTokenOptions {
  pushToken: unknown;
  operatingSystem: unknown;
}

export interface LoginResponse {
  // The API session route does not return this. It's annotated by the SDK
  access_token?: string;
  derivationPath: string;
  encryptedECDHXprv?: string;
  encryptedToken?: string;
  // Unit timestamp of expiration
  expires_at: number;
  // seconds in which the token will expire from issuance
  expires_in: number;
  scope: string[];
  token_type: string;
  user: unknown;
}
