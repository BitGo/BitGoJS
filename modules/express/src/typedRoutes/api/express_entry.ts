import * as t from 'io-ts';
import { apiSpec } from '@api-ts/io-ts-http';
import * as express from 'express';

import { GetPing } from './common/ping';
// Batch 2+
// import { GetPingExpress } from './common/pingExpress';
// import { PostLogin } from './common/login';
// import { PostDecrypt } from './common/decrypt';
// import { PostEncrypt } from './common/encrypt';
// import { PostVerifyAddress } from './common/verifyAddress';
// import { PostCalculateMinerFeeInfo } from './common/calculateMinerFeeInfo';
import { PostAcceptShare } from './v1/acceptShare';
import { PostSimpleCreate } from './v1/simpleCreate';
// import { PutPendingApproval } from './v1/pendingApproval';
// import { PostSignTransaction } from './v1/signTransaction';
// import { PostKeychainLocal } from './v2/keychainLocal';
// import { GetLightningState } from './v2/lightningState';
// import { PostKeychainChangePassword } from './v2/keychainChangePassword';
// import { PostLightningInitWallet } from './v2/lightningInitWallet';
// import { PostUnlockLightningWallet } from './v2/unlockWallet';
// import { PostVerifyCoinAddress } from './v2/verifyAddress';
// import { PostDeriveLocalKeyChain } from './v1/deriveLocalKeyChain';
// import { PostCreateLocalKeyChain } from './v1/createLocalKeyChain';
// import { PutConstructPendingApprovalTx } from './v1/constructPendingApprovalTx';
// import { PutConsolidateUnspents } from './v1/consolidateUnspents';
// import { PostCreateAddress } from './v2/createAddress';
// import { PutFanoutUnspents } from './v1/fanoutUnspents';
// import { PostOfcSignPayload } from './v2/ofcSignPayload';
// import { PostWalletRecoverToken } from './v2/walletRecoverToken';
// import { PostGenerateWallet } from './v2/generateWallet';
// import { PostSignerMacaroon } from './v2/signerMacaroon';
// import { PostCoinSignTx } from './v2/coinSignTx';
// import { PostWalletSignTx } from './v2/walletSignTx';
// import { PostWalletTxSignTSS } from './v2/walletTxSignTSS';
// import { PostShareWallet } from './v2/shareWallet';
// import { PutExpressWalletUpdate } from './v2/expressWalletUpdate';
// import { PostFanoutUnspents } from './v2/fanoutUnspents';
// import { PostSendMany } from './v2/sendmany';
// import { PostConsolidateUnspents } from './v2/consolidateunspents';
// import { PostPrebuildAndSignTransaction } from './v2/prebuildAndSignTransaction';
// import { PostCoinSign } from './v2/coinSign';
// import { PostSendCoins } from './v2/sendCoins';
// import { PostGenerateShareTSS } from './v2/generateShareTSS';
// import { PostOfcExtSignPayload } from './v2/ofcExtSignPayload';
// import { PostLightningWalletPayment } from './v2/lightningPayment';
// import { PostLightningWalletWithdraw } from './v2/lightningWithdraw';
// import { PutV2PendingApproval } from './v2/pendingApproval';
// import { PostConsolidateAccount } from './v2/consolidateAccount';
// import { PostCanonicalAddress } from './v2/canonicalAddress';
// import { PostWalletEnableTokens } from './v2/walletEnableTokens';
// import { PostWalletSweep } from './v2/walletSweep';
// import { PostWalletAccelerateTx } from './v2/walletAccelerateTx';
// import { PostIsWalletAddress } from './v2/isWalletAddress';

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

// Batch 2+
// export const ExpressPingExpressApiSpec = apiSpec({
//   'express.pingExpress': { get: GetPingExpress },
// });
// export const ExpressLoginApiSpec = apiSpec({
//   'express.login': { post: PostLogin },
// });
// export const ExpressDecryptApiSpec = apiSpec({
//   'express.decrypt': { post: PostDecrypt },
// });
// export const ExpressEncryptApiSpec = apiSpec({
//   'express.encrypt': { post: PostEncrypt },
// });
// export const ExpressVerifyAddressApiSpec = apiSpec({
//   'express.verifyaddress': { post: PostVerifyAddress },
// });
// export const ExpressVerifyCoinAddressApiSpec = apiSpec({
//   'express.verifycoinaddress': { post: PostVerifyCoinAddress },
// });
// export const ExpressCalculateMinerFeeInfoApiSpec = apiSpec({
//   'express.calculateminerfeeinfo': { post: PostCalculateMinerFeeInfo },
// });

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

// Batch 2+
// export const ExpressPendingApprovalsApiSpec = apiSpec({
//   'express.v1.pendingapprovals': { put: PutPendingApproval },
//   'express.v2.pendingapprovals': { put: PutV2PendingApproval },
// });

// export const ExpressWalletSignTransactionApiSpec = ...
// export const ExpressV1KeychainDeriveApiSpec = ...
// export const ExpressV1KeychainLocalApiSpec = ...
// export const ExpressV1PendingApprovalConstructTxApiSpec = ...
// export const ExpressWalletConsolidateUnspentsApiSpec = ...
// export const ExpressV2WalletConsolidateAccountApiSpec = ...
// export const ExpressWalletFanoutUnspentsApiSpec = ...
// export const ExpressV2WalletCreateAddressApiSpec = ...
// export const ExpressV2WalletIsWalletAddressApiSpec = ...
// export const ExpressV2WalletSendManyApiSpec = ...
// export const ExpressV2WalletSendCoinsApiSpec = ...
// export const ExpressKeychainLocalApiSpec = ...
// export const ExpressKeychainChangePasswordApiSpec = ...
// export const ExpressLightningWalletPaymentApiSpec = ...
// export const ExpressLightningGetStateApiSpec = ...
// export const ExpressLightningInitWalletApiSpec = ...
// export const ExpressLightningUnlockWalletApiSpec = ...
// export const ExpressLightningWalletWithdrawApiSpec = ...
// export const ExpressOfcSignPayloadApiSpec = ...
// export const ExpressWalletRecoverTokenApiSpec = ...
// export const ExpressWalletEnableTokensApiSpec = ...
// export const ExpressCoinSigningApiSpec = ...
// export const ExpressExternalSigningApiSpec = ...
// export const ExpressWalletSigningApiSpec = ...
// export const ExpressWalletManagementApiSpec = ...
// export const ExpressV2CanonicalAddressApiSpec = ...
// export const ExpressV2WalletSweepApiSpec = ...
// export const ExpressV2WalletAccelerateTxApiSpec = ...

export type ExpressApi = typeof ExpressPingApiSpec &
  // Batch 2+ (see index.ts for full list)
  typeof ExpressV1WalletAcceptShareApiSpec &
  typeof ExpressV1WalletSimpleCreateApiSpec;

export const ExpressApi: ExpressApi = {
  ...ExpressPingApiSpec,
  ...ExpressV1WalletAcceptShareApiSpec,
  ...ExpressV1WalletSimpleCreateApiSpec,
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
