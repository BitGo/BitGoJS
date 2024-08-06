import * as https from 'https';
import * as superagent from 'superagent';
import { decodeOrElse } from '@bitgo/sdk-core';
import { retryPromise } from '../retryPromise';
import {
  BakeMacaroonResponse,
  BakeMacaroonResponseCodec,
  GetWalletStateResponse,
  GetWalletStateResponseCodec,
  InitWalletResponse,
  InitWalletResponseCodec,
} from './codecs';

export function createHttpAgent(tlsCert: string): https.Agent {
  return new https.Agent({
    ca: Buffer.from(tlsCert, 'base64').toString('utf-8'),
  });
}

export async function getWalletState(config: {
  url: string;
  httpsAgent: https.Agent;
}): Promise<GetWalletStateResponse> {
  const res = await retryPromise(
    () => superagent.get(`${config.url}/v1/state`).agent(config.httpsAgent).send(),
    (err, tryCount) => {
      console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
    }
  );

  if (res.status !== 200) {
    throw new Error(`Failed to get wallet state with status: ${res.text}`);
  }

  return decodeOrElse(GetWalletStateResponseCodec.name, GetWalletStateResponseCodec, res.body, (errors) => {
    throw new Error(`Get wallet state failed: ${errors}`);
  });
}

export async function initWallet(
  config: { url: string; httpsAgent: https.Agent },
  data: { wallet_password: string; extended_master_key: string; macaroon_root_key: string }
): Promise<InitWalletResponse> {
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
    throw new Error(`Failed to initialize wallet with status: ${res.status}`);
  }

  return decodeOrElse(InitWalletResponseCodec.name, InitWalletResponseCodec, res.body, (_) => {
    throw new Error(`Init wallet failed.`);
  });
}

export async function bakeMacaroon(
  config: { url: string; httpsAgent: https.Agent },
  header: { adminMacaroonHex: string },
  data: {
    permissions: {
      entity: string;
      action: string;
    }[];
  }
): Promise<BakeMacaroonResponse> {
  const res = await retryPromise(
    () =>
      superagent
        .post(`${config.url}/v1/macaroon`)
        .agent(config.httpsAgent)
        .set('Grpc-Metadata-macaroon', header.adminMacaroonHex)
        .type('json')
        .send(data),
    (err, tryCount) => {
      console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
    }
  );

  if (res.status !== 200) {
    throw new Error(`Failed to bake macaroon with status: ${res.text}`);
  }

  return decodeOrElse(BakeMacaroonResponseCodec.name, BakeMacaroonResponseCodec, res.body, (errors) => {
    throw new Error(`Bake macaroon failed: ${errors}`);
  });
}
