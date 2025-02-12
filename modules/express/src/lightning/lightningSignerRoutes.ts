import * as express from 'express';
import {
  decodeOrElse,
  getUtxolibNetwork,
  signerMacaroonPermissions,
  createWatchOnly,
  addIPCaveatToMacaroon,
  isLightningCoinName,
  deriveLightningServiceSharedSecret,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Buffer } from 'buffer';

import {
  CreateSignerMacaroonRequest,
  GetWalletStateResponse,
  InitLightningWalletRequest,
  UnlockLightningWalletRequest,
} from './codecs';
import { LndSignerClient } from './lndSignerClient';

type Decrypt = (params: { input: string; password: string }) => string;

async function createSignerMacaroon(
  watchOnlyIp: string,
  header: { adminMacaroonHex: string },
  lndSignerClient: LndSignerClient
) {
  const { macaroon } = await lndSignerClient.bakeMacaroon({ permissions: signerMacaroonPermissions }, header);
  const macaroonBase64 = addIPCaveatToMacaroon(Buffer.from(macaroon, 'hex').toString('base64'), watchOnlyIp);
  return Buffer.from(macaroonBase64, 'base64').toString('hex');
}

function getSignerRootKey(
  passphrase: string,
  userMainnetEncryptedPrv: string,
  network: utxolib.Network,
  decrypt: Decrypt
) {
  const userMainnetPrv = decrypt({ password: passphrase, input: userMainnetEncryptedPrv });
  return utxolib.bitgo.keyutil.convertExtendedKeyNetwork(userMainnetPrv, utxolib.networks.bitcoin, network);
}

function getMacaroonRootKey(passphrase: string, nodeAuthEncryptedPrv: string, decrypt: Decrypt) {
  const hdNode = utxolib.bip32.fromBase58(decrypt({ password: passphrase, input: nodeAuthEncryptedPrv }));
  if (!hdNode.privateKey) {
    throw new Error('nodeAuthEncryptedPrv is not a private key');
  }
  return hdNode.privateKey.toString('base64');
}

/**
 * Handle the request to initialise remote signer LND for a wallet.
 */
export async function handleInitLightningWallet(req: express.Request): Promise<unknown> {
  const { walletId, passphrase, signerTlsKey, signerTlsCert, signerIp, expressIp } = decodeOrElse(
    InitLightningWalletRequest.name,
    InitLightningWalletRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid request body to initialise lightning wallet');
    }
  );

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);

  const bitgo = req.bitgo;
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new Error(`Invalid coin to initialise lightning wallet: ${coinName}`);
  }
  const coin = bitgo.coin(coinName);

  const lightningWallet = (await coin.wallets().get({ id: walletId })).lightningV2();

  const userKey = await lightningWallet.getLightningKeychain();
  const { nodeAuthKey } = await lightningWallet.getLightningAuthKeychains();

  const network = getUtxolibNetwork(coin.getChain());
  const signerRootKey = getSignerRootKey(passphrase, userKey.encryptedPrv, network, bitgo.decrypt);
  const macaroonRootKey = getMacaroonRootKey(passphrase, nodeAuthKey.encryptedPrv, bitgo.decrypt);

  const { admin_macaroon: adminMacaroon } = await lndSignerClient.initWallet({
    wallet_password: passphrase,
    extended_master_key: signerRootKey,
    macaroon_root_key: macaroonRootKey,
  });

  const encryptedSignerAdminMacaroon = bitgo.encrypt({
    password: passphrase,
    input: addIPCaveatToMacaroon(adminMacaroon, expressIp),
  });
  const watchOnlyAccounts = createWatchOnly(signerRootKey, network);
  const encryptedSignerTlsKey = signerTlsKey ? bitgo.encrypt({ password: passphrase, input: signerTlsKey }) : undefined;

  return await lightningWallet.updateWalletCoinSpecific(
    {
      encryptedSignerAdminMacaroon,
      signerIp,
      signerTlsCert,
      watchOnlyAccounts,
      ...(encryptedSignerTlsKey && { encryptedSignerTlsKey }),
    },
    passphrase
  );
}

/**
 * Handle the request to create a signer macaroon from remote signer LND for a wallet.
 */
export async function handleCreateSignerMacaroon(req: express.Request): Promise<unknown> {
  const { walletId, passphrase, watchOnlyIp } = decodeOrElse(
    CreateSignerMacaroonRequest.name,
    CreateSignerMacaroonRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid request body to create signer macaroon');
    }
  );

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);

  const bitgo = req.bitgo;
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new Error(`Invalid coin to create signer macaroon: ${coinName}`);
  }
  const coin = bitgo.coin(coinName);

  const wallet = await coin.wallets().get({ id: walletId });
  const lightningWallet = wallet.lightningV2();

  const encryptedSignerAdminMacaroon = wallet.coinSpecific()?.encryptedSignerAdminMacaroon;
  if (!encryptedSignerAdminMacaroon) {
    throw new Error('Missing encryptedSignerAdminMacaroon in wallet');
  }
  const adminMacaroon = bitgo.decrypt({ password: passphrase, input: encryptedSignerAdminMacaroon });

  const { userAuthKey } = await lightningWallet.getLightningAuthKeychains();

  const signerMacaroon = await createSignerMacaroon(
    watchOnlyIp,
    { adminMacaroonHex: Buffer.from(adminMacaroon, 'base64').toString('hex') },
    lndSignerClient
  );

  const userAuthXprv = bitgo.decrypt({ password: passphrase, input: userAuthKey.encryptedPrv });

  const encryptedSignerMacaroon = bitgo.encrypt({
    password: deriveLightningServiceSharedSecret(coinName, userAuthXprv).toString('hex'),
    input: signerMacaroon,
  });
  return await lightningWallet.updateWalletCoinSpecific(
    {
      encryptedSignerMacaroon,
    },
    passphrase
  );
}

/**
 * Handle the request to get the state of a wallet from the signer.
 */
export async function handleGetLightningWalletState(req: express.Request): Promise<GetWalletStateResponse> {
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new Error(`Invalid coin to get lightning wallet state: ${coinName}`);
  }
  const walletId = req.params.id;
  if (typeof walletId !== 'string') {
    throw new Error(`Invalid wallet id: ${walletId}`);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  return await lndSignerClient.getWalletState();
}

/**
 * Handle the request to unlock a wallet in the signer.
 */
export async function handleUnlockLightningWallet(req: express.Request): Promise<void> {
  const { walletId, passphrase } = decodeOrElse(
    UnlockLightningWalletRequest.name,
    UnlockLightningWalletRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid request body to unlock lightning wallet');
    }
  );

  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new Error(`Invalid coin to unlock lightning wallet: ${coinName}`);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  return await lndSignerClient.unlockWallet({ wallet_password: passphrase });
}
