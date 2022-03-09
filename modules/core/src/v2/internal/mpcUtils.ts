/**
 * @prettier
 */

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
   * @param params.enterprise - optional enterprise id that will be attached to the BitGo Keychain
   * @param params.originalPasscodeEncryptionCode - optional encryption code used to reset the user's password, if absent, password recovery will not work
   */
  abstract createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet>;
}
