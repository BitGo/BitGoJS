// import {
//   AuthenticateWithAuthCodeOptions,
//   BaseCoin,
//   BitGoSimulateWebhookOptions,
//   ChangePasswordOptions,
//   DeprecatedVerifyAddressOptions,
//   EstimateFeeOptions,
//   GetEcdhSecretOptions,
//   ListWebhookNotificationsOptions,
//   ReconstitutedSecret,
//   ReconstituteSecretOptions,
//   RegisterPushTokenOptions,
//   SplitSecret,
//   SplitSecretOptions,
//   VerifyPushTokenOptions,
//   VerifyShardsOptions,
//   WebhookOptions
// } from 'bitgo';

import { BaseCoin, Keychains, Markets, PendingApprovals, Wallets } from 'bitgo';
import * as utxolib from '@bitgo/utxo-lib';
import { BitGoAPI } from '@bitgo/sdk-api';

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
  eckey: utxolib.ECPair.ECPairInterface;
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

export interface IBitGo extends BitGoAPI {
  coin(coinName: string): BaseCoin;
  token(tokenName: string): Promise<BaseCoin>;
  verifyAddress(params: DeprecatedVerifyAddressOptions): boolean;
  splitSecret({ seed, passwords, m }: SplitSecretOptions): SplitSecret;
  reconstituteSecret({ shards, passwords }: ReconstituteSecretOptions): ReconstitutedSecret;
  verifyShards({ shards, passwords, m, xpub }: VerifyShardsOptions): boolean;
  getECDHSecret({ otherPubKeyHex, eckey }: GetEcdhSecretOptions): string;
  getECDHSharingKeychain(): Promise<any>;
  markets(): Markets;
  market(): Promise<any>;
  yesterday(): Promise<any>;
  registerPushToken(params: RegisterPushTokenOptions): Promise<any>;
  verifyPushToken(params: VerifyPushTokenOptions): Promise<any>;
  authenticateWithAuthCode(params: AuthenticateWithAuthCodeOptions): Promise<any>;
  changePassword({ oldPassword, newPassword }: ChangePasswordOptions): Promise<any>;
  blockchain(): any;
  keychains(): Keychains;
  wallets(): Wallets;
  travelRule(): any;
  pendingApprovals(): PendingApprovals;
  newWalletObject(walletParams): any;
  labels(): Promise<any>;
  estimateFee(params: EstimateFeeOptions): Promise<any>;
  instantGuarantee(params: { id: string }): Promise<any>;
  getBitGoFeeAddress(): Promise<any>;
  getWalletAddress({ address }: { address: string }): Promise<any>;
  listWebhooks(): Promise<any>;
  addWebhook(params: WebhookOptions): Promise<any>;
  removeWebhook(params: WebhookOptions): Promise<any>;
  listWebhookNotifications(params: ListWebhookNotificationsOptions): Promise<any>;
  simulateWebhook(params: BitGoSimulateWebhookOptions): Promise<any>;
  getConstants(): any;
  calculateMinerFeeInfo(params: any): Promise<any>;
}
