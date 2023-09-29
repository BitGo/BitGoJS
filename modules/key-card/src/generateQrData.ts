import { BaseCoin, KeyCurve } from '@bitgo/statics';
import { Keychain } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';
import * as assert from 'assert';

export interface GenerateQrDataParams {
  // The backup keychain as it is returned from the BitGo API upon creation
  backupKeychain?: Keychain;
  // The name of the 3rd party provider of the backup key if neither the user nor BitGo stores it
  backupKeyProvider?: string;
  // The key id of the backup key, only used for cold keys
  backupMasterKey?: string;
  // The BitGo keychain as it is returned from the BitGo API upon creation
  bitgoKeychain: Keychain;
  // The coin of the wallet that was/ is about to be created
  coin?: Readonly<BaseCoin>;
  // A code that can be used to encrypt the wallet password to.
  // If both the passphrase and passcodeEncryptionCode are passed, then this code encrypts the passphrase with the
  // passcodeEncryptionCode and puts the result into Box D. Allows recoveries of the wallet password.
  passcodeEncryptionCode?: string;
  // The wallet password
  // If both the passphrase and passcodeEncryptionCode are passed, then this code encrypts the passphrase with the
  // passcodeEncryptionCode and puts the result into Box D. Allows recoveries of the wallet password.
  passphrase?: string;
  // The user keychain as it is returned from the BitGo API upon creation
  userKeychain?: Keychain;
  // The key id of the user key, only used for cold keys
  userMasterKey?: string;
  // The curve used for the key
  curve?: KeyCurve;
}

interface QrDataEntry {
  data: string;
  description: string;
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
      description: 'This is your private key, encrypted with your wallet password.',
      data: userKeychain.encryptedPrv,
    };
  }

  const pub = getPubFromKey(userKeychain);
  assert(pub);

  return {
    title: 'A: Provided User Key',
    description: 'This is the public key you provided for your wallet.',
    data: pub,
    publicMasterKey: userMasterKey,
  };
}

function generateBackupQrData(
  coin: Readonly<BaseCoin>,
  backupKeychain: Keychain,
  {
    backupKeyProvider,
    backupMasterKey,
  }: {
    backupKeyProvider?: string;
    backupMasterKey?: string;
  } = {}
): QrDataEntry {
  const title = 'B: Backup Key';
  if (backupKeychain.encryptedPrv) {
    return {
      title,
      description: 'This is your backup private key, encrypted with your wallet password.',
      data: backupKeychain.encryptedPrv,
    };
  }

  if (backupKeyProvider === 'BitGo Trust' && backupKeychain.type === 'tss') {
    const keyShares = backupKeychain.keyShares?.filter((keyShare) => keyShare.to === 'backup');
    assert(keyShares?.length === 2);
    return {
      title: 'B: Backup Key Shares',
      description:
        `These are the key shares for ${backupKeyProvider}. If BitGo Inc. goes out of business,\r\n` +
        `contact ${backupKeyProvider} and they will help you recover your funds.`,
      data: JSON.stringify(keyShares),
    };
  }

  const pub = getPubFromKey(backupKeychain);
  assert(pub);

  if (backupKeyProvider) {
    return {
      title: 'B: Backup Key',
      description:
        `This is the public key held at ${backupKeyProvider}, an ${coin.name} recovery service. ` +
        `If you lose\r\nyour key, ${backupKeyProvider} will be able to sign transactions to recover funds.`,
      data: pub,
    };
  }

  return {
    title: 'B: Provided Backup Key',
    description: 'This is the public key you provided for your wallet.',
    data: pub,
    publicMasterKey: backupMasterKey,
  };
}

function generateBitGoQrData(bitgoKeychain: Keychain): QrDataEntry {
  const bitgoData = getPubFromKey(bitgoKeychain);
  assert(bitgoData);

  return {
    title: 'C: BitGo Public Key',
    description:
      'This is the public part of the key that BitGo will use to ' + 'co-sign transactions\r\nwith you on your wallet.',
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
  assert(userKeychain, 'userKeychain is required');
  assert(backupKeychain, 'backupKeychain is required');
  assert(coin, 'coin is required');
  const qrData: QrData = {
    user: generateUserQrData(userKeychain, userMasterKey),
    backup: generateBackupQrData(coin, backupKeychain, {
      backupKeyProvider,
      backupMasterKey,
    }),
    bitgo: generateBitGoQrData(bitgoKeychain),
  };

  if (passphrase && passcodeEncryptionCode) {
    const encryptedWalletPasscode = encrypt(passcodeEncryptionCode, passphrase);

    qrData.passcode = {
      title: 'D: Encrypted wallet Password',
      description: 'This is the wallet password, encrypted client-side with a key held by BitGo.',
      data: encryptedWalletPasscode,
    };
  }

  return qrData;
}
