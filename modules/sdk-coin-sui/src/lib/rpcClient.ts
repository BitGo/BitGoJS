import * as superagent from 'superagent';

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
  const res = await requestIgnoreStatusCode({
    method: 'post',
    url,
    timeoutMs: 3000,
    params: { jsonrpc: '2.0', id: 1, method: method, params: params },
  });
  if (res.body.error || res.statusCode !== 200) {
    console.error(`Request to the node failed. Got: ${res.body}`);
    throw new Error(`Request to the node failed. Got: ${res.body}`);
  }
  return res.body.result;
}
