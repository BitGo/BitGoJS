import {
  BitGoBase,
  VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions,
  Wallet,
} from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { UtxoCoinName } from '../../names';

import { InscriptionBuilder } from './inscriptionBuilder';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string;
}

export class Btc extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'btc';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
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
