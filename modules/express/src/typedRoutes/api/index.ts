import * as t from 'io-ts';
import { apiSpec } from '@api-ts/io-ts-http';
import * as express from 'express';

import { GetPing } from './common/ping';
import { GetPingExpress } from './common/pingExpress';
import { PostLogin } from './common/login';
import { PostDecrypt } from './common/decrypt';
import { PostEncrypt } from './common/encrypt';
import { PostVerifyAddress } from './common/verifyAddress';
import { PostCalculateMinerFeeInfo } from './common/calculateMinerFeeInfo';
import { PostAcceptShare } from './v1/acceptShare';
import { PostSimpleCreate } from './v1/simpleCreate';
import { PutPendingApproval } from './v1/pendingApproval';
import { PostSignTransaction } from './v1/signTransaction';
import { PostKeychainLocal } from './v2/keychainLocal';
import { GetLightningState } from './v2/lightningState';
import { PostKeychainChangePassword } from './v2/keychainChangePassword';
import { PostLightningInitWallet } from './v2/lightningInitWallet';
import { PostUnlockLightningWallet } from './v2/unlockWallet';
import { PostVerifyCoinAddress } from './v2/verifyAddress';
import { PostDeriveLocalKeyChain } from './v1/deriveLocalKeyChain';
import { PostCreateLocalKeyChain } from './v1/createLocalKeyChain';
import { PutConstructPendingApprovalTx } from './v1/constructPendingApprovalTx';
import { PutConsolidateUnspents } from './v1/consolidateUnspents';
import { PostCreateAddress } from './v2/createAddress';
import { PutFanoutUnspents } from './v1/fanoutUnspents';
import { PostOfcSignPayload } from './v2/ofcSignPayload';
import { PostWalletRecoverToken } from './v2/walletRecoverToken';
import { PostCoinSignTx } from './v2/coinSignTx';
import { PostWalletSignTx } from './v2/walletSignTx';
import { PostWalletTxSignTSS } from './v2/walletTxSignTSS';
import { PostShareWallet } from './v2/shareWallet';
import { PutExpressWalletUpdate } from './v2/expressWalletUpdate';

// Too large types can cause the following error
//
// > error TS7056: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
//
// As a workaround, only construct expressApi with a single key and add it to the type union at the end

export const ExpressPingApiSpec = apiSpec({
  'express.ping': {
    get: GetPing,
  },
});

export const ExpressPingExpressApiSpec = apiSpec({
  'express.pingExpress': {
    get: GetPingExpress,
  },
});

export const ExpressLoginApiSpec = apiSpec({
  'express.login': {
    post: PostLogin,
  },
});

export const ExpressDecryptApiSpec = apiSpec({
  'express.decrypt': {
    post: PostDecrypt,
  },
});

export const ExpressEncryptApiSpec = apiSpec({
  'express.encrypt': {
    post: PostEncrypt,
  },
});

export const ExpressVerifyAddressApiSpec = apiSpec({
  'express.verifyaddress': {
    post: PostVerifyAddress,
  },
});

export const ExpressVerifyCoinAddressApiSpec = apiSpec({
  'express.verifycoinaddress': {
    post: PostVerifyCoinAddress,
  },
});

export const ExpressCalculateMinerFeeInfoApiSpec = apiSpec({
  'express.calculateminerfeeinfo': {
    post: PostCalculateMinerFeeInfo,
  },
});

export const ExpressV1WalletAcceptShareApiSpec = apiSpec({
  'express.v1.wallet.acceptShare': {
    post: PostAcceptShare,
  },
});

export const ExpressV1WalletSimpleCreateApiSpec = apiSpec({
  'express.v1.wallet.simplecreate': {
    post: PostSimpleCreate,
  },
});

export const ExpressV1PendingApprovalsApiSpec = apiSpec({
  'express.v1.pendingapprovals': {
    put: PutPendingApproval,
  },
});

export const ExpressV1WalletSignTransactionApiSpec = apiSpec({
  'express.v1.wallet.signTransaction': {
    post: PostSignTransaction,
  },
});

export const ExpressV1KeychainDeriveApiSpec = apiSpec({
  'express.v1.keychain.derive': {
    post: PostDeriveLocalKeyChain,
  },
});

export const ExpressV1KeychainLocalApiSpec = apiSpec({
  'express.v1.keychain.local': {
    post: PostCreateLocalKeyChain,
  },
});

export const ExpressV1PendingApprovalConstructTxApiSpec = apiSpec({
  'express.v1.pendingapproval.constructTx': {
    put: PutConstructPendingApprovalTx,
  },
});

export const ExpressV1WalletConsolidateUnspentsApiSpec = apiSpec({
  'express.v1.wallet.consolidateunspents': {
    put: PutConsolidateUnspents,
  },
});

export const ExpressV1WalletFanoutUnspentsApiSpec = apiSpec({
  'express.v1.wallet.fanoutunspents': {
    put: PutFanoutUnspents,
  },
});

export const ExpressV2WalletCreateAddressApiSpec = apiSpec({
  'express.v2.wallet.createAddress': {
    post: PostCreateAddress,
  },
});

export const ExpressKeychainLocalApiSpec = apiSpec({
  'express.keychain.local': {
    post: PostKeychainLocal,
  },
});

export const ExpressKeychainChangePasswordApiSpec = apiSpec({
  'express.keychain.changePassword': {
    post: PostKeychainChangePassword,
  },
});

export const ExpressLightningGetStateApiSpec = apiSpec({
  'express.lightning.getState': {
    get: GetLightningState,
  },
});

export const ExpressLightningInitWalletApiSpec = apiSpec({
  'express.lightning.initWallet': {
    post: PostLightningInitWallet,
  },
});

export const ExpressLightningUnlockWalletApiSpec = apiSpec({
  'express.lightning.unlockWallet': {
    post: PostUnlockLightningWallet,
  },
});

export const ExpressOfcSignPayloadApiSpec = apiSpec({
  'express.ofc.signPayload': {
    post: PostOfcSignPayload,
  },
  'express.v2.wallet.recovertoken': {
    post: PostWalletRecoverToken,
  },
  'express.v2.coin.signtx': {
    post: PostCoinSignTx,
  },
  'express.v2.wallet.signtx': {
    post: PostWalletSignTx,
  },
  'express.v2.wallet.signtxtss': {
    post: PostWalletTxSignTSS,
  },
  'express.v2.wallet.share': {
    post: PostShareWallet,
  },
  'express.wallet.update': {
    put: PutExpressWalletUpdate,
  },
});

export type ExpressApi = typeof ExpressPingApiSpec &
  typeof ExpressPingExpressApiSpec &
  typeof ExpressLoginApiSpec &
  typeof ExpressDecryptApiSpec &
  typeof ExpressEncryptApiSpec &
  typeof ExpressVerifyAddressApiSpec &
  typeof ExpressVerifyCoinAddressApiSpec &
  typeof ExpressCalculateMinerFeeInfoApiSpec &
  typeof ExpressV1WalletAcceptShareApiSpec &
  typeof ExpressV1WalletSimpleCreateApiSpec &
  typeof ExpressV1PendingApprovalsApiSpec &
  typeof ExpressV1WalletSignTransactionApiSpec &
  typeof ExpressV1KeychainDeriveApiSpec &
  typeof ExpressV1KeychainLocalApiSpec &
  typeof ExpressV1PendingApprovalConstructTxApiSpec &
  typeof ExpressV1WalletConsolidateUnspentsApiSpec &
  typeof ExpressV1WalletFanoutUnspentsApiSpec &
  typeof ExpressV2WalletCreateAddressApiSpec &
  typeof ExpressKeychainLocalApiSpec &
  typeof ExpressKeychainChangePasswordApiSpec &
  typeof ExpressLightningGetStateApiSpec &
  typeof ExpressLightningInitWalletApiSpec &
  typeof ExpressLightningUnlockWalletApiSpec &
  typeof ExpressOfcSignPayloadApiSpec;

export const ExpressApi: ExpressApi = {
  ...ExpressPingApiSpec,
  ...ExpressPingExpressApiSpec,
  ...ExpressLoginApiSpec,
  ...ExpressDecryptApiSpec,
  ...ExpressEncryptApiSpec,
  ...ExpressVerifyAddressApiSpec,
  ...ExpressVerifyCoinAddressApiSpec,
  ...ExpressCalculateMinerFeeInfoApiSpec,
  ...ExpressV1WalletAcceptShareApiSpec,
  ...ExpressV1WalletSimpleCreateApiSpec,
  ...ExpressV1PendingApprovalsApiSpec,
  ...ExpressV1WalletSignTransactionApiSpec,
  ...ExpressV1KeychainDeriveApiSpec,
  ...ExpressV1KeychainLocalApiSpec,
  ...ExpressV1PendingApprovalConstructTxApiSpec,
  ...ExpressV1WalletConsolidateUnspentsApiSpec,
  ...ExpressV1WalletFanoutUnspentsApiSpec,
  ...ExpressV2WalletCreateAddressApiSpec,
  ...ExpressKeychainLocalApiSpec,
  ...ExpressKeychainChangePasswordApiSpec,
  ...ExpressLightningGetStateApiSpec,
  ...ExpressLightningInitWalletApiSpec,
  ...ExpressLightningUnlockWalletApiSpec,
  ...ExpressOfcSignPayloadApiSpec,
};

type ExtractDecoded<T> = T extends t.Type<any, infer O, any> ? O : never;
type FlattenDecoded<T> = T extends Record<string, unknown>
  ? (T extends { body: infer B } ? B : any) &
      (T extends { query: infer Q } ? Q : any) &
      (T extends { params: infer P } ? P : any)
  : T;
export type ExpressApiRouteRequest<
  ApiName extends keyof ExpressApi,
  Method extends keyof ExpressApi[ApiName]
> = ExpressApi[ApiName][Method] extends { request: infer R }
  ? express.Request & { decoded: FlattenDecoded<ExtractDecoded<R>> }
  : never;
