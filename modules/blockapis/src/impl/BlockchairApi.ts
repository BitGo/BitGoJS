import { bitgo } from '@bitgo/utxo-lib';
import { BaseHttpClient, HttpClient, Response } from '../BaseHttpClient';
import { ApiNotImplementedError } from '../ApiBuilder';
import { AddressApi, AddressInfo } from '../AddressApi';
import { OutputSpend, TransactionIO, UtxoApi } from '../UtxoApi';
import { TransactionStatus } from '../TransactionApi';

type Unspent = bitgo.Unspent;
const formatOutputId = bitgo.formatOutputId;

type BlockchairResponse<T> = {
  data: T;
};

type BlockchairRecordResponse<T> = BlockchairResponse<Record<string, T>>;

class ErrorKeyNotInResponse extends Error {
  constructor(key: string) {
    super(`key ${key} not in response`);
  }
}

function unwrapRecord<T>(body: BlockchairRecordResponse<T>, key: string): T {
  if (!(key in body.data)) {
    throw new ErrorKeyNotInResponse(key);
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
  script_hex: string;
  spending_transaction_hash: string;
  spending_index: number;
  address: string;
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
  transaction: {
    /**
      The block number it's included in.
      If the transaction is in the mempool, data.{:hash}ᵢ.transaction.block_id yields -1
    */
    block_id: number;
    /**
     * Like https://tc39.es/ecma262/#sec-date-time-string-format but with a space instead of 'T'
     * YYYY-MM-DD HH:mm:ss
     */
    time: string;
  };
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
      case 'doge':
        blockchain = 'dogecoin';
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

    const response = await this.get<BlockchairResponse<{ utxo: BlockchairUnspent[] }>>(
      `/dashboards/addresses/${addr.join(',')}`
    );

    return response.map((body) => {
      return body.data.utxo
        .flatMap((unspent): Unspent | undefined => {
          if (addr.includes(unspent.address)) {
            return {
              id: formatOutputId({ txid: unspent.transaction_hash, vout: unspent.index }),
              address: unspent.address,
              value: unspent.value,
            };
          }
          return undefined;
        })
        .filter((unspent): unspent is Unspent => unspent !== undefined);
    });
  }

  async getTransaction(txid: string): Promise<BlockchairTransaction> {
    return (await this.get<BlockchairRecordResponse<BlockchairTransaction>>(`/dashboards/transaction/${txid}`)).map(
      (body) => {
        return unwrapRecord(body, txid);
      }
    );
  }

  async getTransactionStatus(txid: string): Promise<TransactionStatus> {
    let transaction;
    try {
      transaction = (await this.getTransaction(txid)).transaction;
    } catch (e) {
      if (e instanceof ErrorKeyNotInResponse) {
        return { found: false };
      }
      throw e;
    }
    const { block_id, time } = transaction;
    const date = new Date(Date.parse(time.replace(' ', 'T') + '.000Z' /* force UTC parsing */));
    return block_id === -1
      ? { found: true, confirmed: false }
      : {
          found: true,
          confirmed: true,
          blockHeight: block_id,
          date,
        };
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

  async getTransactionIO(txid: string): Promise<TransactionIO> {
    const tx = await this.getTransaction(txid);
    const inputs = tx.inputs.map((input) => {
      return {
        address: input.recipient,
      };
    });
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.recipient,
      };
    });
    return {
      inputs,
      outputs,
    };
  }

  async getTransactionSpends(txid: string): Promise<OutputSpend[]> {
    return (await this.getTransaction(txid)).outputs.map((o) =>
      o.spending_transaction_hash
        ? {
            txid: o.spending_transaction_hash,
            vin: o.spending_index,
          }
        : { txid: undefined, vin: undefined }
    );
  }

  async getTransactionHex(txid: string): Promise<string> {
    return (await this.get<BlockchairRecordResponse<BlockchairRawTransaction>>(`/raw/transaction/${txid}`)).map(
      (body) => {
        return unwrapRecord(body, txid).raw_transaction;
      }
    );
  }
}
