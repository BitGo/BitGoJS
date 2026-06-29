import { BitGoBase, EncryptionVersion, Keychain } from '@bitgo/sdk-core';
import { base64UrlToBuffer } from './base64url';
import { deriveEnterpriseSalt } from './deriveEnterpriseSalt';
import { derivePassword } from './derivePassword';
import { WebAuthnOtpDevice, WebAuthnProvider } from './webAuthnTypes';

export async function attachPasskeyToWallet(params: {
  bitgo: BitGoBase;
  coin: string;
  walletId: string;
  device: WebAuthnOtpDevice;
  existingPassphrase: string;
  provider: WebAuthnProvider;
  encryptionVersion?: EncryptionVersion;
}): Promise<Keychain> {
  const { bitgo, coin, walletId, device, existingPassphrase, provider, encryptionVersion } = params;

  // Throw early if PRF extension is not supported
  if (!device.prfSalt) {
    throw new Error('PRF extension not supported by this device. Please use a different passkey.');
  }

  const baseCoin = bitgo.coin(coin);

  // Fetch wallet and validate it is a hot wallet
  const wallet = await baseCoin.wallets().get({ id: walletId });

  if (wallet.type() !== 'hot') {
    throw new Error(`Wallet ${walletId} is not a hot wallet. Only hot wallets support passkey attachment.`);
  }

  const walletData = wallet.toJSON();
  const enterpriseId = walletData.enterprise;
  if (!enterpriseId) {
    throw new Error(`Wallet ${walletId} has no enterprise.`);
  }

  // Fetch the user keychain — iterates keys until it finds one with encryptedPrv
  const keychain = await wallet.getEncryptedUserKeychain();
  const keychainId = keychain.id;

  // Derive enterprise-scoped salt (base64url; same encoding is used as the
  // PRF eval input and as the server-stored prfSalt so the bytes fed to the
  // authenticator match between attach and derive).
  const prfSalt = deriveEnterpriseSalt(device.prfSalt, enterpriseId);

  // Decrypt private key with existing passphrase
  const privateKey = await bitgo.decryptAsync({ password: existingPassphrase, input: keychain.encryptedPrv });

  // Decode credentialId from base64url to ArrayBuffer for allowCredentials.
  // The WebAuthn spec requires allowCredentials to be non-empty when using evalByCredential,
  // and each entry must correspond to a key in the evalByCredential map.
  const credentialIdBuffer = base64UrlToBuffer(device.credentialId).buffer;

  // PRF assertion — evalByCredential maps this device's credentialId to the
  // base64url enterprise salt. The provider layer is responsible for decoding
  // base64url to raw bytes before handing it to the WebAuthn PRF extension.
  const authResult = await provider.get({
    publicKey: {
      allowCredentials: [{ type: 'public-key', id: credentialIdBuffer }],
    } as PublicKeyCredentialRequestOptions,
    evalByCredential: { [device.credentialId]: prfSalt },
  });

  if (!authResult.prfResult) {
    throw new Error('PRF assertion did not return a result.');
  }

  const prfPassword = derivePassword(authResult.prfResult);
  const encryptedPrv = await bitgo.encryptAsync({ password: prfPassword, input: privateKey, encryptionVersion });

  const updatedKeychain = await bitgo
    .put(bitgo.url(`/${coin}/key/${keychainId}`, 2))
    .send({
      webauthnInfo: {
        prfSalt,
        otpDeviceId: device.id,
        encryptedPrv,
      },
    })
    .result();

  return updatedKeychain as Keychain;
}
