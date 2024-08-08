import * as express from 'express';
import { BaseCoin, decodeOrElse, Wallet, createMessageSignature } from '@bitgo/sdk-core';
import { bip32 } from '@bitgo/utxo-lib';
import * as https from 'https';
import { Buffer } from 'buffer';

import {
  InitLightningWalletRequestCodec,
  LightningAuthKeychain,
  LightningAuthKeychainCodec,
  LightningKeychain,
  LightningKeychainCodec,
} from './codecs';
import {
  addIPCaveatToMacaroon,
  createWatchOnly,
  getLightningWalletSignerDetails,
  signerMacaroonPermissions,
  unwrapLightningCoinSpecific,
} from './lightningUtils';
import { bakeMacaroon, createHttpAgent, initWallet } from './signerClient';

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

async function createSignerMacaroon(
  httpConfig: { url: string; httpsAgent: https.Agent; adminMacaroonHex: string },
  watchOnlyIP: string
) {
  const { macaroon: signerMacaroonBase64 } = await bakeMacaroon(httpConfig, signerMacaroonPermissions);
  return addIPCaveatToMacaroon(signerMacaroonBase64, watchOnlyIP);
}

function getMacaroonRootKeyBase64(
  passphrase: string,
  nodeAuthEncryptedPrv: string,
  decrypt: (params: { input: string; password: string }) => string
) {
  const hdNode = bip32.fromBase58(decrypt({ password: passphrase, input: nodeAuthEncryptedPrv }));
  if (!hdNode.privateKey) {
    throw new Error('nodeAuthEncryptedPrv is not a private key');
  }
  return hdNode.privateKey.toString('base64');
}

export async function handleInitLightningWallet(req: express.Request) {
  const walletId = req.params.id;
  if (!walletId) {
    throw new Error('Missing required param: walletId');
  }

  const { url, tlsCert } = getLightningWalletSignerDetails(walletId, req.config);

  const { passphrase, watchOnlyIP, signerTlsKey, signerTlsCert, signerIP } = decodeOrElse(
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
  const isMainnet = coin.getChain() === 'lnbtc';

  const wallet = await coin.wallets().get({ id: walletId });

  // TODO: check if wallet is ready for initialization

  const { userKey, userAuthKey, nodeAuthKey } = await getLightningWalletKeychains(coin, wallet);

  const macaroonRootKeyBase64 = getMacaroonRootKeyBase64(passphrase, nodeAuthKey.encryptedPrv, bitgo.decrypt);
  const extendedMasterPrvKey = bitgo.decrypt({ password: passphrase, input: userKey.encryptedPrv });

  const httpsAgent = createHttpAgent(tlsCert);

  const { admin_macaroon: adminMacaroon } = await initWallet(
    { url, httpsAgent },
    {
      wallet_password: passphrase,
      extended_master_key: extendedMasterPrvKey,
      macaroon_root_key: macaroonRootKeyBase64,
    }
  );

  const signerMacaroon = await createSignerMacaroon(
    { url, httpsAgent, adminMacaroonHex: Buffer.from(adminMacaroon, 'base64').toString('hex') },
    watchOnlyIP
  );

  const encryptedAdminMacaroon = bitgo.encrypt({ password: passphrase, input: adminMacaroon });
  const encryptedSignerTlsKey = bitgo.encrypt({ password: passphrase, input: signerTlsKey });
  const watchOnly = createWatchOnly(bip32.fromBase58(extendedMasterPrvKey), isMainnet);

  const coinSpecific = {
    [coin.getChain()]: {
      signerMacaroon,
      encryptedAdminMacaroon,
      signerIP,
      signerTlsCert,
      encryptedSignerTlsKey,
      watchOnly,
    },
  };

  const signature = createMessageSignature(
    coinSpecific,
    bitgo.decrypt({ password: passphrase, input: userAuthKey.encryptedPrv })
  );

  async function updateWallet() {
    const res = await bitgo.put(wallet.url()).send({ coinSpecific, signature }).result();
    if (res.status !== 200) {
      throw new Error('Failed to update wallet');
    }
    return res;
  }

  return await updateWallet();
}
