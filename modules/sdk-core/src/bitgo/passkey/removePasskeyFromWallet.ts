import { BitGoBase } from '../bitgoBase';
import { WebAuthnOtpDevice } from './types';

export async function removePasskeyFromWallet(params: {
  bitgo: BitGoBase;
  walletId: string;
  device: WebAuthnOtpDevice;
  walletPassphrase: string;
}): Promise<void> {
  const { bitgo, walletId, device, walletPassphrase } = params;

  // Fetch wallet to infer coin and keychainId
  // We use a temporary coin to access the wallets API; the wallet's actual coin is read after fetch
  const walletData = await bitgo.get(bitgo.url(`/wallet/${walletId}`, 2)).result();

  const coin = walletData.coin as string;
  const keychainId = (walletData.keys as string[])[0];

  // Fetch user keychain
  const keychain = await bitgo.get(bitgo.url(`/${coin}/key/${keychainId}`, 2)).result();

  if (!keychain.encryptedPrv) {
    throw new Error(`Keychain ${keychainId} has no encryptedPrv. Cannot verify passphrase before passkey removal.`);
  }

  // Verify passphrase before any mutation
  try {
    bitgo.decrypt({ password: walletPassphrase, input: keychain.encryptedPrv });
  } catch {
    throw new Error('Incorrect wallet passphrase. Passkey removal aborted to prevent lockout.');
  }

  // DELETE the webauthn device using device.id (MongoDB ObjectId), not credentialId
  await bitgo.del(bitgo.url(`/key/${keychainId}/webauthndevice/${device.id}`, 2)).result();
}
