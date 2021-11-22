/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as request from 'superagent';
import * as _ from 'lodash';

import { AbstractUtxoCoin, ExplorerTxInfo, UtxoNetwork } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import { BitGo } from '../../bitgo';
import * as common from '../../common';
import { InvalidAddressError } from '../../errors';
import { toBitgoRequest } from '../../api';
import { PublicUnspent } from './utxo/unspent';

const co = Bluebird.coroutine;

export type LitecointoolsVin = { addr: string };
export type LitecointoolsVout = { scriptPubKey: { addresses: string[] } };
export type LitecointoolsTx = {
  vin: LitecointoolsVin[];
  vout: LitecointoolsVout[];
};

export type LitecointoolsUnspent = {
  txid: string;
  vout: number;
  satoshis: number;
  address: string;
  height: number;
};

export class Ltc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.litecoin);
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = utxolib.networks.bitcoin.scriptHash;
    // do not support alt destinations in prod
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Ltc(bitgo);
  }

  getChain(): string {
    return 'ltc';
  }

  getFamily(): string {
    return 'ltc';
  }

  getFullName(): string {
    return 'Litecoin';
  }

  supportsBlockTarget(): boolean {
    return false;
  }

  supportsP2shP2wsh(): boolean {
    return true;
  }

  supportsP2wsh(): boolean {
    return true;
  }

  /**
   * Canonicalize a Litecoin address for a specific scriptHash version
   * @param address
   * @param scriptHashVersion 1 or 2, where 1 is the old version and 2 is the new version
   * @returns {*} address string
   */
  canonicalAddress(address: string, scriptHashVersion = 2): string {
    if (!this.isValidAddress(address, true)) {
      throw new InvalidAddressError();
    }

    try {
      // try deserializing as bech32
      utxolib.address.fromBech32(address);
      // address may be all uppercase, but canonical bech32 addresses are all lowercase
      return address.toLowerCase();
    } catch (e) {
      // not a valid bech32, try to decode as base58
    }

    const addressDetails = utxolib.address.fromBase58Check(address, this.network);
    if (addressDetails.version === this.network.pubKeyHash) {
      // the pub keys never changed
      return address;
    }

    if ([1, 2].indexOf(scriptHashVersion) === -1) {
      throw new Error('scriptHashVersion needs to be either 1 or 2');
    }
    const scriptHashMap = {
      // altScriptHash is the old one
      1: this.altScriptHash,
      // by default we're using the new one
      2: this.network.scriptHash,
    };
    const newScriptHash = scriptHashMap[scriptHashVersion];
    return utxolib.address.toBase58Check(addressDetails.hash, newScriptHash, this.network);
  }

  calculateRecoveryAddress(scriptHashScript: Buffer): string {
    const bitgoAddress = utxolib.address.fromOutputScript(scriptHashScript, this.network);
    return this.canonicalAddress(bitgoAddress, 1);
  }

  recoveryBlockchainExplorerUrl(url: string): string {
    return common.Environments[this.bitgo.env].ltcExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<any> {
    return co(function* getAddressInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const addrInfo = yield toBitgoRequest(
        request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}`))
      ).result();

      (addrInfo as any).txCount = (addrInfo as any).txApperances;
      (addrInfo as any).totalBalance = (addrInfo as any).balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    return co(function* getUnspentInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const unspents = yield toBitgoRequest(
        request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}/utxo`))
      ).result();

      (unspents as any).forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }

  async getTxInfoFromExplorer(faultyTxId: string): Promise<ExplorerTxInfo> {
    const res = (await request.get(this.recoveryBlockchainExplorerUrl(`/tx/${faultyTxId}`))) as unknown as {
      body: LitecointoolsTx & ExplorerTxInfo;
    };
    const faultyTxInfo: LitecointoolsTx & ExplorerTxInfo = res.body;

    faultyTxInfo.input = faultyTxInfo.vin as any;
    faultyTxInfo.outputs = faultyTxInfo.vout as any;

    faultyTxInfo.input.forEach(function processTxInput(input: any) {
      input.address = input.addr;
    });
    faultyTxInfo.outputs.forEach(function processTxOutputs(output: any) {
      output.address = output.scriptPubKey.addresses[0];
    });
    return faultyTxInfo as ExplorerTxInfo;
  }

  /**
   * Fetch unspent transaction outputs using litecoin explorer
   * @param addresses
   * @returns {{id: string, address: string, value: number, valueString: string, blockHeight: number}}
   */
  async getUnspentInfoForCrossChainRecovery(addresses: string[]): Promise<PublicUnspent[]> {
    addresses = addresses.map((address) => this.canonicalAddress(address, 2));

    const unspents = await toBitgoRequest(
      request.get(this.recoveryBlockchainExplorerUrl(`/addrs/${_.uniq(addresses).join(',')}/utxo`))
    ).result();

    if (!unspents) {
      return [];
    }

    return (unspents as LitecointoolsUnspent[]).map((unspent): PublicUnspent => {
      return {
        id: `${unspent.txid}:${unspent.vout}`,
        address: unspent.address,
        value: unspent.satoshis,
        valueString: unspent.satoshis.toString(),
        blockHeight: unspent.height,
      };
    });
  }
}
