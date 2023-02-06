import { BaseCoin } from '@bitgo/statics';
import { Keychain } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';
import * as assert from 'assert';

export interface GenerateQrDataParams {
  // The backup keychain as it is returned from the BitGo API upon creation
  backupKeychain: Keychain,
  // The 3rd party provider of the backup key if neither the user nor BitGo stores it
  backupKeyProvider?: string;
  // The key id of the backup key, only used for cold keys
  backupMasterKey?: string;
  // The BitGo keychain as it is returned from the BitGo API upon creation
  bitgoKeychain: Keychain,
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

interface QrDataEntry {
  data: string;
  description: string;
  image: string;
  title: string;
  publicMasterKey?: string;
}

export interface QrData {
  backup?: QrDataEntry;
  bitgo?: QrDataEntry;
  passcode?: QrDataEntry;
  user: QrDataEntry;
}

function getPubFromKey(key: Keychain): string | undefined {
  switch (key.type) {
    case 'blsdkg':
      return key.commonPub;
    case 'tss':
      return key.commonKeychain;
    case 'independent':
      return key.pub;
  }
}

function generateUserQrData(userKeychain: Keychain, userMasterKey?: string): QrDataEntry {
  if (userKeychain.encryptedPrv) {
    return {
      title: 'A: User Key',
      image: '.qrEncryptedUserKey',
      description: 'This is your private key, encrypted with your wallet password.',
      data: userKeychain.encryptedPrv,
    };
  }

  const pub = getPubFromKey(userKeychain);
  assert(pub);

  return {
    title: 'A: Provided User Key',
    image: '.qrPublicUserKey',
    description: 'This is the public key you provided for your wallet.',
    data: pub,
    publicMasterKey: userMasterKey,
  };
}

function generateBackupQrData(coin: Readonly<BaseCoin>, backupKeychain: Keychain, {
  backupKeyProvider,
  backupMasterKey,
}: {
  backupKeyProvider?: string;
  backupMasterKey?: string;
} = {}): QrDataEntry {
  const title = 'B: Backup Key';
  if (backupKeychain.encryptedPrv) {
    return {
      title,
      image: '.qrEncryptedBackupKey',
      description: 'This is your backup private key, encrypted with your wallet password.',
      data: backupKeychain.encryptedPrv,
    };
  }

  if (backupKeyProvider === 'BitGo Trust' && backupKeychain.type === 'tss') {
    const userToBackupShare = backupKeychain.keyShares?.find((keyShare) => keyShare.from === 'user' && keyShare.to === 'backup');
    assert(userToBackupShare);
    return {
      title: 'B: User To Backup Key Share',
      image: '.qrUserToBackupKeyShare',
      description: `This is the key share from you for ${backupKeyProvider}. If BitGo Inc goes out of business,` +
        `\r\ncontact ${backupKeyProvider} and they will help you recover your funds.`,
      data: JSON.stringify(userToBackupShare),
    };
  }

  const pub = getPubFromKey(backupKeychain);
  assert(pub);

  if (backupKeyProvider) {
    return {
      title: 'B: Backup Key',
      image: '.qrPublicBackupKey',
      description: `This is the public key held at ${backupKeyProvider}, an ${coin.name} recovery service. ` +
        `If you lose\r\nyour key, ${backupKeyProvider} will be able to sign transactions to recover funds.`,
      data: pub,
    };
  }

  return {
    title: 'B: Provided Backup Key',
    image: '.qrEncryptedUserProvidedXpub',
    description: 'This is the public key you provided for your wallet.',
    data: pub,
    publicMasterKey: backupMasterKey,
  };
}

function generateBitGoQrData(bitgoKeychain: Keychain, {
  backupKeychain,
  backupKeyProvider,
}: {
  backupKeychain?: Keychain,
  backupKeyProvider?: string;
}): QrDataEntry {
  if (backupKeyProvider === 'BitGo Trust' && backupKeychain?.type === 'tss') {
    const bitgoToBackupShare = backupKeychain.keyShares?.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    assert(bitgoToBackupShare);
    return {
      title: 'C: BitGo To Backup Key Share',
      image: '.qrBitGoToBackupKeyShare',
      description: `This is the key share from BitGo Inc for ${backupKeyProvider}. If BitGo Inc goes out of business,` +
        `\r\ncontact ${backupKeyProvider} and they will help you recover your funds.`,
      data: JSON.stringify(bitgoToBackupShare),
    };
  }

  const bitgoData = getPubFromKey(bitgoKeychain);
  assert(bitgoData);

  return {
    title: 'C: BitGo Public Key',
    image: '.qrBitgoKey',
    description:
      'This is the public part of the key that BitGo will use to ' +
      'co-sign transactions\r\nwith you on your wallet.',
    data: bitgoData,
  };
}

export function generateQrData({
  backupKeychain,
  backupKeyProvider,
  backupMasterKey,
  bitgoKeychain,
  coin,
  passcodeEncryptionCode,
  passphrase,
  userKeychain,
  userMasterKey,
}: GenerateQrDataParams): QrData {
  const qrData: QrData = {
    user: generateUserQrData(userKeychain, userMasterKey),
    backup: generateBackupQrData(coin, backupKeychain, {
      backupKeyProvider,
      backupMasterKey,
    }),
    bitgo: generateBitGoQrData(bitgoKeychain, {
      backupKeychain,
      backupKeyProvider,
    }),
  };

  if (passphrase && passcodeEncryptionCode) {
    const encryptedWalletPasscode = encrypt(passcodeEncryptionCode, passphrase);

    qrData.passcode = {
      title: 'D: Encrypted wallet Password',
      image: '.qrEncryptedWalletPasscode',
      description: 'This is the wallet password, encrypted client-side with a key held by\r\nBitGo.',
      data: encryptedWalletPasscode,
    };
  }

  return qrData;
}
