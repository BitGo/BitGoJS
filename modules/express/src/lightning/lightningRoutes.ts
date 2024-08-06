import * as express from 'express';
import {
  decodeOrElse,
  createMessageSignature,
  getUtxolibNetwork,
  signerMacaroonPermissions,
  createWatchOnly,
  addIPCaveatToMacaroon,
} from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import * as https from 'https';
import { Buffer } from 'buffer';

import { CreateSignerMacaroonRequestCodec, GetWalletStateResponse, InitLightningWalletRequestCodec } from './codecs';
import { getLightningSignerConfig } from './lightningUtils';
import { bakeMacaroon, createHttpAgent, getWalletState, initWallet } from './signerClient';
import { getLightningAuthKeychains, getLightningKeychain, updateWallet } from './lightningWallets';

type Decrypt = (params: { input: string; password: string }) => string;

async function createSignerMacaroon(
  config: { url: string; httpsAgent: https.Agent },
  header: { adminMacaroonHex: string },
  watchOnlyIP: string
) {
  const { macaroon } = await bakeMacaroon(config, header, { permissions: signerMacaroonPermissions });
  const macaroonBase64 = addIPCaveatToMacaroon(Buffer.from(macaroon, 'hex').toString('base64'), watchOnlyIP);
  return Buffer.from(macaroonBase64, 'base64').toString('hex');
}

function getSignerRootKey(
  passphrase: string,
  userMainnetEncryptedPrv: string,
  network: utxolib.Network,
  decrypt: Decrypt
) {
  const userMainnetPrv = decrypt({ password: passphrase, input: userMainnetEncryptedPrv });
  return utxolib.bitgo.keyutil.changeExtendedKeyNetwork(userMainnetPrv, utxolib.networks.bitcoin, network);
}

function getMacaroonRootKey(passphrase: string, nodeAuthEncryptedPrv: string, decrypt: Decrypt) {
  const hdNode = utxolib.bip32.fromBase58(decrypt({ password: passphrase, input: nodeAuthEncryptedPrv }));
  if (!hdNode.privateKey) {
    throw new Error('nodeAuthEncryptedPrv is not a private key');
  }
  return hdNode.privateKey.toString('base64');
}

export async function handleInitLightningWallet(req: express.Request): Promise<unknown> {
  const { walletId, passphrase, signerTlsKey, signerTlsCert, signerIP, expressIP } = decodeOrElse(
    InitLightningWalletRequestCodec.name,
    InitLightningWalletRequestCodec,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid request body to initialise lightning wallet');
    }
  );

  const { url, tlsCert } = await getLightningSignerConfig(walletId, req.config);

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error('Invalid coin to initialise lightning wallet');
  }

  const wallet = await coin.wallets().get({ id: walletId });

  const userKey = await getLightningKeychain(wallet);
  const { userAuthKey, nodeAuthKey } = await getLightningAuthKeychains(wallet);

  const network = getUtxolibNetwork(coin.getChain());
  const signerRootKey = getSignerRootKey(passphrase, userKey.encryptedPrv, network, bitgo.decrypt);
  const macaroonRootKey = getMacaroonRootKey(passphrase, nodeAuthKey.encryptedPrv, bitgo.decrypt);

  const httpsAgent = createHttpAgent(tlsCert);
  const { admin_macaroon: adminMacaroon } = await initWallet(
    { url, httpsAgent },
    {
      wallet_password: passphrase,
      extended_master_key: signerRootKey,
      macaroon_root_key: macaroonRootKey,
    }
  );

  const encryptedAdminMacaroon = bitgo.encrypt({
    password: passphrase,
    input: addIPCaveatToMacaroon(adminMacaroon, expressIP),
  });
  const encryptedSignerTlsKey = bitgo.encrypt({ password: passphrase, input: signerTlsKey });
  const watchOnly = createWatchOnly(signerRootKey, network);

  const coinSpecific = {
    [coin.getChain()]: {
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

  return await updateWallet(bitgo, wallet, { coinSpecific, signature });
}

export async function handleCreateSignerMacaroon(req: express.Request): Promise<unknown> {
  const { walletId, passphrase, watchOnlyIP } = decodeOrElse(
    CreateSignerMacaroonRequestCodec.name,
    CreateSignerMacaroonRequestCodec,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new Error('Invalid request body for CreateSignerMacaroon.');
    }
  );

  const { url, tlsCert } = await getLightningSignerConfig(walletId, req.config);

  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error('Invalid coin for CreateSignerMacaroon');
  }

  const wallet = await coin.wallets().get({ id: walletId });

  const encryptedAdminMacaroon = wallet.coinSpecific()?.encryptedAdminMacaroon;
  if (!encryptedAdminMacaroon) {
    throw new Error('Missing encryptedAdminMacaroon in wallet');
  }
  const adminMacaroon = bitgo.decrypt({ password: passphrase, input: encryptedAdminMacaroon });

  const { userAuthKey } = await getLightningAuthKeychains(wallet);

  const httpsAgent = createHttpAgent(tlsCert);
  const signerMacaroon = await createSignerMacaroon(
    { url, httpsAgent },
    { adminMacaroonHex: Buffer.from(adminMacaroon, 'base64').toString('hex') },
    watchOnlyIP
  );

  // TODO BTC-1465 - Encrypt the signer macaroon using ECDH with the user and LS key pairs
  const coinSpecific = {
    [coin.getChain()]: {
      signerMacaroon,
    },
  };

  const signature = createMessageSignature(
    coinSpecific,
    bitgo.decrypt({ password: passphrase, input: userAuthKey.encryptedPrv })
  );

  return await updateWallet(bitgo, wallet, { coinSpecific, signature });
}

export async function handleGetLightningWalletState(req: express.Request): Promise<GetWalletStateResponse> {
  const coin = req.bitgo.coin(req.params.coin);
  if (coin.getFamily() !== 'lnbtc') {
    throw new Error('Invalid coin for lightning wallet state');
  }

  const { url, tlsCert } = await getLightningSignerConfig(req.params.id, req.config);
  const httpsAgent = createHttpAgent(tlsCert);
  return await getWalletState({ url, httpsAgent });
}
