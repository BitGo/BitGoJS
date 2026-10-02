import { EncryptionVersion, Keychain, KeychainsTriplet } from '@bitgo/sdk-core';
import { BaseCoin, KeyCurve } from '@bitgo/statics';
import type { SafeKeycardRoots, SafeRootKeyType } from '@bitgo/sdk-lib-safes';

// Moved to sdk-lib-safes; re-exported so existing imports from @bitgo/key-card keep working.
export type { SafeKeycardRoots, SafeRootKeyType };

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

export interface GenerateQrDataCoinParams {
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
  /** @deprecated Ignored because Box D uses a high-entropy key. */
  encryptionVersion?: EncryptionVersion;
}

export interface GenerateQrDataParams extends GenerateQrDataCoinParams {
  // The backup keychain as it is returned from the BitGo API upon creation
  backupKeychain: Keychain;
  // The name of the 3rd party provider of the backup key if neither the user nor BitGo stores it
  backupKeyProvider?: string;
  // The key id of the backup key, only used for cold keys
  backupMasterKey?: string;
  /**
   * @description The key used to derive the backup key using {@link backupMasterKey} as the seed.
   */
  backupMasterPublicKey?: string;
  // The BitGo keychain as it is returned from the BitGo API upon creation
  bitgoKeychain: Keychain;
  // The user keychain as it is returned from the BitGo API upon creation
  userKeychain: Keychain;
  // The key id of the user key, only used for cold keys
  userMasterKey?: string;
  /**
   * @description The key used to derive the user key using {@link userMasterKey} as the seed.
   */
  userMasterPublicKey?: string;
}

export interface GenerateLightningQrDataParams extends GenerateQrDataCoinParams {
  // The user authentication keychain, used to sign payment requests and wallet configuration updates
  userAuthKeychain: Keychain;
}

const slotsInRenderOrder = {
  secp256k1Multisig: true,
  ecdsaMpc: true,
  eddsaMpc: true,
  ed25519Multisig: true,
} satisfies Record<SafeRootKeyType, true>;

/**
 * Fixed render/scan order of the four roots on the safe keycard. Kept stable so a
 * generated keycard and a re-scanned one line up slot-for-slot.
 */
export const SAFE_ROOT_ORDER = Object.keys(slotsInRenderOrder) as SafeRootKeyType[];

/** The product a keycard belongs to, used for user-facing wording (e.g. Box D copy). */
export type KeycardEntity = 'wallet' | 'safe';

export interface GenerateSafeQrDataParams extends GenerateQrDataCoinParams {
  // The four root triplets (user/backup/bitgo keychains), keyed by rootKeyType.
  roots: Record<SafeRootKeyType, KeychainsTriplet>;
}

export type GenerateKeycardParams = GenerateQrDataBaseParams &
  (GenerateQrDataForKeychainParams | GenerateQrDataParams | GenerateLightningQrDataParams);

export interface IDrawKeyCard {
  activationCode?: string;
  keyCardImage?: HTMLImageElement;
  qrData: QrData;
  questions: FAQ[];
  walletLabel?: string;
  curve?: KeyCurve;
  // Box indices to start a new page before. Omit for the default wallet layout.
  pageBreakBeforeIndices?: number[];
  // When true, a split key's QR fragments are prefixed with a "<index>/<total>|" part header
  // so a scanner can reassemble them. Opt-in (used by the safe keycard); omit to leave QR
  // payloads as raw fragments, keeping the wallet keycard output unchanged.
  useQrPartHeaders?: boolean;
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

export type MasterPublicKeyQrDataEntry = Omit<QrDataEntry, 'publicMasterKey'>;

export interface QrData {
  backup?: QrDataEntry;
  backupMasterPublicKey?: MasterPublicKeyQrDataEntry;
  bitgo?: QrDataEntry;
  passcode?: QrDataEntry;
  curve?: KeyCurve;
  user: QrDataEntry;
  userMasterPublicKey?: MasterPublicKeyQrDataEntry;
}
