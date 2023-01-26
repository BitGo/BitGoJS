import { bitgo } from '@bitgo/utxo-lib';
import { AddressApi, AddressInfo } from '../AddressApi';
import { OutputSpend, TransactionIO, UtxoApi } from '../UtxoApi';
import { ApiRequestError, BaseHttpClient, HttpClient, mapSeries } from '../BaseHttpClient';
import { ApiNotImplementedError } from '../ApiBuilder';
import { TransactionStatus } from '../TransactionApi';

type Unspent = bitgo.Unspent;
const formatOutputId = bitgo.formatOutputId;

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

// https://github.com/Blockstream/esplora/blob/master/API.md#get-txtxidoutspendvout
type EsploraOutspend = {
  txid: string;
  vin: number;
};

function toBitGoUnspent(u: EsploraVin, address: string, value: number): Unspent {
  return {
    id: formatOutputId(u),
    address,
    value,
  };
}

// https://github.com/Blockstream/esplora/blob/master/API.md#get-txtxidstatus
type EsploraStatus =
  | {
      confirmed: false;
    }
  | {
      confirmed: true;
      block_height: number;
      block_hash: string;
    };

// https://github.com/Blockstream/esplora/blob/master/API.md#get-txtxid
type EsploraTransaction = {
  txid: string;
  vin: EsploraVin[];
  vout: EsploraVout[];
  status: EsploraStatus;
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

  async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    try {
      return (await this.client.get<EsploraTransaction>(`/tx/${txid}`)).map(({ status }) =>
        status.confirmed
          ? { found: true, confirmed: true, blockHeight: status.block_height, blockHash: status.block_hash }
          : { found: true, confirmed: false }
      );
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const reason = e.reason as any;
        if (reason.response.status === 404 && reason.response.text === 'Transaction not found') {
          return { found: false };
        }
      }
      throw e;
    }
  }

  async getTransactionInputs(txid: string): Promise<Unspent[]> {
    return (await this.client.get<EsploraTransaction>(`/tx/${txid}`)).map((body) =>
      body.vin.map((u) => toBitGoUnspent(u, u.prevout.scriptpubkey_address, u.prevout.value))
    );
  }

  async getTransactionIO(txid: string): Promise<TransactionIO> {
    const tx = await this.client.get<EsploraTransaction>(`/tx/${txid}`);
    const inputs = tx.map((body) =>
      body.vin.map((u) => {
        return {
          address: u.prevout.scriptpubkey_address,
        };
      })
    );
    const outputs = tx.map((body) =>
      body.vout.map((u) => {
        return {
          address: u.scriptpubkey_address,
        };
      })
    );
    return {
      inputs,
      outputs,
    };
  }

  async getTransactionSpends(txid: string): Promise<OutputSpend[]> {
    return (await this.client.get<EsploraOutspend[]>(`/tx/${txid}/outspends`)).map((arr) =>
      arr.map((v) => (v.txid ? { txid: v.txid, vin: v.vin } : { txid: undefined, vin: undefined }))
    );
  }
}
