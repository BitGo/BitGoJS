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
import { PostLightningInitWallet } from './v2/lightningInitWallet';
import { PostUnlockLightningWallet } from './v2/unlockWallet';
import { PostVerifyCoinAddress } from './v2/verifyAddress';
import { PostDeriveLocalKeyChain } from './v1/deriveLocalKeyChain';
import { PostCreateLocalKeyChain } from './v1/createLocalKeyChain';
import { PutConstructPendingApprovalTx } from './v1/constructPendingApprovalTx';
import { PutConsolidateUnspents } from './v1/consolidateUnspents';
import { PutFanoutUnspents } from './v1/fanoutUnspents';

export const ExpressApi = apiSpec({
  'express.ping': {
    get: GetPing,
  },
  'express.pingExpress': {
    get: GetPingExpress,
  },
  'express.login': {
    post: PostLogin,
  },
  'express.decrypt': {
    post: PostDecrypt,
  },
  'express.encrypt': {
    post: PostEncrypt,
  },
  'express.verifyaddress': {
    post: PostVerifyAddress,
  },
  'express.v1.wallet.acceptShare': {
    post: PostAcceptShare,
  },
  'express.v1.wallet.simplecreate': {
    post: PostSimpleCreate,
  },
  'express.v1.pendingapprovals': {
    put: PutPendingApproval,
  },
  'express.v1.wallet.signTransaction': {
    post: PostSignTransaction,
  },
  'express.keychain.local': {
    post: PostKeychainLocal,
  },
  'express.lightning.getState': {
    get: GetLightningState,
  },
  'express.lightning.initWallet': {
    post: PostLightningInitWallet,
  },
  'express.lightning.unlockWallet': {
    post: PostUnlockLightningWallet,
  },
  'express.verifycoinaddress': {
    post: PostVerifyCoinAddress,
  },
  'express.calculateminerfeeinfo': {
    post: PostCalculateMinerFeeInfo,
  },
  'express.v1.keychain.derive': {
    post: PostDeriveLocalKeyChain,
  },
  'express.v1.keychain.local': {
    post: PostCreateLocalKeyChain,
  },
  'express.v1.pendingapproval.constructTx': {
    put: PutConstructPendingApprovalTx,
  },
  'express.v1.wallet.consolidateunspents': {
    put: PutConsolidateUnspents,
  },
  'express.v1.wallet.fanoutunspents': {
    put: PutFanoutUnspents,
  },
});

export type ExpressApi = typeof ExpressApi;

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
