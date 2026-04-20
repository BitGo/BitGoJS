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
   * MPCv1 keychains are 128 hex chars (32-byte public key + 32-byte chaincode).
   * MPCv2 keychains are 64 hex chars (32-byte public key only — no chaincode).
   *
   * @param {string} commonKeychain
   * @returns {string} base58-encoded public key
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 64 && commonKeychain.length !== 128) {
      throw new Error(
        `Invalid commonKeychain length, expected 64 (MPCv2) or 128 (MPCv1), got ${commonKeychain.length}`
      );
    }
    // For MPCv1 (128 chars): the first 64 hex chars are the 32-byte public key.
    // For MPCv2 (64 chars): the entire string is the 32-byte public key.
    const pubHex = commonKeychain.slice(0, 64);
    return bs58.encode(Buffer.from(pubHex, 'hex'));
  }
}
