import * as express from 'express';
import { decodeOrElse } from '@bitgo/sdk-core';
import {
  InitLightningWalletRequest,
  InitLightningWalletRequestCodec,
  LightningAuthKeychain,
  LightningAuthKeychainCodec,
  LightningKeychain,
  LightningKeychainCodec,
} from './codecs';
import { unwrapLightningCoinSpecific } from './lightningUtils';

export async function handleInitLightningWallet(req: express.Request) {
  const { lightningSignerUrls } = req.config;
  if (!lightningSignerUrls) {
    throw new Error('Missing required configuration: lightningSignerUrls');
  }

  const walletId = req.params.id;
  if (!walletId) {
    throw new Error('Missing required param: walletId');
  }

  const lightningSignerUrl = lightningSignerUrls[walletId];
  if (!lightningSignerUrl) {
    throw new Error('Missing required configuration: lightningSignerUrl');
  }

  const body: InitLightningWalletRequest = decodeOrElse(
    InitLightningWalletRequestCodec.name,
    InitLightningWalletRequestCodec,
    req.body,
    (_) => {
      throw new Error('Invalid request body for initLightningWallet.');
    }
  );

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error('Invalid coin');
  }

  const wallet = await coin.wallets().get({ id: walletId });

  // TODO: check if wallet is ready for initialization

  if (wallet.keyIds().length !== 1) {
    throw new Error('Invalid number of keys in wallet');
  }
  const [userKeyId] = wallet.keyIds();
  const authKeysIds = wallet.coinSpecific()?.keys;
  if (authKeysIds?.length !== 2) {
    throw new Error('Invalid number of keys in wallet coinSpecific');
  }
  const allKeyIds = [userKeyId, ...authKeysIds];
  const keychains = await Promise.all(allKeyIds.map((id) => coin.keychains().get({ id })));
  const userKeychain = keychains.find((keychain) => keychain.id === userKeyId);

  const userKey: LightningKeychain = decodeOrElse(
    LightningKeychainCodec.name,
    LightningKeychainCodec,
    userKeychain,
    (_) => {
      throw new Error(`Invalid user key`);
    }
  );

  const authKeys: LightningAuthKeychain[] = authKeysIds.map((keyId) => {
    const authKeychain = keychains.find((keychain) => keychain.id === keyId);
    return decodeOrElse(LightningAuthKeychainCodec.name, LightningAuthKeychainCodec, authKeychain, (_) => {
      throw new Error(`Invalid auth key`);
    });
  });

  (['userAuth', 'nodeAuth'] as const).map((purpose) => {
    const key = authKeys.find((k) => unwrapLightningCoinSpecific(k, coin.getChain()).purpose === purpose);
    if (!key) {
      throw new Error(`Missing ${purpose} key`);
    }
  });
  const userAuthKey = authKeys.find((key) => unwrapLightningCoinSpecific(key, coin.getChain()).purpose === 'userAuth');
  const nodeAuthKey = authKeys.find((key) => unwrapLightningCoinSpecific(key, coin.getChain()).purpose === 'nodeAuth');
  if (!userAuthKey || !nodeAuthKey) {
    throw new Error('Invalid auth keys');
  }

  const [userPrv, userAuthPrv, nodeAuthPrv] = [userKey, userAuthKey, nodeAuthKey].map((key) =>
    bitgo.decrypt({ password: body.passphrase, input: key.encryptedPrv })
  );

  if (userPrv === null || userAuthPrv === null || nodeAuthPrv === null) {
    throw new Error('Dummy');
  }
}
