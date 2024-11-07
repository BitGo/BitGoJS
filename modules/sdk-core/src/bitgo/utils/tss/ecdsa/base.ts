import * as openpgp from 'openpgp';
import { ec } from 'elliptic';

import { IBaseCoin } from '../../../baseCoin';
import baseTSSUtils from '../baseTSSUtils';
import { KeyShare } from './types';
import { BackupGpgKey } from '../baseTypes';
import { generateGPGKeyPair, getBitgoGpgPubKey, getTrustGpgPubKey } from '../../opengpgUtils';
import { BitGoBase } from '../../../bitgoBase';
import { IWallet } from '../../../wallet';

/** @inheritdoc */
export class BaseEcdsaUtils extends baseTSSUtils<KeyShare> {
  // We do not have full support for 3-party verification (w/ external source) of key shares and signature shares. There is no 3rd party key service support with this release.
  protected bitgoPublicGpgKey: openpgp.Key;
  protected bitgoMPCv2PublicGpgKey: openpgp.Key | undefined;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, wallet?: IWallet) {
    super(bitgo, baseCoin, wallet);
    this.setBitgoGpgPubKey(bitgo);
  }

  private async setBitgoGpgPubKey(bitgo) {
    const { mpcV1, mpcV2 } = await getBitgoGpgPubKey(bitgo);
    this.bitgoPublicGpgKey = mpcV1;
    this.bitgoMPCv2PublicGpgKey = mpcV2;
  }

  async getBitgoPublicGpgKey(): Promise<openpgp.Key> {
    if (!this.bitgoPublicGpgKey) {
      // retry getting bitgo's gpg key
      await this.setBitgoGpgPubKey(this.bitgo);
      if (!this.bitgoPublicGpgKey) {
        throw new Error("Failed to get Bitgo's gpg key");
      }
    }

    return this.bitgoPublicGpgKey;
  }

  /**
   * Gets backup pub gpg key string
   * if a third party provided then get from trust
   * @param isThirdPartyBackup
   */
  async getBackupGpgPubKey(isThirdPartyBackup = false): Promise<BackupGpgKey> {
    return isThirdPartyBackup ? getTrustGpgPubKey(this.bitgo) : generateGPGKeyPair('secp256k1');
  }

  /**
   * util function that checks that a commonKeychain is valid and can ultimately resolve to a valid public key
   * @param commonKeychain - a user uploaded commonKeychain string
   * @throws if the commonKeychain is invalid length or invalid format
   */

  static validateCommonKeychainPublicKey(commonKeychain: string) {
    const pub = BaseEcdsaUtils.getPublicKeyFromCommonKeychain(commonKeychain);
    const secp256k1 = new ec('secp256k1');
    const key = secp256k1.keyFromPublic(pub, 'hex');
    return key.getPublic().encode('hex', false).slice(2);
  }

  /**
   * Gets the common public key from commonKeychain.
   *
   * @param {String} commonKeychain common key chain between n parties
   * @returns {string} encoded public key
   */
  static getPublicKeyFromCommonKeychain(commonKeychain: string): string {
    if (commonKeychain.length !== 130) {
      throw new Error(`Invalid commonKeychain length, expected 130, got ${commonKeychain.length}`);
    }
    const commonPubHexStr = commonKeychain.slice(0, 66);
    return commonPubHexStr;
  }
}
