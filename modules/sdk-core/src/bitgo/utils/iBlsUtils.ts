import { SerializedKeyPair } from 'openpgp';
import { IBlsKeyPair, KeychainsTriplet, Keychain } from '../../index';

export interface IBlsUtils {
  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string
  ): Promise<Keychain>;
  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain>;
  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: IBlsKeyPair,
    backupKeyShare: IBlsKeyPair,
    enterprise: string
  ): Promise<Keychain>;
  createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
  }): Promise<KeychainsTriplet>;
}
