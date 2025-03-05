import { isIP } from 'net';
import * as express from 'express';
import { decodeOrElse } from '@bitgo/sdk-core';
import {
  getUtxolibNetwork,
  signerMacaroonPermissions,
  createWatchOnly,
  addIPCaveatToMacaroon,
  isLightningCoinName,
  getLightningWallet,
} from '@bitgo/abstract-lightning';
import * as utxolib from '@bitgo/utxo-lib';
import { Buffer } from 'buffer';

import {
  CreateSignerMacaroonRequest,
  GetWalletStateResponse,
  InitLightningWalletRequest,
  UnlockLightningWalletRequest,
} from './codecs';
import { LndSignerClient } from './lndSignerClient';
import { ApiResponseError } from '../errors';

type Decrypt = (params: { input: string; password: string }) => string;

async function createSignerMacaroon(
  lndSignerClient: LndSignerClient,
  header: { adminMacaroonHex: string },
  watchOnlyIp: string | undefined | null
): Promise<string> {
  const { macaroon } = await lndSignerClient.bakeMacaroon({ permissions: signerMacaroonPermissions }, header);
  const macaroonBase64 = watchOnlyIp
    ? addIPCaveatToMacaroon(Buffer.from(macaroon, 'hex').toString('base64'), watchOnlyIp)
    : undefined;
  return macaroonBase64 ? Buffer.from(macaroonBase64, 'base64').toString('hex') : macaroon;
}

function getSignerRootKey(
  passphrase: string,
  userMainnetEncryptedPrv: string,
  network: utxolib.Network,
  decrypt: Decrypt
) {
  const userMainnetPrv = decrypt({
    password: passphrase,
    input: userMainnetEncryptedPrv,
  });
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
  const bitgo = req.bitgo;
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin ${coinName}. This is not a lightning coin.`, 400);
  }
  const coin = bitgo.coin(coinName);

  const walletId = req.params.id;
  if (typeof walletId !== 'string') {
    throw new ApiResponseError(`Invalid wallet id: ${walletId}`, 400);
  }

  const { passphrase, expressHost } = decodeOrElse(
    InitLightningWalletRequest.name,
    InitLightningWalletRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new ApiResponseError('Invalid request body to initialize lightning wallet', 400);
    }
  );

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  const lightningWallet = getLightningWallet(await coin.wallets().get({ id: walletId }));

  const userKey = await lightningWallet.getLightningKeychain();
  const { nodeAuthKey } = await lightningWallet.getLightningAuthKeychains();

  const network = getUtxolibNetwork(coin.getChain());
  const signerRootKey = getSignerRootKey(passphrase, userKey.encryptedPrv, network, bitgo.decrypt);
  const macaroonRootKey = getMacaroonRootKey(passphrase, nodeAuthKey.encryptedPrv, bitgo.decrypt);

  const { admin_macaroon: adminMacaroon } = await lndSignerClient.initWallet({
    // The passphrase at LND can only accommodate a base64 character set
    // For more information, see BTC-1851
    wallet_password: Buffer.from(passphrase).toString('base64'),
    extended_master_key: signerRootKey,
    macaroon_root_key: macaroonRootKey,
  });

  return await lightningWallet.updateWalletCoinSpecific({
    signerAdminMacaroon:
      expressHost && !!isIP(expressHost) ? addIPCaveatToMacaroon(adminMacaroon, expressHost) : adminMacaroon,
    watchOnlyAccounts: createWatchOnly(signerRootKey, network),
    passphrase,
  });
}

/**
 * Handle the request to create a signer macaroon from remote signer LND for a wallet.
 */
export async function handleCreateSignerMacaroon(req: express.Request): Promise<unknown> {
  const bitgo = req.bitgo;
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to create signer macaroon: ${coinName}. Must be a lightning coin.`, 400);
  }
  const coin = bitgo.coin(coinName);
  const walletId = req.params.id;
  if (typeof walletId !== 'string') {
    throw new ApiResponseError(`Invalid wallet id: ${walletId}`, 400);
  }

  const { passphrase, addIpCaveatToMacaroon } = decodeOrElse(
    CreateSignerMacaroonRequest.name,
    CreateSignerMacaroonRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new ApiResponseError('Invalid request body to create signer macaroon', 400);
    }
  );

  const wallet = await coin.wallets().get({ id: walletId });
  const watchOnlyIp = wallet.coinSpecific()?.watchOnlyExternalIp;
  if (!watchOnlyIp && addIpCaveatToMacaroon) {
    throw new ApiResponseError(
      'Cannot create signer macaroon because the external IP is not set. This can take some time. Contact support@bitgo.com if longer than 24 hours.',
      400
    );
  }

  if (watchOnlyIp && !isIP(watchOnlyIp)) {
    throw new ApiResponseError(`Invalid IP address: ${watchOnlyIp}. Contact support@bitgo.com`, 500);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  const lightningWallet = getLightningWallet(wallet);

  const encryptedSignerAdminMacaroon = wallet.coinSpecific()?.encryptedSignerAdminMacaroon;
  if (!encryptedSignerAdminMacaroon) {
    throw new ApiResponseError('Missing encryptedSignerAdminMacaroon in wallet', 400);
  }
  const adminMacaroon = bitgo.decrypt({
    password: passphrase,
    input: encryptedSignerAdminMacaroon,
  });

  const signerMacaroon = await createSignerMacaroon(
    lndSignerClient,
    { adminMacaroonHex: Buffer.from(adminMacaroon, 'base64').toString('hex') },
    addIpCaveatToMacaroon ? watchOnlyIp : null
  );

  return await lightningWallet.updateWalletCoinSpecific({
    signerMacaroon,
    passphrase,
  });
}

/**
 * Handle the request to get the state of a wallet from the signer.
 */
export async function handleGetLightningWalletState(req: express.Request): Promise<GetWalletStateResponse> {
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to get lightning wallet state: ${coinName}`, 400);
  }
  const walletId = req.params.id;
  if (typeof walletId !== 'string') {
    throw new ApiResponseError(`Invalid wallet id: ${walletId}`, 400);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  return await lndSignerClient.getWalletState();
}

/**
 * Handle the request to unlock a wallet in the signer.
 */
export async function handleUnlockLightningWallet(req: express.Request): Promise<{ message: string }> {
  const coinName = req.params.coin;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to unlock lightning wallet: ${coinName}`, 400);
  }
  const walletId = req.params.id;
  if (typeof walletId !== 'string') {
    throw new ApiResponseError(`Invalid wallet id: ${walletId}`, 400);
  }

  const { passphrase } = decodeOrElse(
    UnlockLightningWalletRequest.name,
    UnlockLightningWalletRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new ApiResponseError('Invalid request body to unlock lightning wallet', 400);
    }
  );

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  // The passphrase at LND can only accommodate a base64 character set
  // For more information, see BTC-1851
  await lndSignerClient.unlockWallet({
    wallet_password: Buffer.from(passphrase).toString('base64'),
  });
  return { message: 'ok' };
}
