/**
 * Testnet TRX - Shasta network
 *
 * @format
 */
import { BaseCoin } from '../baseCoin';
import { Trx } from './trx';

export class Ttrx extends Trx {
  protected constructor(bitgo: any) {
    super(bitgo);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Ttrx(bitgo);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'ttrx';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    // shasta is the most popular testnet for tron - more info can be found here: https://www.trongrid.io/shasta
    return 'Testnet Tron';
  }
}
