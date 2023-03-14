import { AbstractUtxoCoin, UtxoNetwork } from '@bitgo/abstract-utxo';
import {
  BitGoBase,
  BaseCoin,
  VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
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

  getChain(): string {
    return 'btc';
  }

  getFamily(): string {
    return 'btc';
  }

  getFullName(): string {
    return 'Bitcoin';
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
