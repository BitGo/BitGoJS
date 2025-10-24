import {
  BitGoBase,
  VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, UtxoNetwork } from '../../abstractUtxoCoin';

import { InscriptionBuilder } from './inscriptionBuilder';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string;
}

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: BitGoBase, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGoBase): Btc {
    return new Btc(bitgo);
  }

  supportsLightning(): boolean {
    return true;
  }

  getInscriptionBuilder(wallet: Wallet): InscriptionBuilder {
    return new InscriptionBuilder(wallet, this);
  }
}
