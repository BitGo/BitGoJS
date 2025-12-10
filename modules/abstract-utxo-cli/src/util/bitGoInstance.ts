import { BitGoAPI } from '@bitgo/sdk-api';
import { CoinConstructor, IWallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { Btc, Tbtc, Tbtc4, Tbtcsig, Tbtcbgsig } from '@bitgo/sdk-coin-btc';
import { Bch, Tbch } from '@bitgo/sdk-coin-bch';
import { Btg } from '@bitgo/sdk-coin-btg';
import { Ltc, Tltc } from '@bitgo/sdk-coin-ltc';
import { Dash, Tdash } from '@bitgo/sdk-coin-dash';
import { Doge, Tdoge } from '@bitgo/sdk-coin-doge';
import { Zec, Tzec } from '@bitgo/sdk-coin-zec';

import { BitGoApiArgs } from '../bitGoArgs';

function getBuilder(coinName: string): CoinConstructor {
  switch (coinName) {
    case 'btc':
      return Btc.createInstance;
    case 'tbtc':
      return Tbtc.createInstance;
    case 'tbtc4':
      return Tbtc4.createInstance;
    case 'tbtcsig':
      return Tbtcsig.createInstance;
    case 'tbtcbgsig':
      return Tbtcbgsig.createInstance;
    case 'bch':
      return Bch.createInstance;
    case 'tbch':
      return Tbch.createInstance;
    case 'btg':
      return Btg.createInstance;
    case 'ltc':
      return Ltc.createInstance;
    case 'tltc':
      return Tltc.createInstance;
    case 'dash':
      return Dash.createInstance;
    case 'tdash':
      return Tdash.createInstance;
    case 'doge':
      return Doge.createInstance;
    case 'tdoge':
      return Tdoge.createInstance;
    case 'zec':
      return Zec.createInstance;
    case 'tzec':
      return Tzec.createInstance;
    default:
      throw new Error(`Coin ${coinName} is not supported`);
  }
}

function getAccessTokenFromEnv(): string {
  const accessToken = process.env.BITGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('ACCESS_TOKEN environment variable is not set');
  }
  return accessToken;
}

export function getBitGoInstance({ env, accessToken = getAccessTokenFromEnv(), coin }: BitGoApiArgs): BitGoAPI {
  const api = new BitGoAPI({ env });
  api.authenticateWithAccessToken({ accessToken });
  api.register(coin, getBuilder(coin));
  return api;
}

export async function getDefaultEnterpriseId(bitgo: BitGoAPI): Promise<string> {
  type Enterprise = {
    id: string;
  };
  type MeResponse = {
    id: string;
    username: string;
    enterprises: Enterprise[];
  };
  const me: MeResponse = await bitgo.me();
  if (!me.enterprises || me.enterprises.length === 0) {
    throw new Error('No enterprises found');
  }
  return me.enterprises[0].id;
}

export function getBitGoWithUtxoCoin({ env, accessToken = getAccessTokenFromEnv(), coin }: BitGoApiArgs): {
  bitgo: BitGoAPI;
  coin: AbstractUtxoCoin;
} {
  const api = new BitGoAPI({ env });
  api.authenticateWithAccessToken({ accessToken });
  const coinClass = getBuilder(coin);
  api.register(coin, coinClass);
  const coinInstance = api.coin(coin);
  if (!(coinInstance instanceof AbstractUtxoCoin)) {
    throw new Error(`Coin ${coin} is not an UTXO coin`);
  }
  return { bitgo: api, coin: coinInstance };
}

export async function selectWallet(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  args: { walletId?: string; walletLabel?: string }
): Promise<IWallet> {
  if (args.walletId) {
    return coin.wallets().get({ id: args.walletId });
  }

  if (args.walletLabel) {
    const { wallets } = await coin.wallets().list();
    for (const wallet of wallets) {
      console.dir(wallet._wallet);
    }
    const wallet = wallets.find((w) => w.label() === args.walletLabel);
    if (wallet) {
      return wallet;
    }
    throw new Error(`Wallet with label ${args.walletLabel} not found: ${wallets.map((w) => w.label()).join(', ')}`);
  }

  throw new Error('Either walletId or walletLabel must be provided');
}
