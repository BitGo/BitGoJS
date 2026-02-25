import * as t from 'io-ts';
import { apiSpec } from '@api-ts/io-ts-http';
import * as express from 'express';

import { GetPing } from './common/ping';
import { PostAcceptShare } from './v1/acceptShare';
import { PostSimpleCreate } from './v1/simpleCreate';
import { PutPendingApproval } from './v1/pendingApproval';
import { PutV2PendingApproval } from './v2/pendingApproval';

// Too large types can cause: TS7056 - inferred type exceeds maximum length.
// Workaround: construct expressApi with single keys and add to type union.

export const ExpressPingApiSpec = apiSpec({
  'express.ping': {
    get: GetPing,
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

// Batch 2+: Run `yarn express-api:apply-batch N` to enable more specs.
// Template blocks are in index.ts - apply-batch merges from there.

export type ExpressApi = typeof ExpressPingApiSpec &
  typeof ExpressV1WalletAcceptShareApiSpec &
  typeof ExpressV1WalletSimpleCreateApiSpec &
  typeof ExpressPendingApprovalsApiSpec;

export const ExpressApi: ExpressApi = {
  ...ExpressPingApiSpec,
  ...ExpressV1WalletAcceptShareApiSpec,
  ...ExpressV1WalletSimpleCreateApiSpec,
  ...ExpressPendingApprovalsApiSpec,
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
