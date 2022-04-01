import { BitGoJsError, EnvironmentName, V1Network } from '@bitgo/sdk-core';

export interface BitGoAPIOptions {
  accessToken?: string;
  authVersion?: 2 | 3;
  customBitcoinNetwork?: V1Network;
  customRootURI?: string;
  customSigningAddress?: string;
  env?: EnvironmentName;
  etherscanApiToken?: string;
  hmacVerification?: boolean;
  proxy?: string;
  serverXpub?: string;
  stellarFederationServerUrl?: string;
  useProduction?: boolean;
  userAgent?: string;
}

export interface IRequestTracer {
  inc(): void;
  toString(): string;
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

export interface EncryptOptions {
  input: string;
  password?: string;
}

export interface DecryptOptions {
  input: string;
  password?: string;
}
