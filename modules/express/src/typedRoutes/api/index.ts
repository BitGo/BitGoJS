import * as t from 'io-ts';
import { apiSpec } from '@api-ts/io-ts-http';
import * as express from 'express';

import { GetPing } from './common/ping';
import { GetPingExpress } from './common/pingExpress';

export const ExpressApi = apiSpec({
  'express.ping': {
    get: GetPing,
  },
  'express.pingExpress': {
    get: GetPingExpress,
  },
});

export type ExpressApi = typeof ExpressApi;

type ExtractDecoded<T> = T extends t.Type<any, infer O, any> ? O : never;
export type ExpressApiRouteRequest<
  ApiName extends keyof ExpressApi,
  Method extends keyof ExpressApi[ApiName]
> = ExpressApi[ApiName][Method] extends { request: infer R } ? express.Request & { decoded: ExtractDecoded<R> } : never;
