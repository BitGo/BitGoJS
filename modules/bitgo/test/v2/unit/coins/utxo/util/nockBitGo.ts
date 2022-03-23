import * as nock from 'nock';
import { Environment, Environments } from '../../../../../../src/v2/environments';
import { defaultBitGo } from './utxoCoins';

export function nockBitGo(bitgo = defaultBitGo): nock.Scope {
  const env = Environments[bitgo.getEnv()] as Environment;
  return nock(env.uri);
}
