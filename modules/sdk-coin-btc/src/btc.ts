import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo-beta/abstract-utxo';
import {
  BitGoBase,
  BaseCoin,
  VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions,
  Wallet,
} from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';
import { InscriptionBuilder } from './inscriptionBuilder';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string;
}

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Btc(bitgo);
  }

  supportsLightning(): boolean {
    return true;
  }

  getInscriptionBuilder(wallet: Wallet): InscriptionBuilder {
    return new InscriptionBuilder(wallet, this);
  }
}
