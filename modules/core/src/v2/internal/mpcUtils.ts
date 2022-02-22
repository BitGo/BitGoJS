import { BitGo } from '../../bitgo';
import { BaseCoin, KeychainsTriplet } from '../baseCoin';

export abstract class MpcUtils {
  protected bitgo: BitGo;
  protected baseCoin: BaseCoin;

  constructor(bitgo: BitGo, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Creates User, Backup, and BitGo MPC Keychains.
   *
   * @param params.passphrase - passphrase used to encrypt signing materials created for User and Backup
   */
  abstract createKeychains(params: { passphrase: string }): Promise<KeychainsTriplet>;
}
