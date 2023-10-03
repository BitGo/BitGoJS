import { Keychain } from '@bitgo/sdk-core';
import { BaseCoin, KeyCurve } from '@bitgo/statics';

export interface GenerateQrDataBaseParams {
  activationCode?: string;
  keyCardImage?: HTMLImageElement;
  walletLabel: string;
}

export interface GenerateQrDataForKeychainParams {
  // The BitGo keychain as it is returned from the BitGo API upon creation
  bitgoKeychain: Keychain;
  // The curve used for the key
  curve: KeyCurve;
}

export interface GenerateQrDataParams {
  // The backup keychain as it is returned from the BitGo API upon creation
  backupKeychain: Keychain;
  // The name of the 3rd party provider of the backup key if neither the user nor BitGo stores it
  backupKeyProvider?: string;
  // The key id of the backup key, only used for cold keys
  backupMasterKey?: string;
  // The BitGo keychain as it is returned from the BitGo API upon creation
  bitgoKeychain: Keychain;
  // The coin of the wallet that was/ is about to be created
  coin: Readonly<BaseCoin>;
  // A code that can be used to encrypt the wallet password to.
  // If both the passphrase and passcodeEncryptionCode are passed, then this code encrypts the passphrase with the
  // passcodeEncryptionCode and puts the result into Box D. Allows recoveries of the wallet password.
  passcodeEncryptionCode?: string;
  // The wallet password
  // If both the passphrase and passcodeEncryptionCode are passed, then this code encrypts the passphrase with the
  // passcodeEncryptionCode and puts the result into Box D. Allows recoveries of the wallet password.
  passphrase?: string;
  // The user keychain as it is returned from the BitGo API upon creation
  userKeychain: Keychain;
  // The key id of the user key, only used for cold keys
  userMasterKey?: string;
}

export type GenerateKeycardParams = GenerateQrDataBaseParams & (GenerateQrDataForKeychainParams | GenerateQrDataParams);

export interface IDrawKeyCard {
  activationCode?: string;
  keyCardImage?: HTMLImageElement;
  qrData: QrData;
  questions: FAQ[];
  walletLabel: string;
  curve?: KeyCurve;
}

export interface FAQ {
  question: string;
  // the answer to the question, already split into individual lines of text
  answer: string[];
}

export interface QrDataEntry {
  data: string;
  description: string;
  title: string;
  publicMasterKey?: string;
}

export interface QrData {
  backup?: QrDataEntry;
  bitgo?: QrDataEntry;
  passcode?: QrDataEntry;
  curve?: KeyCurve;
  user: QrDataEntry;
}
