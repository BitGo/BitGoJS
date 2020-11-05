import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './types';
import * as request from 'superagent';
import { BitGo } from '../../bitgo';

// BCH refers to the BCH-A fork here, as that is what cryptoAPI decided to support
const CryptoApiCoins = ['bch'];

const devBase = ['dev', 'latest', 'local', 'localNonSecure', 'adminDev', 'adminLatest'];
const testnetBase = ['test', 'adminTest'];
const mainnetBase = ['prod', 'staging', 'adminProd'];

export class CryptoApi implements RecoveryProvider {
  protected readonly bitgo: BitGo;
  protected readonly apiToken: string;
  protected readonly coin: string;


  constructor(bitgo: BitGo, coin: string, apiToken: string ) {
    if (!CryptoApiCoins.includes(coin)) {
      throw new Error(`coin ${coin} not supported by CryptoAPIs`);
    }
    this.bitgo = bitgo;
    this.coin = coin;
    this.apiToken = apiToken;
  }

  static getBaseUrl(env: string, coin: string): string {
    let url;
    if (mainnetBase.includes(env)) {
      url = `https://api.cryptoapis.io/v1/bc/${coin}/mainnet`;
    } else if (testnetBase.includes(env) || devBase.includes((env))) {
      url = `https://api.cryptoapis.com/v1/bc/${coin}/testnet`;
    } else if (env === 'mock') {
      url = `https://api.cryotpapis.fakeurl/v1/bc/${coin}/testnet`;
    } else {
      throw new Error(`Environment ${env} unsupported`);
    }
    return url;
  }

  /** @inheritdoc */
  getExplorerUrl(query: string): string {
    const env = this.bitgo.getEnv();
    const baseUrl = CryptoApi.getBaseUrl(env, this.coin);
    return baseUrl + query;
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    // Example: https://api.cryptoapis.io/v1/bc/bch/testnet/address/my4TmbbhJCLJB9q1eHUHQWJfbbJoYdLwtE
    // API Doc: https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/bch/index#bch-address-info-endpoint
    /**
     * {{
           "payload" : {
          "address" : "bchtest:ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4",
          "addresses" : [
             "bchtest:ppcv48up7qv7r6epdmy5nn3x3hyf9cjec5aglzm6x4"
          ],
          "balance" : "11.9999439",
          "legacy" : "2N3XcQGSrdZPDwj6z3tu3iaA3msrdzVoPXT",
          "totalReceived" : "11.9999439",
          "totalSpent" : "0",
          "txi" : 0,
          "txo" : 1,
          "txsCount" : 1
         }
       }
     ],
     */
    if(!address || address.length === 0) {
      throw new Error('invalid address');
    }
    const response = await request.get(this.getExplorerUrl(`/address/${address}`)).set('X-API-Key', this.apiToken);
    return {
      txCount: response.body.payload.txsCount,
      totalBalance: response.body.payload.balance,
    };
  }

  /** @inheritDoc */
  async getUnspents(address: string): Promise<RecoveryUnspent[]> {
    // https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/bch/index#bch-address-unspent-tx-outputs-endpoint
    // example request: https://api.cryptoapis.io/v1/bc/bch/testnet/address/bchtest:qp02h3kdvjxw2ev9dlxk7n8y2mhgdrzlxv86qjp9f5
    /** sample response:
     * {
        "payload": [
            {
                "txid": "4bddcca1995a3b327409d45c2939375890a7650fb31704ab1118033cd2fe7ade",
                "vout": 1,
                "amount": 0.1
            },
            {
                "txid": "89c8b6d58203f3d45ae60e09bc03c7eef2446013772740cca7b1d85ee075a2c3",
                "vout": 0,
                "amount": 0.09999296
            }
        ],
        "meta": {
            "totalCount": 2,
            "results": 2
        }
      }
     */
    if(!address || address.length === 0) {
      throw new Error('invalid address');
    }
    const response = await request.get(this.getExplorerUrl(`/address/${address}/unspent-transactions`)).set('X-API-Key', this.apiToken);
    const rawUnspents = response.body.payload;

    return rawUnspents.map(unspent => {
      return {
        amount: unspent.amount,
        n: unspent.vout,
        txid: unspent.txid,
        address,
      };
    });
  }
}
