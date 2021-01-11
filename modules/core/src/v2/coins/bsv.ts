/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bch } from './bch';
import * as bitcoin from '@bitgo/utxo-lib';
const request = require('superagent');
import * as Bluebird from 'bluebird';
import { BaseCoin } from '../baseCoin';
import { AddressInfo, UnspentInfo, UtxoNetwork } from './abstractUtxoCoin';
const co = Bluebird.coroutine;
import * as common from '../../common';
import * as errors from '../../errors';
import { BlockchairApi } from '../recovery/blockchairApi';

export class Bsv extends Bch {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || bitcoin.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bsv(bitgo);
  }

  getChain(): string {
    return 'bsv';
  }

  getFamily(): string {
    return 'bsv';
  }

  getFullName(): string {
    return 'Bitcoin SV';
  }

  recoveryBlockchainExplorerUrl(url: string): string {
    const baseUrl = common.Environments[this.bitgo.getEnv()].bsvExplorerBaseUrl;

    // TODO BG-9989: There is no explorer api for Bitcoin SV yet. Once we have one, add it to src/common.js and update
    // this method.
    if (!baseUrl) {
      throw new errors.WalletRecoveryUnsupported(
        `Recoveries not supported for ${this.getChain()} - no explorer available`
      );
    }

    return common.Environments[this.bitgo.getEnv()].bsvExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string, apiKey?: string): Bluebird<AddressInfo> {
    const explorer = new BlockchairApi(this.bitgo, 'bitcoin-sv', apiKey);
    return Bluebird.resolve(explorer.getAccountInfo(addressBase58));
  }

  getUnspentInfoFromExplorer(addressBase58: string, apiKey?: string): Bluebird<UnspentInfo[]> {
    const explorer = new BlockchairApi(this.bitgo, 'bitcoin-sv', apiKey);
    return Bluebird.resolve(explorer.getUnspents(addressBase58));
  }
}
