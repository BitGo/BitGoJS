import * as https from 'https';
import * as superagent from 'superagent';
import { decodeOrElse } from '@bitgo/sdk-core';
import { retryPromise } from '../retryPromise';
import { BakeMacaroonResponseCodec, InitWalletResponseCodec } from './codecs';

export function createHttpAgent(tlsCert: string): https.Agent {
  return new https.Agent({
    ca: Buffer.from(tlsCert, 'base64').toString('utf-8'),
  });
}

export async function initWallet(
  config: { url: string; httpsAgent: https.Agent },
  data: { wallet_password: string; extended_master_key: string; macaroon_root_key: string }
) {
  const res = await retryPromise(
    () =>
      superagent
        .post(`${config.url}/v1/initwallet`)
        .agent(config.httpsAgent)
        .type('json')
        .send({ ...data, stateless_init: true }),
    (err, tryCount) => {
      console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
    }
  );

  if (res.status !== 200) {
    throw new Error(`Failed to initialize wallet: ${res.text}`);
  }

  return decodeOrElse(InitWalletResponseCodec.name, InitWalletResponseCodec, res.body, (errors) => {
    throw new Error(`Invalid response from lightning signer for init wallet: ${errors}`);
  });
}

export async function bakeMacaroon(
  config: { url: string; httpsAgent: https.Agent; adminMacaroonHex: string },
  data: {
    entity: string;
    action: string;
  }[]
) {
  const res = await retryPromise(
    () =>
      superagent
        .post(`${config.url}/v1/initwallet`)
        .agent(config.httpsAgent)
        .set('Grpc-Metadata-macaroon', config.adminMacaroonHex)
        .type('json')
        .send(data),
    (err, tryCount) => {
      console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
    }
  );

  if (res.status !== 200) {
    throw new Error(`Failed to bake macaroon: ${res.text}`);
  }

  return decodeOrElse(BakeMacaroonResponseCodec.name, BakeMacaroonResponseCodec, res.body, (errors) => {
    throw new Error(`Invalid response from lightning signer for bake macaroon: ${errors}`);
  });
}
