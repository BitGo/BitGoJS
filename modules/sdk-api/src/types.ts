import { BitGoJsError, EnvironmentName, IRequestTracer, V1Network } from '@bitgo/sdk-core';

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
  hmacVerification?: boolean;
  proxy?: string;
  refreshToken?: string;
  serverXpub?: string;
  stellarFederationServerUrl?: string;
  useProduction?: boolean;
  userAgent?: string;
  validate?: boolean;
}

export interface AccessTokenOptions {
  accessToken: string;
}

export interface PingOptions {
  reqId?: IRequestTracer;
}

export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch'] as const;

export interface CalculateHmacSubjectOptions {
  urlPath: string;
  text: string;
  timestamp: number;
  method: typeof supportedRequestMethods[number];
  statusCode?: number;
}

export interface CalculateRequestHmacOptions {
  url: string;
  text: string;
  timestamp: number;
  token: string;
  method: typeof supportedRequestMethods[number];
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
  method: typeof supportedRequestMethods[number];
}

export interface VerifyResponseOptions extends CalculateRequestHeadersOptions {
  hmac: string;
  url: string;
  text: string;
  timestamp: number;
  method: typeof supportedRequestMethods[number];
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

export class ApiResponseError<ResponseBodyType = any> extends BitGoJsError {
  message: string;
  status: number;
  result?: ResponseBodyType;
  invalidToken?: boolean;
  needsOTP?: boolean;

  public constructor(
    message: string,
    status: number,
    result?: ResponseBodyType,
    invalidToken?: boolean,
    needsOTP?: boolean
  ) {
    super(message);
    this.message = message;
    this.status = status;
    this.result = result;
    this.invalidToken = invalidToken;
    this.needsOTP = needsOTP;
  }
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

export interface UnlockOptions {
  otp?: string;
  duration?: number;
}
export interface ExtendTokenOptions {
  duration?: string;
}
