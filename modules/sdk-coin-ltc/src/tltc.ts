import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { Ltc } from './ltc';

export class Tltc extends Ltc {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('1aca32c8-a3e5-42eb-82df-4c263d8bfc68');
  constructor(bitgo: BitGoBase) {
    super(bitgo, utxolib.networks.litecoinTest);
    this.altScriptHash = utxolib.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tltc(bitgo);
  }
}
