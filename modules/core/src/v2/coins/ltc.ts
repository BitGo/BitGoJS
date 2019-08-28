import { BitGo } from '../../bitgo';
import { InvalidAddressError } from '../../errors';
import { AbstractUtxoCoin } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import * as Bluebird from 'bluebird';
import * as common from '../../common';
import * as request from 'superagent';
const co = Bluebird.coroutine;

export class Ltc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super(bitgo, network || {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      bech32: 'ltc',
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
      coin: 'ltc',
    });
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
  canonicalAddress(address: string, scriptHashVersion: number = 2): string {
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

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    return co(function *getUnspentInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}
