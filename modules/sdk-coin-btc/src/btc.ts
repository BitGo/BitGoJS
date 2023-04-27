import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import {
  BitGoBase,
  BaseCoin,
  VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';
import { InscriptionBuilder } from './inscriptionBuilder';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string;
}

export class Btc extends AbstractUtxoCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('5c1691c5-c9cc-49ed-abe0-c433dab2edaa');
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Btc(bitgo);
  }

  getId(): string {
    return this._staticsCoin.id;
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  supportsBlockTarget(): boolean {
    return true;
  }

  supportsLightning(): boolean {
    return true;
  }

  getInscriptionBuilder(wallet: Wallet): InscriptionBuilder {
    return new InscriptionBuilder(wallet, this);
  }
}
