import { formatOutputId, Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';

import { BaseHttpClient, HttpClient, Response } from '../BaseHttpClient';
import { ApiNotImplementedError } from '../ApiBuilder';
import { AddressApi, AddressInfo } from '../AddressApi';
import { UtxoApi } from '../UtxoApi';

type BlockchairResponse<T> = {
  data: T;
};

type BlockchairRecordResponse<T> = BlockchairResponse<Record<string, T>>;

function unwrapRecord<T>(body: BlockchairRecordResponse<T>, key: string): T {
  if (!(key in body.data)) {
    throw new Error(`key ${key} not in response`);
  }
  return body.data[key];
}

// https://blockchair.com/api/docs#link_300
type BlockchairUnspent = {
  transaction_hash: string;
  index: number;
  recipient: string;
  value: number;
  block_id: number;
};

// https://blockchair.com/api/docs#link_300
type BlockchairAddress = {
  address: {
    transaction_hash: string;
    // vout
    index: number;
    value: number;
    block_id: number;
    transaction_count: number;
    balance: number;
  };
  utxo: BlockchairUnspent[];
};

// https://blockchair.com/api/docs#link_200
type BlockchairTransaction = {
  transaction: unknown;
  inputs: BlockchairUnspent[];
  outputs: BlockchairUnspent[];
};

// https://blockchair.com/api/docs#link_201
type BlockchairRawTransaction = {
  raw_transaction: string;
};

export class BlockchairApi implements AddressApi, UtxoApi {
  protected readonly apiToken?: string;

  static forCoin(coinName: string, params: { apiToken?: string; httpClient?: HttpClient } = {}): BlockchairApi {
    // https://blockchair.com/api/docs#link_M0
    let blockchain;
    switch (coinName) {
      case 'btc':
        blockchain = 'bitcoin';
        break;
      case 'tbtc':
        blockchain = 'bitcoin/testnet';
        break;
      case 'bsv':
        blockchain = 'bitcoin-sv';
        break;
      case 'bch':
        blockchain = 'bitcoin-cash';
        break;
      case 'bcha':
        blockchain = 'ecash';
        break;
      case 'ltc':
        blockchain = 'litecoin';
        break;
      case 'dash':
        blockchain = 'dash';
        break;
      case 'zec':
        blockchain = 'zcash';
        break;
      default:
        throw new ApiNotImplementedError(coinName);
    }
    const { httpClient = new BaseHttpClient() } = params;
    return new BlockchairApi(httpClient.withBaseUrl(`https://api.blockchair.com/${blockchain}`), params.apiToken);
  }

  constructor(public client: HttpClient, apiToken?: string) {
    this.apiToken = apiToken ?? process.env.BLOCKCHAIR_TOKEN;
  }

  get<T>(path: string): Promise<Response<T>> {
    return this.client.get(path + (this.apiToken ? `?key=${this.apiToken}` : ''));
  }

  async getAddressInfo(address: string): Promise<AddressInfo> {
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    // https://blockchair.com/api/docs#link_300
    return (await this.get<BlockchairRecordResponse<BlockchairAddress>>(`/dashboards/address/${address}`)).map(
      (body) => {
        return {
          txCount: body.data[address].address.transaction_count,
          balance: body.data[address].address.balance,
        };
      }
    );
  }

  async getUnspentsForAddresses(addr: string[]): Promise<Unspent[]> {
    if (addr.length > 100) {
      throw new Error(`invalid size`);
    }
    // https://blockchair.com/api/docs#link_300
    return (
      await this.get<BlockchairResponse<{ utxo: BlockchairUnspent[] }>>(`/dashboards/addresses/${addr.join(',')}`)
    ).map((body) => {
      return addr.flatMap((a) => {
        return body.data.utxo.map((unspent): Unspent => {
          return {
            id: formatOutputId({ txid: unspent.transaction_hash, vout: unspent.index }),
            address: a,
            value: unspent.value,
          };
        });
      });
    });
  }

  async getTransaction(txid: string): Promise<BlockchairTransaction> {
    return (await this.get<BlockchairRecordResponse<BlockchairTransaction>>(`/dashboards/transaction/${txid}`)).map(
      (body) => {
        return unwrapRecord(body, txid);
      }
    );
  }

  async getTransactionInputs(txid: string): Promise<Unspent[]> {
    return (await this.getTransaction(txid)).inputs.map((i) => {
      return {
        id: formatOutputId({ txid: i.transaction_hash, vout: i.index }),
        address: i.recipient,
        value: i.value,
      };
    });
  }

  async getTransactionHex(txid: string): Promise<string> {
    return (await this.get<BlockchairRecordResponse<BlockchairRawTransaction>>(`/raw/transaction/${txid}`)).map(
      (body) => {
        return unwrapRecord(body, txid).raw_transaction;
      }
    );
  }
}
