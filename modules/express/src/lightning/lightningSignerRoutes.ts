import { isIP } from 'net';
import {
  getUtxolibNetwork,
  signerMacaroonPermissions,
  createWatchOnly,
  addIPCaveatToMacaroon,
  isLightningCoinName,
  getLightningKeychain,
  getLightningAuthKeychains,
  updateWalletCoinSpecific,
} from '@bitgo/abstract-lightning';
import * as utxolib from '@bitgo/utxo-lib';
import { Buffer } from 'buffer';

import { GetWalletStateResponse } from './codecs';
import { LndSignerClient } from './lndSignerClient';
import { ApiResponseError } from '../errors';
import type { ExpressApiRouteRequest } from '../typedRoutes/api';

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
export async function handleInitLightningWallet(
  req: ExpressApiRouteRequest<'express.lightning.initWallet', 'post'>
): Promise<unknown> {
  const bitgo = req.bitgo;
  const { coin: coinName, walletId, passphrase, expressHost } = req.decoded;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin ${coinName}. This is not a lightning coin.`, 400);
  }
  const coin = bitgo.coin(coinName);

  const wallet = await coin.wallets().get({ id: walletId, includeBalance: false });
  if (wallet.subType() !== 'lightningSelfCustody') {
    throw new ApiResponseError(`not a self custodial lighting wallet ${walletId}`, 400);
  }
  const lndSignerClient = await LndSignerClient.create(walletId, req.config);

  const userKey = await getLightningKeychain(wallet);
  const userKeyEncryptedPrv = userKey.encryptedPrv;
  if (!userKeyEncryptedPrv) {
    throw new ApiResponseError('Missing encryptedPrv in user keychain', 400);
  }
  const { nodeAuthKey } = await getLightningAuthKeychains(wallet);
  const nodeAuthKeyEncryptedPrv = nodeAuthKey.encryptedPrv;
  if (!nodeAuthKeyEncryptedPrv) {
    throw new ApiResponseError('Missing encryptedPrv in node auth keychain', 400);
  }
  const network = getUtxolibNetwork(coin.getChain());
  const signerRootKey = getSignerRootKey(passphrase, userKeyEncryptedPrv, network, bitgo.decrypt);
  const macaroonRootKey = getMacaroonRootKey(passphrase, nodeAuthKeyEncryptedPrv, bitgo.decrypt);

  const { admin_macaroon: adminMacaroon } = await lndSignerClient.initWallet({
    // The passphrase at LND can only accommodate a base64 character set
    // For more information, see BTC-1851
    wallet_password: Buffer.from(passphrase).toString('base64'),
    extended_master_key: signerRootKey,
    macaroon_root_key: macaroonRootKey,
  });

  return await updateWalletCoinSpecific(wallet, {
    signerAdminMacaroon:
      expressHost && !!isIP(expressHost) ? addIPCaveatToMacaroon(adminMacaroon, expressHost) : adminMacaroon,
    watchOnlyAccounts: createWatchOnly(signerRootKey, network),
    passphrase,
  });
}

/**
 * Handle the request to create a signer macaroon from remote signer LND for a wallet.
 */
export async function handleCreateSignerMacaroon(
  req: ExpressApiRouteRequest<'express.lightning.signerMacaroon', 'post'>
): Promise<unknown> {
  const bitgo = req.bitgo;
  const { walletId, passphrase, addIpCaveatToMacaroon } = req.decoded;
  const coinName = req.decoded.coin;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to create signer macaroon: ${coinName}. Must be a lightning coin.`, 400);
  }
  const coin = bitgo.coin(coinName);
  if (typeof walletId !== 'string') {
    throw new ApiResponseError(`Invalid wallet id: ${walletId}`, 400);
  }

  const wallet = await coin.wallets().get({ id: walletId, includeBalance: false });
  if (wallet.subType() !== 'lightningSelfCustody') {
    throw new ApiResponseError(`not a self custodial lighting wallet ${walletId}`, 400);
  }
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

  return await updateWalletCoinSpecific(wallet, {
    signerMacaroon,
    passphrase,
  });
}

/**
 * Handle the request to get the state of a wallet from the signer.
 */
export async function handleGetLightningWalletState(
  req: ExpressApiRouteRequest<'express.lightning.getState', 'get'>
): Promise<GetWalletStateResponse> {
  const { coin: coinName, walletId } = req.decoded;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to get lightning wallet state: ${coinName}`, 400);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  return await lndSignerClient.getWalletState();
}

/**
 * Handle the request to unlock a wallet in the signer.
 */
export async function handleUnlockLightningWallet(
  req: ExpressApiRouteRequest<'express.lightning.unlockWallet', 'post'>
): Promise<{ message: string }> {
  const { coin: coinName, id: walletId, passphrase } = req.decoded;
  if (!isLightningCoinName(coinName)) {
    throw new ApiResponseError(`Invalid coin to unlock lightning wallet: ${coinName}`, 400);
  }

  const lndSignerClient = await LndSignerClient.create(walletId, req.config);
  // The passphrase at LND can only accommodate a base64 character set
  // For more information, see BTC-1851
  await lndSignerClient.unlockWallet({
    wallet_password: Buffer.from(passphrase).toString('base64'),
  });
  return { message: 'ok' };
}
