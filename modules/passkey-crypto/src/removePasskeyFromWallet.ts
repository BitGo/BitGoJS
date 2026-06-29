import { BitGoBase, decryptKeychainPrivateKeyAsync } from '@bitgo/sdk-core';
import { WebAuthnOtpDevice } from './webAuthnTypes';

export async function removePasskeyFromWallet(params: {
  bitgo: BitGoBase;
  coin: string;
  walletId: string;
  device: WebAuthnOtpDevice;
  walletPassphrase: string;
}): Promise<void> {
  const { bitgo, coin: coinName, walletId, device, walletPassphrase } = params;

  if (!device.id) {
    throw new Error('device.id is required to remove a passkey from the wallet');
  }

  const baseCoin = bitgo.coin(coinName);
  const wallet = await baseCoin.wallets().get({ id: walletId });
  const keychainId = wallet.keyIds()[0];
  const keychain = await baseCoin.keychains().get({ id: keychainId });

  // Verify passphrase before any mutation
  const decrypted = await decryptKeychainPrivateKeyAsync(bitgo, keychain, walletPassphrase);
  if (!decrypted) {
    throw new Error('Incorrect wallet passphrase. Passkey removal aborted to prevent lockout.');
  }

  // No sdk-core abstraction for this endpoint; raw DELETE is required
  await bitgo.del(bitgo.url(`/key/${keychainId}/webauthndevice/${device.id}`, 2)).result();
}
