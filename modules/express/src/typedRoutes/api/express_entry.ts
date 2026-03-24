import * as t from 'io-ts';
import { apiSpec } from '@api-ts/io-ts-http';
import * as express from 'express';

import { GetPingV2 } from './v2/ping';
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
import { PostSignerMacaroon } from './v2/signerMacaroon';
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
import { PostWalletEnableTokens } from './v2/walletEnableTokens';
import { PostWalletSweep } from './v2/walletSweep';
import { PostWalletAccelerateTx } from './v2/walletAccelerateTx';
import { PostIsWalletAddress } from './v2/isWalletAddress';

// Too large types can cause the following error
//
// > error TS7056: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
//
// As a workaround, only construct expressApi with a single key and add it to the type union at the end

// BATCH 1: Uncommented
export const ExpressPingApiSpec = apiSpec({
  'express.v2.ping': {
    get: GetPingV2,
  },
});

/* BATCH 1: Commented out
export const ExpressPingExpressApiSpec = apiSpec({
  'express.pingExpress': {
    get: GetPingExpress,
  },
});
*/

/* Commented out
export const ExpressLoginApiSpec = apiSpec({
  'express.login': {
    post: PostLogin,
  },
});
*/

/* Commented out
export const ExpressDecryptApiSpec = apiSpec({
  'express.decrypt': {
    post: PostDecrypt,
  },
});
*/

/* Commented out
export const ExpressEncryptApiSpec = apiSpec({
  'express.encrypt': {
    post: PostEncrypt,
  },
});
*/

/* Commented out
export const ExpressVerifyAddressApiSpec = apiSpec({
  'express.verifyaddress': {
    post: PostVerifyAddress,
  },
});
*/

// BATCH 1: Uncommented (v2)
export const ExpressVerifyCoinAddressApiSpec = apiSpec({
  'express.verifycoinaddress': {
    post: PostVerifyCoinAddress,
  },
});

/* Commented out
export const ExpressCalculateMinerFeeInfoApiSpec = apiSpec({
  'express.calculateminerfeeinfo': {
    post: PostCalculateMinerFeeInfo,
  },
});
*/

// BATCH 1: Uncommented
export const ExpressV1WalletAcceptShareApiSpec = apiSpec({
  'express.v1.wallet.acceptShare': {
    post: PostAcceptShare,
  },
});

// BATCH 1: Uncommented
export const ExpressV1WalletSimpleCreateApiSpec = apiSpec({
  'express.v1.wallet.simplecreate': {
    post: PostSimpleCreate,
  },
});

/* Commented out
export const ExpressPendingApprovalsApiSpec = apiSpec({
  'express.v1.pendingapprovals': {
    put: PutPendingApproval,
  },
  'express.v2.pendingapprovals': {
    put: PutV2PendingApproval,
  },
});
*/

// BATCH 2: Uncommented (v2 only, commented out v1)
export const ExpressWalletSignTransactionApiSpec = apiSpec({
  /* 'express.v1.wallet.signTransaction': {
    post: PostSignTransaction,
  }, */
  'express.v2.wallet.prebuildandsigntransaction': {
    post: PostPrebuildAndSignTransaction,
  },
});

/* Commented out
export const ExpressV1KeychainDeriveApiSpec = apiSpec({
  'express.v1.keychain.derive': {
    post: PostDeriveLocalKeyChain,
  },
});
*/

/* Commented out
export const ExpressV1KeychainLocalApiSpec = apiSpec({
  'express.v1.keychain.local': {
    post: PostCreateLocalKeyChain,
  },
});
*/

/* Commented out
export const ExpressV1PendingApprovalConstructTxApiSpec = apiSpec({
  'express.v1.pendingapproval.constructTx': {
    put: PutConstructPendingApprovalTx,
  },
});
*/

/* Commented out
export const ExpressWalletConsolidateUnspentsApiSpec = apiSpec({
  'express.v1.wallet.consolidateunspents': {
    put: PutConsolidateUnspents,
  },
  'express.v2.wallet.consolidateunspents': {
    post: PostConsolidateUnspents,
  },
});
*/

/* Commented out
export const ExpressV2WalletConsolidateAccountApiSpec = apiSpec({
  'express.v2.wallet.consolidateaccount': {
    post: PostConsolidateAccount,
  },
});
*/

/* Commented out
export const ExpressWalletFanoutUnspentsApiSpec = apiSpec({
  'express.v1.wallet.fanoutunspents': {
    put: PutFanoutUnspents,
  },
  'express.wallet.fanoutunspents': {
    post: PostFanoutUnspents,
  },
});
*/

// BATCH 2: Uncommented
export const ExpressV2WalletCreateAddressApiSpec = apiSpec({
  'express.v2.wallet.createAddress': {
    post: PostCreateAddress,
  },
});

/* Commented out
export const ExpressV2WalletIsWalletAddressApiSpec = apiSpec({
  'express.v2.wallet.isWalletAddress': {
    post: PostIsWalletAddress,
  },
});
*/

/* Commented out
export const ExpressV2WalletSendManyApiSpec = apiSpec({
  'express.v2.wallet.sendmany': {
    post: PostSendMany,
  },
});
*/

// BATCH 2: Uncommented
export const ExpressV2WalletSendCoinsApiSpec = apiSpec({
  'express.v2.wallet.sendcoins': {
    post: PostSendCoins,
  },
});

/* Commented out
export const ExpressKeychainLocalApiSpec = apiSpec({
  'express.keychain.local': {
    post: PostKeychainLocal,
  },
});
*/

/* Commented out
export const ExpressKeychainChangePasswordApiSpec = apiSpec({
  'express.keychain.changePassword': {
    post: PostKeychainChangePassword,
  },
});
*/

/* Commented out
export const ExpressLightningWalletPaymentApiSpec = apiSpec({
  'express.v2.wallet.lightningPayment': {
    post: PostLightningWalletPayment,
  },
});
*/

/* Commented out
export const ExpressLightningGetStateApiSpec = apiSpec({
  'express.lightning.getState': {
    get: GetLightningState,
  },
});
*/

/* Commented out
export const ExpressLightningInitWalletApiSpec = apiSpec({
  'express.lightning.initWallet': {
    post: PostLightningInitWallet,
  },
});
*/

/* Commented out
export const ExpressLightningUnlockWalletApiSpec = apiSpec({
  'express.lightning.unlockWallet': {
    post: PostUnlockLightningWallet,
  },
});
*/

/* Commented out
export const ExpressLightningWalletWithdrawApiSpec = apiSpec({
  'express.v2.wallet.lightningWithdraw': {
    post: PostLightningWalletWithdraw,
  },
});
*/

/* Commented out
export const ExpressOfcSignPayloadApiSpec = apiSpec({
  'express.ofc.signPayload': {
    post: PostOfcSignPayload,
  },
});
*/

/* Commented out
export const ExpressWalletRecoverTokenApiSpec = apiSpec({
  'express.v2.wallet.recovertoken': {
    post: PostWalletRecoverToken,
  },
});
*/

/* Commented out
export const ExpressWalletEnableTokensApiSpec = apiSpec({
  'express.v2.wallet.enableTokens': {
    post: PostWalletEnableTokens,
  },
});
*/

/* Commented out
export const ExpressCoinSigningApiSpec = apiSpec({
  'express.v2.coin.signtx': {
    post: PostCoinSignTx,
  },
});
*/

/* Commented out
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
*/

/* Commented out
export const ExpressWalletSigningApiSpec = apiSpec({
  'express.v2.wallet.signtx': {
    post: PostWalletSignTx,
  },
  'express.v2.wallet.signtxtss': {
    post: PostWalletTxSignTSS,
  },
});
*/

/* Commented out
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
  'express.lightning.signerMacaroon': {
    post: PostSignerMacaroon,
  },
});
*/

/* Commented out
export const ExpressV2CanonicalAddressApiSpec = apiSpec({
  'express.canonicaladdress': {
    post: PostCanonicalAddress,
  },
});
*/

/* Commented out
export const ExpressV2WalletSweepApiSpec = apiSpec({
  'express.v2.wallet.sweep': {
    post: PostWalletSweep,
  },
});
*/

/* Commented out
export const ExpressV2WalletAccelerateTxApiSpec = apiSpec({
  'express.wallet.acceleratetx': {
    post: PostWalletAccelerateTx,
  },
});
*/

export type ExpressApi = typeof ExpressPingApiSpec &
  /* typeof ExpressPingExpressApiSpec & */
  /* typeof ExpressLoginApiSpec & */
  /* typeof ExpressDecryptApiSpec & */
  /* typeof ExpressEncryptApiSpec & */
  /* typeof ExpressVerifyAddressApiSpec & */
  typeof ExpressVerifyCoinAddressApiSpec &
  /* typeof ExpressCalculateMinerFeeInfoApiSpec & */
  typeof ExpressV1WalletAcceptShareApiSpec &
  typeof ExpressV1WalletSimpleCreateApiSpec &
  /* typeof ExpressPendingApprovalsApiSpec & */
  typeof ExpressWalletSignTransactionApiSpec &
  /* typeof ExpressV1KeychainDeriveApiSpec & */
  /* typeof ExpressV1KeychainLocalApiSpec & */
  /* typeof ExpressV1PendingApprovalConstructTxApiSpec & */
  /* typeof ExpressWalletConsolidateUnspentsApiSpec & */
  /* typeof ExpressV2WalletConsolidateAccountApiSpec & */
  /* typeof ExpressWalletFanoutUnspentsApiSpec & */
  typeof ExpressV2WalletCreateAddressApiSpec &
  /* typeof ExpressV2WalletIsWalletAddressApiSpec & */
  /* typeof ExpressKeychainLocalApiSpec & */
  /* typeof ExpressKeychainChangePasswordApiSpec & */
  /* typeof ExpressLightningWalletPaymentApiSpec & */
  /* typeof ExpressLightningGetStateApiSpec & */
  /* typeof ExpressLightningInitWalletApiSpec & */
  /* typeof ExpressLightningUnlockWalletApiSpec & */
  /* typeof ExpressLightningWalletWithdrawApiSpec & */
  /* typeof ExpressV2WalletSendManyApiSpec & */
  typeof ExpressV2WalletSendCoinsApiSpec
  /* & typeof ExpressOfcSignPayloadApiSpec & */
  /* typeof ExpressWalletRecoverTokenApiSpec & */
  /* typeof ExpressWalletEnableTokensApiSpec & */
  /* typeof ExpressCoinSigningApiSpec & */
  /* typeof ExpressExternalSigningApiSpec & */
  /* typeof ExpressWalletSigningApiSpec & */
  /* typeof ExpressV2CanonicalAddressApiSpec & */
  /* typeof ExpressV2WalletSweepApiSpec & */
  /* typeof ExpressV2WalletAccelerateTxApiSpec & */
  /* typeof ExpressWalletManagementApiSpec */;

export const ExpressApi: ExpressApi = {
  ...ExpressPingApiSpec,
  /* ...ExpressPingExpressApiSpec, */
  /* ...ExpressLoginApiSpec, */
  /* ...ExpressDecryptApiSpec, */
  /* ...ExpressEncryptApiSpec, */
  /* ...ExpressVerifyAddressApiSpec, */
  ...ExpressVerifyCoinAddressApiSpec,
  /* ...ExpressCalculateMinerFeeInfoApiSpec, */
  ...ExpressV1WalletAcceptShareApiSpec,
  ...ExpressV1WalletSimpleCreateApiSpec,
  /* ...ExpressPendingApprovalsApiSpec, */
  ...ExpressWalletSignTransactionApiSpec,
  /* ...ExpressV1KeychainDeriveApiSpec, */
  /* ...ExpressV1KeychainLocalApiSpec, */
  /* ...ExpressV1PendingApprovalConstructTxApiSpec, */
  /* ...ExpressWalletConsolidateUnspentsApiSpec, */
  /* ...ExpressWalletFanoutUnspentsApiSpec, */
  ...ExpressV2WalletCreateAddressApiSpec,
  /* ...ExpressV2WalletConsolidateAccountApiSpec, */
  /* ...ExpressV2WalletIsWalletAddressApiSpec, */
  /* ...ExpressKeychainLocalApiSpec, */
  /* ...ExpressKeychainChangePasswordApiSpec, */
  /* ...ExpressLightningWalletPaymentApiSpec, */
  /* ...ExpressLightningGetStateApiSpec, */
  /* ...ExpressLightningInitWalletApiSpec, */
  /* ...ExpressLightningUnlockWalletApiSpec, */
  /* ...ExpressLightningWalletWithdrawApiSpec, */
  /* ...ExpressV2WalletSendManyApiSpec, */
  ...ExpressV2WalletSendCoinsApiSpec,
  /* ...ExpressOfcSignPayloadApiSpec, */
  /* ...ExpressWalletRecoverTokenApiSpec, */
  /* ...ExpressWalletEnableTokensApiSpec, */
  /* ...ExpressCoinSigningApiSpec, */
  /* ...ExpressExternalSigningApiSpec, */
  /* ...ExpressWalletSigningApiSpec, */
  /* ...ExpressV2CanonicalAddressApiSpec, */
  /* ...ExpressV2WalletSweepApiSpec, */
  /* ...ExpressV2WalletAccelerateTxApiSpec, */
  /* ...ExpressWalletManagementApiSpec, */
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
