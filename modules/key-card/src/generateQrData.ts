import { BaseCoin } from '@bitgo/statics';
import { Keychain } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';
import * as assert from 'assert';
import { GenerateQrDataParams, MasterPublicKeyQrDataEntry, QrData, QrDataEntry } from './types';

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
  if (userKeychain.reducedEncryptedPrv) {
    return {
      title: 'A: User Key',
      description: 'This is your private key, encrypted with your wallet password.',
      data: userKeychain.reducedEncryptedPrv,
    };
  }
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
  if (backupKeychain.reducedEncryptedPrv) {
    return {
      title,
      description: 'This is your backup private key, encrypted with your wallet password.',
      data: backupKeychain.reducedEncryptedPrv,
    };
  }
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

function generateUserMasterPublicKeyQRData(publicKey: string): MasterPublicKeyQrDataEntry {
  return {
    title: 'E: Master User Public Key',
    description:
      'This is the public key used to derive the user key for the wallet. This is not stored by BitGo, and may be required for use in recovery scenarios.',
    data: publicKey,
  };
}

function generateBackupMasterPublicKeyQRData(publicKey: string): MasterPublicKeyQrDataEntry {
  return {
    title: 'F: Master Backup Public Key',
    description:
      'This is the public key used to derive the backup key for the wallet. This is not stored by BitGo, and may be required for use in recovery scenarios.',
    data: publicKey,
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
  userMasterPublicKey,
  backupMasterPublicKey,
}: GenerateQrDataParams): QrData {
  const qrData: QrData = {
    user: generateUserQrData(userKeychain, userMasterKey),
    userMasterPublicKey: userMasterPublicKey ? generateUserMasterPublicKeyQRData(userMasterPublicKey) : undefined,
    backup: generateBackupQrData(coin, backupKeychain, {
      backupKeyProvider,
      backupMasterKey,
    }),
    backupMasterPublicKey: backupMasterPublicKey
      ? generateBackupMasterPublicKeyQRData(backupMasterPublicKey)
      : undefined,
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
