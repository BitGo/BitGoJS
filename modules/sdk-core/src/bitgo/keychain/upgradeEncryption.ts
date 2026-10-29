import { BitGoBase } from '../bitgoBase';

/**
 * Whether a signing call should upgrade the stored encryption of your user key to the latest format.
 * A per-call `upgradeEncryption` wins; otherwise the `upgradeEncryptionOnSign` constructor setting applies.
 *
 * @param bitgo - the BitGo instance the signing call runs on
 * @param upgradeEncryption - the signing call's `upgradeEncryption` option, if any
 */
export function shouldUpgradeEncryption(
  bitgo: Pick<BitGoBase, 'isUpgradeEncryptionOnSignEnabled'>,
  upgradeEncryption?: boolean
): boolean {
  return upgradeEncryption ?? bitgo.isUpgradeEncryptionOnSignEnabled();
}
