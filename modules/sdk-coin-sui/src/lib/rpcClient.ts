import * as superagent from 'superagent';
import { RecoveryProviderError } from '@bitgo/sdk-core';

export type Params = any;

async function request({ url, timeoutMs = undefined, params = {} }) {
  return superagent
    .post(url)
    .send(params)
    .timeout({ deadline: timeoutMs })
    .type('json')
    .set({ Accept: 'application/json' });
}

export async function requestIgnoreStatusCode(params: Params): Promise<superagent.Response> {
  try {
    return await request(params);
  } catch (e: any) {
    if ('response' in e) {
      return e.response;
    }
    throw e;
  }
}

export async function makeRPC(url: string, method: string, params: Params): Promise<Record<string, any>> {
  let res;
  try {
    res = await requestIgnoreStatusCode({
      method: 'post',
      url,
      timeoutMs: 3000,
      params: { jsonrpc: '2.0', id: 1, method: method, params: params },
    });
  } catch (e) {
    throw new RecoveryProviderError(`RPC call failed for ${method}: ${(e as Error).message}`, e);
  }
  if (res.body.error) {
    const error = res.body.error;
    throw new RecoveryProviderError(`Request to the node failed. Error code: ${error.code}, message: ${error.message}`);
  }
  if (res.statusCode !== 200) {
    throw new RecoveryProviderError(`Request to the node failed, Status code: ${res.statusCode}`);
  }
  return res.body.result;
}
