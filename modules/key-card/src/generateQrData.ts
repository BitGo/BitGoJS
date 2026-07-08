import { BaseCoin } from '@bitgo/statics';
import { Keychain, KeychainsTriplet } from '@bitgo/sdk-core';
import { encrypt } from '@bitgo/sdk-api';
import * as assert from 'assert';
import {
  GenerateLightningQrDataParams,
  GenerateQrDataParams,
  GenerateVaultQrDataParams,
  MasterPublicKeyQrDataEntry,
  QrData,
  QrDataEntry,
  VaultKeycardRoots,
  VaultRootKeyType,
  VAULT_ROOT_ORDER,
} from './types';

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
  assert.ok(pub);

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
    assert.ok(keyShares?.length === 2);
    return {
      title: 'B: Backup Key Shares',
      description:
        `These are the key shares for ${backupKeyProvider}. If BitGo Inc. goes out of business,\r\n` +
        `contact ${backupKeyProvider} and they will help you recover your funds.`,
      data: JSON.stringify(keyShares),
    };
  }

  const pub = getPubFromKey(backupKeychain);
  assert.ok(pub);

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
  assert.ok(bitgoData);

  return {
    title: 'C: BitGo Key',
    description: 'This is the public part of the key held by BitGo.',
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

async function generatePasscodeQrData(
  passphrase: string,
  passcodeEncryptionCode: string,
  encryptionVersion?: 1 | 2
): Promise<QrDataEntry> {
  const encryptedWalletPasscode = await encrypt(passcodeEncryptionCode, passphrase, { encryptionVersion });
  return {
    title: 'D: Encrypted Wallet Password',
    description: 'This is the wallet password, encrypted client-side with a key held by BitGo.',
    data: encryptedWalletPasscode,
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

function buildWalletQrData({
  backupKeychain,
  backupKeyProvider,
  backupMasterKey,
  bitgoKeychain,
  coin,
  userKeychain,
  userMasterKey,
  userMasterPublicKey,
  backupMasterPublicKey,
}: GenerateQrDataParams): QrData {
  return {
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
}

function buildLightningQrData({ userAuthKeychain }: GenerateLightningQrDataParams): QrData {
  assert.ok(userAuthKeychain.encryptedPrv, 'userAuthKeychain must have an encryptedPrv');

  return {
    user: {
      title: 'A: User Auth Key',
      description:
        'This is your user authentication private key, encrypted with your wallet password.\r\nIt is used to authenticate payment and wallet operations.',
      data: userAuthKeychain.encryptedPrv,
    },
  };
}

export async function generateQrData(params: GenerateQrDataParams): Promise<QrData> {
  const qrData = buildWalletQrData(params);

  if (params.passphrase && params.passcodeEncryptionCode) {
    qrData.passcode = await generatePasscodeQrData(
      params.passphrase,
      params.passcodeEncryptionCode,
      params.encryptionVersion
    );
  }

  return qrData;
}

export async function generateLightningQrData(params: GenerateLightningQrDataParams): Promise<QrData> {
  const qrData = buildLightningQrData(params);

  if (params.passphrase && params.passcodeEncryptionCode) {
    qrData.passcode = await generatePasscodeQrData(
      params.passphrase,
      params.passcodeEncryptionCode,
      params.encryptionVersion
    );
  }

  return qrData;
}

function selectRootPrivateKey(keychain: Keychain, slot: VaultRootKeyType, role: 'user' | 'backup'): string {
  // Prefer the compact MPCv2 reduced share; fall back to encryptedPrv (e.g. multisig roots).
  const data = keychain.reducedEncryptedPrv ?? keychain.encryptedPrv;
  assert.ok(data, `Vault ${role} root ${slot} is missing encrypted private key material`);
  return data;
}

function selectRootPublicKey(keychain: Keychain, slot: VaultRootKeyType): string {
  const pub = getPubFromKey(keychain);
  assert.ok(pub, `Vault BitGo root ${slot} is missing a public key`);
  return pub;
}

/**
 * Serializes one box's four roots into a single JSON object keyed by rootKeyType, e.g.
 * `{"secp256k1Multisig":"<encPrv>","ecdsaMpc":"<reducedEncPrv>",...}`. This keeps the vault
 * keycard on the existing 4-box layout — one box (= one QR/data block) per role — with the
 * four roots packed into each box's data. `splitKeys` fragments the box if it exceeds the QR
 * threshold, exactly as for a normal wallet keycard. Reversed by {@link parseVaultKeycardBox}.
 */
function buildVaultBoxData(
  roots: Record<VaultRootKeyType, KeychainsTriplet>,
  select: (root: KeychainsTriplet, slot: VaultRootKeyType) => string
): string {
  const box: VaultKeycardRoots = {} as VaultKeycardRoots;
  for (const slot of VAULT_ROOT_ORDER) {
    const root = roots[slot];
    assert.ok(root, `Vault is missing the ${slot} root`);
    box[slot] = select(root, slot);
  }
  return JSON.stringify(box);
}

/**
 * Builds vault keycard QR data in the existing wallet {@link QrData} shape: boxes A (user),
 * B (backup), C (BitGo), D (passcode). Each of A/B/C carries a JSON object of the four roots,
 * so the vault renders and parses through the same {@link drawKeycard} path as a wallet.
 */
export async function generateVaultQrData(params: GenerateVaultQrDataParams): Promise<QrData> {
  const { roots } = params;
  const qrData: QrData = {
    user: {
      title: 'A: User Key',
      description: 'Your 4 root private keys, encrypted with your wallet password.',
      data: buildVaultBoxData(roots, (root, slot) => selectRootPrivateKey(root.userKeychain, slot, 'user')),
    },
    backup: {
      title: 'B: Backup Key',
      description: 'Your 4 root backup keys, encrypted with your wallet password.',
      data: buildVaultBoxData(roots, (root, slot) => selectRootPrivateKey(root.backupKeychain, slot, 'backup')),
    },
    bitgo: {
      title: 'C: BitGo Key',
      description: 'The public parts of the 4 root keys held by BitGo.',
      data: buildVaultBoxData(roots, (root, slot) => selectRootPublicKey(root.bitgoKeychain, slot)),
    },
  };

  if (params.passphrase && params.passcodeEncryptionCode) {
    qrData.passcode = await generatePasscodeQrData(
      params.passphrase,
      params.passcodeEncryptionCode,
      params.encryptionVersion
    );
  }

  return qrData;
}
