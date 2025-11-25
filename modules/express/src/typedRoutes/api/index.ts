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
import { PostGenerateWallet } from './v2/generateWallet';
import { PostCoinSignTx } from './v2/coinSignTx';
import { PostWalletSignTx } from './v2/walletSignTx';
import { PostWalletTxSignTSS } from './v2/walletTxSignTSS';
import { PostShareWallet } from './v2/shareWallet';
import { PutExpressWalletUpdate } from './v2/expressWalletUpdate';
import { PostFanoutUnspents } from './v2/fanoutUnspents';
import { PostSendMany } from './v2/sendmany';
import { PostConsolidateUnspents } from './v2/consolidateunspents';
import { PostPrebuildAndSignTransaction } from './v2/prebuildAndSignTransaction';
import { PostCoinSign } from './v2/coinSign';
import { PostSendCoins } from './v2/sendCoins';
import { PostGenerateShareTSS } from './v2/generateShareTSS';
import { PostOfcExtSignPayload } from './v2/ofcExtSignPayload';
import { PostLightningWalletPayment } from './v2/lightningPayment';
import { PostLightningWalletWithdraw } from './v2/lightningWithdraw';
import { PutV2PendingApproval } from './v2/pendingApproval';
import { PostConsolidateAccount } from './v2/consolidateAccount';
import { PostCanonicalAddress } from './v2/canonicalAddress';
import { PostWalletSweep } from './v2/walletSweep';
import { PostIsWalletAddress } from './v2/isWalletAddress';

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

export const ExpressPendingApprovalsApiSpec = apiSpec({
  'express.v1.pendingapprovals': {
    put: PutPendingApproval,
  },
  'express.v2.pendingapprovals': {
    put: PutV2PendingApproval,
  },
});

export const ExpressWalletSignTransactionApiSpec = apiSpec({
  'express.v1.wallet.signTransaction': {
    post: PostSignTransaction,
  },
  'express.v2.wallet.prebuildandsigntransaction': {
    post: PostPrebuildAndSignTransaction,
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

export const ExpressWalletConsolidateUnspentsApiSpec = apiSpec({
  'express.v1.wallet.consolidateunspents': {
    put: PutConsolidateUnspents,
  },
  'express.v2.wallet.consolidateunspents': {
    post: PostConsolidateUnspents,
  },
});

export const ExpressV2WalletConsolidateAccountApiSpec = apiSpec({
  'express.v2.wallet.consolidateaccount': {
    post: PostConsolidateAccount,
  },
});

export const ExpressWalletFanoutUnspentsApiSpec = apiSpec({
  'express.v1.wallet.fanoutunspents': {
    put: PutFanoutUnspents,
  },
  'express.v2.wallet.fanoutunspents': {
    post: PostFanoutUnspents,
  },
});

export const ExpressV2WalletCreateAddressApiSpec = apiSpec({
  'express.v2.wallet.createAddress': {
    post: PostCreateAddress,
  },
});

export const ExpressV2WalletIsWalletAddressApiSpec = apiSpec({
  'express.v2.wallet.isWalletAddress': {
    post: PostIsWalletAddress,
  },
});

export const ExpressV2WalletSendManyApiSpec = apiSpec({
  'express.v2.wallet.sendmany': {
    post: PostSendMany,
  },
});

export const ExpressV2WalletSendCoinsApiSpec = apiSpec({
  'express.v2.wallet.sendcoins': {
    post: PostSendCoins,
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

export const ExpressLightningWalletPaymentApiSpec = apiSpec({
  'express.v2.wallet.lightningPayment': {
    post: PostLightningWalletPayment,
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

export const ExpressLightningWalletWithdrawApiSpec = apiSpec({
  'express.v2.wallet.lightningWithdraw': {
    post: PostLightningWalletWithdraw,
  },
});

export const ExpressOfcSignPayloadApiSpec = apiSpec({
  'express.ofc.signPayload': {
    post: PostOfcSignPayload,
  },
});

export const ExpressWalletRecoverTokenApiSpec = apiSpec({
  'express.v2.wallet.recovertoken': {
    post: PostWalletRecoverToken,
  },
});

export const ExpressCoinSigningApiSpec = apiSpec({
  'express.v2.coin.signtx': {
    post: PostCoinSignTx,
  },
});

export const ExpressExternalSigningApiSpec = apiSpec({
  'express.v2.coin.sign': {
    post: PostCoinSign,
  },
  'express.v2.tssshare.generate': {
    post: PostGenerateShareTSS,
  },
  'express.v2.ofc.extSignPayload': {
    post: PostOfcExtSignPayload,
  },
});

export const ExpressWalletSigningApiSpec = apiSpec({
  'express.v2.wallet.signtx': {
    post: PostWalletSignTx,
  },
  'express.v2.wallet.signtxtss': {
    post: PostWalletTxSignTSS,
  },
});

export const ExpressWalletManagementApiSpec = apiSpec({
  'express.v2.wallet.share': {
    post: PostShareWallet,
  },
  'express.wallet.update': {
    put: PutExpressWalletUpdate,
  },
  'express.wallet.generate': {
    post: PostGenerateWallet,
  },
});

export const ExpressV2CanonicalAddressApiSpec = apiSpec({
  'express.v2.canonicaladdress': {
    post: PostCanonicalAddress,
  },
});

export const ExpressV2WalletSweepApiSpec = apiSpec({
  'express.v2.wallet.sweep': {
    post: PostWalletSweep,
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
  typeof ExpressPendingApprovalsApiSpec &
  typeof ExpressWalletSignTransactionApiSpec &
  typeof ExpressV1KeychainDeriveApiSpec &
  typeof ExpressV1KeychainLocalApiSpec &
  typeof ExpressV1PendingApprovalConstructTxApiSpec &
  typeof ExpressWalletConsolidateUnspentsApiSpec &
  typeof ExpressV2WalletConsolidateAccountApiSpec &
  typeof ExpressWalletFanoutUnspentsApiSpec &
  typeof ExpressV2WalletCreateAddressApiSpec &
  typeof ExpressV2WalletIsWalletAddressApiSpec &
  typeof ExpressKeychainLocalApiSpec &
  typeof ExpressKeychainChangePasswordApiSpec &
  typeof ExpressLightningWalletPaymentApiSpec &
  typeof ExpressLightningGetStateApiSpec &
  typeof ExpressLightningInitWalletApiSpec &
  typeof ExpressLightningUnlockWalletApiSpec &
  typeof ExpressLightningWalletWithdrawApiSpec &
  typeof ExpressV2WalletSendManyApiSpec &
  typeof ExpressV2WalletSendCoinsApiSpec &
  typeof ExpressOfcSignPayloadApiSpec &
  typeof ExpressWalletRecoverTokenApiSpec &
  typeof ExpressCoinSigningApiSpec &
  typeof ExpressExternalSigningApiSpec &
  typeof ExpressWalletSigningApiSpec &
  typeof ExpressV2CanonicalAddressApiSpec &
  typeof ExpressV2WalletSweepApiSpec &
  typeof ExpressWalletManagementApiSpec;

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
  ...ExpressPendingApprovalsApiSpec,
  ...ExpressWalletSignTransactionApiSpec,
  ...ExpressV1KeychainDeriveApiSpec,
  ...ExpressV1KeychainLocalApiSpec,
  ...ExpressV1PendingApprovalConstructTxApiSpec,
  ...ExpressWalletConsolidateUnspentsApiSpec,
  ...ExpressWalletFanoutUnspentsApiSpec,
  ...ExpressV2WalletCreateAddressApiSpec,
  ...ExpressV2WalletConsolidateAccountApiSpec,
  ...ExpressV2WalletIsWalletAddressApiSpec,
  ...ExpressKeychainLocalApiSpec,
  ...ExpressKeychainChangePasswordApiSpec,
  ...ExpressLightningWalletPaymentApiSpec,
  ...ExpressLightningGetStateApiSpec,
  ...ExpressLightningInitWalletApiSpec,
  ...ExpressLightningUnlockWalletApiSpec,
  ...ExpressLightningWalletWithdrawApiSpec,
  ...ExpressV2WalletSendManyApiSpec,
  ...ExpressV2WalletSendCoinsApiSpec,
  ...ExpressOfcSignPayloadApiSpec,
  ...ExpressWalletRecoverTokenApiSpec,
  ...ExpressCoinSigningApiSpec,
  ...ExpressExternalSigningApiSpec,
  ...ExpressWalletSigningApiSpec,
  ...ExpressV2CanonicalAddressApiSpec,
  ...ExpressV2WalletSweepApiSpec,
  ...ExpressWalletManagementApiSpec,
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
