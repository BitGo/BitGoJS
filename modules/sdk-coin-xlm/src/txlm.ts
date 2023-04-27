import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Xlm } from './xlm';
import { Networks } from 'stellar-sdk';
const stellar = require('stellar-sdk');

export class Txlm extends Xlm {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('dea5261e-dbe1-4870-b1db-5db9ed0ce63d');
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Txlm(bitgo);
  }

  protected getStellarNetwork(): Networks {
    return stellar.Networks.TESTNET;
  }

  getHorizonUrl(): string {
    return 'https://horizon-testnet.stellar.org';
  }
}
