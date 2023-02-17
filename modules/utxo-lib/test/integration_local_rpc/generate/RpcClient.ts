import * as assert from 'assert';
import axios, { AxiosError } from 'axios';
import buildDebug from 'debug';

import { Network, getMainnet, getNetworkName, isZcash } from '../../../src/networks';
import { RpcTransaction } from './RpcTypes';

const utxolib = require('../../../src');

const debug = buildDebug('RpcClient');

function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
}

export class RpcError extends Error {
  constructor(public rpcError: { code: number; message: string }) {
    super(`RPC error: ${rpcError.message} (code=${rpcError.code})`);
  }

  static isRpcErrorWithCode(e: Error, code: number): boolean {
    return e instanceof RpcError && e.rpcError.code === code;
  }
}

type NetworkInfo = { subversion: string };

const BITCOIN_CORE_22_99 = '/Satoshi:22.99.0/';

export class RpcClient {
  id = 0;

  constructor(protected network: Network, protected url: string, protected networkInfo?: NetworkInfo) {}

  /**
   * Poor man's Bluebird.map(arr, f, { concurrency })
   * Processes promises in batches of 16
   *
   * @param arr
   * @param f
   * @param [concurrency=8]
   */
  static async parallelMap<S, T>(
    arr: S[],
    f: (S, i: number) => Promise<T>,
    { concurrency }: { concurrency: number } = { concurrency: 16 }
  ): Promise<T[]> {
    const rest: S[] = arr.splice(concurrency);
    const result = await Promise.all(arr.map((v, i) => f(v, i)));
    if (rest.length) {
      return [...result, ...(await this.parallelMap(rest, f))];
    }
    return result;
  }

  protected getUrl(): string {
    return this.url;
  }

  async exec<T>(method: string, ...params: unknown[]): Promise<T> {
    try {
      debug('>', this.getUrl(), method, params);
      const response = await axios.post(this.getUrl(), {
        jsonrpc: '1.0',
        method,
        params,
        id: `${this.id++}`,
      });
      if (method === 'generate' || method === 'generatetoaddress') {
        debug('<', '[...]');
      } else {
        debug('<', response.data.result);
      }
      return response.data.result;
    } catch (e) {
      if (e.isAxiosError && e.response) {
        e = e as AxiosError;
        debug('< ERROR', e.response.statusText, e.response.data);
        e = e as AxiosError;
        const { error = {} } = e.response.data;
        throw new RpcError(error);
      }

      throw e;
    }
  }

  requiresWalletPath(): boolean {
    if (!this.networkInfo) {
      throw new Error(`networkInfo must be set`);
    }
    return this.networkInfo.subversion === BITCOIN_CORE_22_99;
  }

  withWallet(walletName: string): RpcClientWithWallet {
    if (!this.networkInfo) {
      throw new Error(`networkInfo must be set`);
    }
    return new RpcClientWithWallet(this.network, this.url, this.networkInfo, walletName);
  }

  async getHelp(): Promise<string> {
    return this.exec('help');
  }

  async createWallet(walletName: string): Promise<string> {
    return this.exec('createwallet', walletName);
  }

  async loadWallet(walletName: string): Promise<string> {
    return this.exec('loadwallet', walletName);
  }

  async getNetworkInfo(): Promise<{ subversion: string }> {
    return this.exec('getnetworkinfo');
  }

  async getBlockCount(): Promise<number> {
    return this.exec('getblockcount');
  }

  async getRawTransaction(txid: string): Promise<Buffer> {
    return Buffer.from(await this.exec<string>('getrawtransaction', txid), 'hex');
  }

  async getRawTransactionVerbose(txid: string): Promise<RpcTransaction> {
    const verbose = isZcash(this.network) ? 1 : true;
    return await this.exec('getrawtransaction', txid, verbose);
  }

  async sendRawTransaction(tx: Buffer): Promise<string> {
    return await this.exec('sendrawtransaction', tx.toString('hex'));
  }

  static async fromEnvvar(network: Network): Promise<RpcClient> {
    const networkName = getNetworkName(network);
    assert(networkName);
    const envKey = 'RPC_' + networkName.toUpperCase();
    const url = process.env[envKey];
    if (url === undefined) {
      throw new Error(`envvar ${envKey} not set`);
    }

    return this.forUrl(network, url);
  }

  static getSupportedNodeVersions(network: Network): string[] {
    switch (getMainnet(network)) {
      case utxolib.networks.bitcoin:
        return ['/Satoshi:0.20.0/', '/Satoshi:0.21.1/', '/Satoshi:22.0.0/', BITCOIN_CORE_22_99];
      case utxolib.networks.bitcoincash:
        return ['/Bitcoin Cash Node:23.0.0(EB32.0)/'];
      case utxolib.networks.bitcoinsv:
        return ['/Bitcoin SV:1.0.5/'];
      case utxolib.networks.bitcoingold:
        return ['/Bitcoin Gold:0.17.3/'];
      case utxolib.networks.dash:
        return ['/Dash Core:0.16.1.1/'];
      case utxolib.networks.dogecoin:
        return ['/Shibetoshi:1.14.5/'];
      case utxolib.networks.ecash:
        return ['/Bitcoin ABC:0.26.9(EB32.0)/'];
      case utxolib.networks.litecoin:
        return ['/LitecoinCore:0.17.1/'];
      case utxolib.networks.zcash:
        return ['/MagicBean:4.7.0/'];
      default:
        return [];
    }
  }

  static async forUrl(network: Network, url: string): Promise<RpcClient> {
    const networkName = getNetworkName(network);
    const rpcClient = new RpcClient(network, url);
    const networkinfo = await rpcClient.getNetworkInfo();

    const versions = this.getSupportedNodeVersions(network);
    if (!versions.includes(networkinfo.subversion)) {
      throw new Error(`unsupported coin ${networkName} subversion=${networkinfo.subversion} versions=${versions}`);
    }

    return new RpcClient(network, url, networkinfo);
  }

  static async forUrlWait(network: Network, url: string): Promise<RpcClient> {
    for (let i = 0; i < 600; i++) {
      try {
        return await this.forUrl(network, url);
      } catch (e) {
        console.error(`[${getNetworkName(network)}] ${e}, waiting 1000 millis...`);
        await sleep(1_000);
      }
    }
    throw new Error(`could not get RpcClient`);
  }
}

export class RpcClientWithWallet extends RpcClient {
  constructor(network: Network, url: string, networkInfo: NetworkInfo, private walletName?: string) {
    super(network, url, networkInfo);
  }

  protected getUrl(): string {
    if (this.requiresWalletPath()) {
      return super.getUrl() + '/wallet/' + this.walletName;
    }
    return super.getUrl();
  }

  public async getWalletInfo(): Promise<Record<string, unknown>> {
    return await this.exec('getwalletinfo');
  }

  public async getBalance(): Promise<number> {
    return await this.exec('getbalance');
  }

  async getNewAddress(): Promise<string> {
    return this.exec('getnewaddress');
  }

  async sendToAddress(address: string, amount: number | string): Promise<string> {
    return this.exec('sendtoaddress', address, amount);
  }

  async generateToAddress(n: number, address: string): Promise<void> {
    switch (this.network) {
      case utxolib.networks.zcashTest:
        await this.exec('generate', n);
        await sleep(1_000);
        await this.sendToAddress(address, 1);
        break;
      default:
        await this.exec('generatetoaddress', n, address);
    }
  }
}
