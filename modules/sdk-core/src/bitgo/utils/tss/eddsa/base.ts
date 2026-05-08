import * as bs58 from 'bs58';
import { IBaseCoin } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { KeyShare } from './types';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';

export class BaseEddsaUtils extends baseTSSUtils<KeyShare> {
  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  /**
   * Get the commonPub portion of an EdDSA commonKeychain.
   *
   * Keychains are 128 hex chars: 32-byte public key + 32-byte chaincode.
   *
   * @param {string} commonKeychain
   * @returns {string} base58-encoded public key
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 128) {
      throw new Error(`Invalid commonKeychain length, expected 128, got ${commonKeychain.length}`);
    }
    const pubHex = commonKeychain.slice(0, 64);
    return bs58.encode(Buffer.from(pubHex, 'hex'));
  }
}
