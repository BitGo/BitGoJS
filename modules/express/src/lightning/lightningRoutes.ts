import * as express from 'express';
// import * as superagent from 'superagent';
import { decodeOrElse } from '@bitgo/sdk-core';
import {
  InitLightningWalletRequest,
  InitLightningWalletRequestCodec,
  LightningAuthKeychainCodec,
  LightningKeychainCodec,
} from './codecs';
import { unwrapLightningCoinSpecific } from './lightningUtils';
// import { retryPromise } from '../retryPromise';

export async function handleInitLightningWallet(req: express.Request) {
  const { lightningSignerConnections } = req.config;
  if (!lightningSignerConnections) {
    throw new Error('Missing required configuration: lightningSignerConnections');
  }

  const walletId = req.params.id;
  if (!walletId) {
    throw new Error('Missing required param: walletId');
  }

  const lightningSignerDetails = lightningSignerConnections[walletId];
  if (!lightningSignerDetails) {
    throw new Error(`Missing required configuration for walletId: ${walletId}`);
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

  const userKey = decodeOrElse(LightningKeychainCodec.name, LightningKeychainCodec, userKeychain, (_) => {
    throw new Error(`Invalid user key`);
  });

  const authKeys = authKeysIds.map((keyId) => {
    const authKeychain = keychains.find((keychain) => keychain.id === keyId);
    return decodeOrElse(LightningAuthKeychainCodec.name, LightningAuthKeychainCodec, authKeychain, (_) => {
      throw new Error(`Invalid auth key`);
    });
  });

  const [userAuthKey, nodeAuthKey] = (['userAuth', 'nodeAuth'] as const).map((purpose) => {
    const key = authKeys.find((k) => unwrapLightningCoinSpecific(k.coinSpecific, coin.getChain()).purpose === purpose);
    if (!key) {
      throw new Error(`Missing ${purpose} key`);
    }
    return key;
  });

  const [userPrv, userAuthPrv, nodeAuthPrv] = [userKey, userAuthKey, nodeAuthKey].map((key) =>
    bitgo.decrypt({ password: body.passphrase, input: key.encryptedPrv })
  );

  if (userPrv === null || userAuthPrv === null || nodeAuthPrv === null) {
    throw new Error('Dummy');
  }

  // const { url, tlsCert } = lightningSignerDetails;
  // const { body: payloadWithSignature } = await retryPromise(
  //   () =>
  //     superagent
  //       .post(`${url}/v1/initwallet`)
  //       .type('json')
  //       .send({ wallet_password: body.passphrase, extended_master_key: userPrv, macaroon_root_key: }),
  //   (err, tryCount) => {
  //     debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
  //   }
  // );
}
