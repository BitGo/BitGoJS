import * as express from 'express';
import * as https from 'https';
import * as superagent from 'superagent';
import { BaseCoin, decodeOrElse, Wallet } from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/utxo-lib';

import {
  InitLightningWalletRequest,
  InitLightningWalletRequestCodec,
  LightningAuthKeychain,
  LightningAuthKeychainCodec,
  LightningKeychain,
  LightningKeychainCodec,
  LightningSignerConnections,
  LightningSignerDetails,
} from './codecs';
import { unwrapLightningCoinSpecific } from './lightningUtils';
import { retryPromise } from '../retryPromise';

function getLightningWalletSignerDetails(
  walletId: string,
  config: { lightningSignerConnections?: LightningSignerConnections }
): LightningSignerDetails {
  if (!config.lightningSignerConnections) {
    throw new Error('Missing required configuration: lightningSignerConnections');
  }

  const lightningSignerDetails = config.lightningSignerConnections[walletId];
  if (!lightningSignerDetails) {
    throw new Error(`Missing required configuration for walletId: ${walletId}`);
  }
  return lightningSignerDetails;
}

async function getLightningWalletKeychains(
  coin: BaseCoin,
  wallet: Wallet
): Promise<{ userKey: LightningKeychain; userAuthKey: LightningAuthKeychain; nodeAuthKey: LightningAuthKeychain }> {
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

  return { userKey, userAuthKey, nodeAuthKey };
}

function createHttpAgent(tlsCert: string) {
  return new https.Agent({
    ca: Buffer.from(tlsCert, 'base64').toString('utf-8'),
  });
}

async function initWallet(
  config: { url: string; httpsAgent: https.Agent },
  data: { wallet_password: string; extended_master_key: string; macaroon_root_key: string }
) {
  return retryPromise(
    () => superagent.post(`${config.url}/v1/initwallet`).agent(config.httpsAgent).type('json').send(data),
    (err, tryCount) => {
      console.log(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
    }
  );
}

export async function handleInitLightningWallet(req: express.Request) {
  const walletId = req.params.id;
  if (!walletId) {
    throw new Error('Missing required param: walletId');
  }

  const lightningSignerDetails = getLightningWalletSignerDetails(walletId, req.config);

  const reqBody: InitLightningWalletRequest = decodeOrElse(
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

  const { userKey, nodeAuthKey } = await getLightningWalletKeychains(coin, wallet);

  const macaroon_root_key = bip32
    .fromBase58(bitgo.decrypt({ password: reqBody.passphrase, input: nodeAuthKey.encryptedPrv }))
    .privateKey?.toString('base64');

  if (!macaroon_root_key) {
    throw new Error('Invalid nodeAuthPrv');
  }

  const { url, tlsCert } = lightningSignerDetails;
  const httpsAgent = createHttpAgent(tlsCert);

  const initWalletRes = await initWallet(
    { url, httpsAgent },
    {
      wallet_password: reqBody.passphrase,
      extended_master_key: bitgo.decrypt({ password: reqBody.passphrase, input: userKey.encryptedPrv }),
      macaroon_root_key,
    }
  );

  if (initWalletRes.status !== 200) {
    throw new Error(`Failed to initialize wallet: ${initWalletRes.text}`);
  }
}
