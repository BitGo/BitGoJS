import * as https from 'https';
import * as superagent from 'superagent';
import { decodeOrElse } from '@bitgo/sdk-core';
import { retryPromise } from '../retryPromise';
import { BakeMacaroonResponse, GetWalletStateResponse, InitWalletResponse, LightningSignerConfig } from './codecs';
import { getLightningSignerConfig } from './lightningUtils';

/**
 * Client for interacting with the LND signer.
 */
export class LndSignerClient {
  public readonly url: string;
  public readonly httpsAgent: https.Agent;

  private constructor(config: LightningSignerConfig) {
    this.url = config.url;
    this.httpsAgent = new https.Agent({
      ca: Buffer.from(config.tlsCert, 'base64').toString('utf-8'),
    });
  }

  /**
   * Create a new LndSignerClient.
   */
  public static async create(
    walletId: string,
    config: { lightningSignerFileSystemPath?: string }
  ): Promise<LndSignerClient> {
    const lightningSignerConfig = await getLightningSignerConfig(walletId, config);
    return new LndSignerClient(lightningSignerConfig);
  }

  /**
   * Get the current state of the wallet from remote signer LND.
   */
  async getWalletState(): Promise<GetWalletStateResponse> {
    const res = await retryPromise(
      () => superagent.get(`${this.url}/v1/state`).agent(this.httpsAgent).send(),
      (err, tryCount) => {
        console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );

    if (res.status !== 200) {
      throw new Error(`Failed to get wallet state with status: ${res.text}`);
    }

    return decodeOrElse(GetWalletStateResponse.name, GetWalletStateResponse, res.body, (errors) => {
      throw new Error(`Get wallet state failed: ${errors}`);
    });
  }

  /**
   * Initialize the remote signer LND wallet with the given data.
   */
  async initWallet(data: {
    wallet_password: string;
    extended_master_key: string;
    macaroon_root_key: string;
  }): Promise<InitWalletResponse> {
    const res = await retryPromise(
      () =>
        superagent
          .post(`${this.url}/v1/initwallet`)
          .agent(this.httpsAgent)
          .type('json')
          .send({ ...data, stateless_init: true }),
      (err, tryCount) => {
        console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );

    if (res.status !== 200) {
      throw new Error(`Failed to initialize wallet with status: ${res.status}`);
    }

    return decodeOrElse(InitWalletResponse.name, InitWalletResponse, res.body, (_) => {
      throw new Error(`Init wallet failed.`);
    });
  }

  /**
   * Bake a macaroon with the given permissions from remote signer LND.
   */
  async bakeMacaroon(
    data: {
      permissions: {
        entity: string;
        action: string;
      }[];
    },
    header: { adminMacaroonHex: string }
  ): Promise<BakeMacaroonResponse> {
    const res = await retryPromise(
      () =>
        superagent
          .post(`${this.url}/v1/macaroon`)
          .agent(this.httpsAgent)
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

    return decodeOrElse(BakeMacaroonResponse.name, BakeMacaroonResponse, res.body, (errors) => {
      throw new Error(`Bake macaroon failed: ${errors}`);
    });
  }

  /**
   * Unlock the wallet with the given wallet password.
   */
  async unlockWallet(data: { wallet_password: string }): Promise<void> {
    const res = await retryPromise(
      () =>
        superagent
          .post(`${this.url}/v1/unlockwallet`)
          .agent(this.httpsAgent)
          .type('json')
          .send({ ...data, stateless_init: true }),
      (err, tryCount) => {
        console.log(`failed to connect to lightning signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );

    if (res.status !== 200) {
      throw new Error(`Failed to unlock wallet: ${res.text}`);
    }
  }
}
