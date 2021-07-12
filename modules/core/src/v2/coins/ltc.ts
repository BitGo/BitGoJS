import * as utxolib from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
import * as request from 'superagent';

import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import { BitGo } from '../../bitgo';
import * as common from '../../common';
import { InvalidAddressError } from '../../errors';

export class Ltc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.litecoin);
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = this.getCoinLibrary().networks.bitcoin.scriptHash;
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
      this.getCoinLibrary().address.fromBech32(address);
      // address may be all uppercase, but canonical bech32 addresses are all lowercase
      return address.toLowerCase();
    } catch (e) {
      // not a valid bech32, try to decode as base58
    }

    const addressDetails = this.getCoinLibrary().address.fromBase58Check(address);
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
      2: this.network.scriptHash
    };
    const newScriptHash = scriptHashMap[scriptHashVersion];
    return this.getCoinLibrary().address.toBase58Check(addressDetails.hash, newScriptHash);
  }

  calculateRecoveryAddress(scriptHashScript: Buffer): string {
    const bitgoAddress = this.getCoinLibrary().address.fromOutputScript(scriptHashScript, this.network);
    const blockrAddress = this.canonicalAddress(bitgoAddress, 1);
    return blockrAddress;
  }

  recoveryBlockchainExplorerUrl(url: string): string {
    return common.Environments[this.bitgo.env].ltcExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<any> {
    return co(function *getAddressInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}`)).result();

      (addrInfo as any).txCount = (addrInfo as any).txApperances;
      (addrInfo as any).totalBalance = (addrInfo as any).balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    return co(function *getUnspentInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}/utxo`)).result();

      (unspents as any).forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }

  getTxInfoFromExplorer(faultyTxId: string): any {
    return co(function *getTxInfoFromExplorer() {
      const res = (yield request.get(this.recoveryBlockchainExplorerUrl(`/tx/${faultyTxId}`))) as any;
      const faultyTxInfo = res.body;

      faultyTxInfo.input = faultyTxInfo.vin;
      faultyTxInfo.outputs = faultyTxInfo.vout;

      (faultyTxInfo.input as any).forEach(function processTxInput(input) {
        input.address = input.addr;
      });
      (faultyTxInfo.outputs as any).forEach(function processTxOutputs(output) {
        output.address = output.scriptPubKey.addresses[0];
      });
      return faultyTxInfo;
    }).call(this);
  }
}
