import * as nock from 'nock';
import { Environment, Environments } from '@bitgo/sdk-core';
import { defaultBitGo } from './utxoCoins';

export function nockBitGo(bitgo = defaultBitGo): nock.Scope {
  const env = Environments[bitgo.getEnv()] as Environment;
  return nock(env.uri);
}
