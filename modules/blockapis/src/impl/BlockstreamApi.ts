import { formatOutputId, Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { AddressApi, AddressInfo } from '../AddressApi';
import { UtxoApi } from '../UtxoApi';
import { BaseHttpClient, HttpClient, mapSeries } from '../BaseHttpClient';
import { ApiNotImplementedError } from '../ApiBuilder';

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddress
type EsploraAddressStats = {
  tx_count: number;
  funded_txo_sum: number;
  spent_txo_sum: number;
};

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddress
type EsploraAddress = {
  address: string;
  chain_stats: EsploraAddressStats;
  mempool_staats: EsploraAddressStats;
};

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddressutxo
type EsploraVin = {
  txid: string;
  vout: number;
  status: unknown;
  value: number;
  prevout: EsploraVout;
};

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddressutxo
type EsploraVout = {
  scriptpubkey: string;
  scriptpubkey_address: string;
  value: number;
};

function toBitGoUnspent(u: EsploraVin, address: string, value: number): Unspent {
  return {
    id: formatOutputId(u),
    address,
    value,
  };
}

// https://github.com/Blockstream/esplora/blob/master/API.md#get-txtxid
type EsploraTransaction = {
  txid: string;
  vin: EsploraVin[];
};

export class BlockstreamApi implements AddressApi, UtxoApi {
  static forCoin(coinName: string, params: { httpClient?: HttpClient } = {}): BlockstreamApi {
    const { httpClient = new BaseHttpClient() } = params;
    switch (coinName) {
      case 'btc':
        return new BlockstreamApi(httpClient.withBaseUrl('https://blockstream.info/api'));
      case 'tbtc':
        return new BlockstreamApi(httpClient.withBaseUrl('https://blockstream.info/testnet/api'));
    }

    throw new ApiNotImplementedError(coinName);
  }

  constructor(public client: HttpClient) {}

  async getAddressInfo(address: string): Promise<AddressInfo> {
    const response = await this.client.get<EsploraAddress>(`/address/${address}`);
    return response.map((body) => {
      return {
        txCount: body.chain_stats.tx_count,
        balance: body.chain_stats.funded_txo_sum - body.chain_stats.spent_txo_sum,
      };
    });
  }

  async getUnspentsForAddresses(addrs: string[]): Promise<Unspent[]> {
    if (addrs.length !== 1) {
      return (await mapSeries(addrs, (a) => this.getUnspentsForAddresses([a]))).flat();
    }

    const [address] = addrs;

    return (await this.client.get<EsploraVin[]>(`/address/${address}/utxo`)).map((unspents) =>
      unspents.map((u) => toBitGoUnspent(u, address, u.value))
    );
  }

  async getTransactionHex(txid: string): Promise<string> {
    return (await this.client.get<string>(`/tx/${txid}/hex`)).map((v) => v);
  }

  async getTransactionInputs(txid: string): Promise<Unspent[]> {
    return (await this.client.get<EsploraTransaction>(`/tx/${txid}`)).map((body) =>
      body.vin.map((u) => toBitGoUnspent(u, u.prevout.scriptpubkey_address, u.prevout.value))
    );
  }
}
