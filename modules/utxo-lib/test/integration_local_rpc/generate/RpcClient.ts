/**
 * @prettier
 */
import * as assert from 'assert';
import axios, { AxiosError } from 'axios';
import buildDebug from 'debug';

import { Network } from '../../../src/networkTypes';
import { getMainnet, getNetworkName, isZcash } from '../../../src/coins';
import { RpcTransaction } from './RpcTypes';

const utxolib = require('../../../src');

const debug = buildDebug('RpcClient');

function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
}

export class RpcClient {
  id = 0;

  constructor(private network: Network, private url) {}

  async exec<T>(method: string, ...params: unknown[]): Promise<T> {
    try {
      debug('<', method, params);
      const response = await axios.post(this.url, {
        jsonrpc: '1.0',
        method,
        params,
        id: `${this.id++}`,
      });
      debug('>', response.data.result);
      return response.data.result;
    } catch (e) {
      if (e.isAxiosError && e.response) {
        e = e as AxiosError;
        const { error } = e.response.data;
        const { code, message } = error;
        throw new Error(`RPC error: ${message} (code=${code})`);
      }

      throw e;
    }
  }

  async createWallet(walletName: string): Promise<string> {
    return this.exec('createwallet', walletName);
  }

  async getNewAddress(): Promise<string> {
    return this.exec('getnewaddress');
  }

  async getNetworkInfo(): Promise<{ subversion: string }> {
    return this.exec('getnetworkinfo');
  }

  async getBlockCount(): Promise<number> {
    return this.exec('getblockcount');
  }

  async sendToAddress(address: string, amount: number): Promise<string> {
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
        return ['/Satoshi:0.20.0/', '/Satoshi:0.21.1/'];
      case utxolib.networks.bitcoincash:
        return ['/Bitcoin Cash Node:23.0.0(EB32.0)/'];
      case utxolib.networks.bitcoinsv:
        return ['/Bitcoin SV:1.0.5/'];
      case utxolib.networks.bitcoingold:
        return ['/Bitcoin Gold:0.17.3/'];
      case utxolib.networks.dash:
        return ['/Dash Core:0.16.1.1/'];
      case utxolib.networks.litecoin:
        return ['/LitecoinCore:0.17.1/'];
      case utxolib.networks.zcash:
        return ['/MagicBean:4.4.0/'];
      default:
        return [];
    }
  }

  static async forUrl(network: Network, url: string) {
    const networkName = getNetworkName(network);
    const rpcClient = new RpcClient(network, url);
    const networkinfo = await rpcClient.getNetworkInfo();

    const versions = this.getSupportedNodeVersions(network);
    if (!versions.includes(networkinfo.subversion)) {
      throw new Error(`unsupported coin ${networkName} subversion=${networkinfo.subversion} versions=${versions}`);
    }

    return rpcClient;
  }

  static async forUrlWait(network: Network, url: string): Promise<RpcClient> {
    for (let i = 0; i < 600; i++) {
      try {
        return await this.forUrl(network, url);
      } catch (e) {
        console.error(`${e}, waiting 1000 millis...`);
        await sleep(1_000);
      }
    }
    throw new Error(`could not get RpcClient`);
  }
}
