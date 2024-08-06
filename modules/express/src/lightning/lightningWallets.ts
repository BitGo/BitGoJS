import {
  decodeOrElse,
  LightningAuthKeychain,
  LightningAuthKeychainCodec,
  LightningKeychain,
  LightningKeychainCodec,
  unwrapLightningCoinSpecific,
  Wallet,
} from '@bitgo/sdk-core';
import { BitGo } from 'bitgo';

export async function getLightningKeychain(wallet: Wallet): Promise<LightningKeychain> {
  const coin = wallet.baseCoin;
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error(`Invalid coin to get lightning Keychain: ${coin.getFamily()}`);
  }
  const keyIds = wallet.keyIds();
  if (keyIds.length !== 1) {
    throw new Error(`Invalid number of key in lightning wallet: ${keyIds.length}`);
  }
  const keychain = await coin.keychains().get({ id: keyIds[0] });
  return decodeOrElse(LightningKeychainCodec.name, LightningKeychainCodec, keychain, (_) => {
    // DON'T throw errors from decodeOrElse. It could leak sensitive information.
    throw new Error(`Invalid user key`);
  });
}

export async function getLightningAuthKeychains(
  wallet: Wallet
): Promise<{ userAuthKey: LightningAuthKeychain; nodeAuthKey: LightningAuthKeychain }> {
  const coin = wallet.baseCoin;
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error(`Invalid coin to get lightning auth keychains: ${coin.getFamily()}`);
  }
  const authKeyIds = wallet.coinSpecific()?.keys;
  if (authKeyIds?.length !== 2) {
    throw new Error(`Invalid number of auth keys in lightning wallet: ${authKeyIds?.length}`);
  }
  const keychains = await Promise.all(authKeyIds.map((id) => coin.keychains().get({ id })));
  const authKeychains = keychains.map((keychain) => {
    return decodeOrElse(LightningAuthKeychainCodec.name, LightningAuthKeychainCodec, keychain, (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error(`Invalid lightning auth key: ${keychain?.id}`);
    });
  });
  const [userAuthKey, nodeAuthKey] = (['userAuth', 'nodeAuth'] as const).map((purpose) => {
    const keychain = authKeychains.find(
      (k) => unwrapLightningCoinSpecific(k.coinSpecific, coin.getChain()).purpose === purpose
    );
    if (!keychain) {
      throw new Error(`Missing ${purpose} key`);
    }
    return keychain;
  });

  return { userAuthKey, nodeAuthKey };
}

export async function updateWallet(bitgo: BitGo, wallet: Wallet, data: Record<string, unknown>): Promise<unknown> {
  return await bitgo.put(wallet.url()).send(data).result();
}
