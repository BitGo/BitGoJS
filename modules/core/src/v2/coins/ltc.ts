/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import { BitGo } from '../../bitgo';
import { InvalidAddressError } from '../../errors';

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
}
