import { BitGoAPI } from '@bitgo/sdk-api';
import { CoinConstructor } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { Btc, Tbtc, Tbtc4, Tbtcsig, Tbtcbgsig } from '@bitgo/sdk-coin-btc';
import { Bch, Tbch } from '@bitgo/sdk-coin-bch';
import { Btg } from '@bitgo/sdk-coin-btg';
import { Ltc, Tltc } from '@bitgo/sdk-coin-ltc';
import { Dash, Tdash } from '@bitgo/sdk-coin-dash';
import { Doge, Tdoge } from '@bitgo/sdk-coin-doge';
import { Zec, Tzec } from '@bitgo/sdk-coin-zec';

import { BitGoApiArgs } from '../bitGoArgs';

const coinClasses = [
  Btc,
  Tbtc,
  Tbtc4,
  Tbtcsig,
  Tbtcbgsig,
  Bch,
  Tbch,
  Btg,
  Ltc,
  Tltc,
  Dash,
  Tdash,
  Doge,
  Tdoge,
  Zec,
  Tzec,
];

function getBuilder(coinName: string): CoinConstructor {
  const coinClass = coinClasses.find((coinClass) => coinClass.prototype.getChain.call(null) === coinName);
  if (!coinClass) {
    throw new Error(`Coin ${coinName} not supported`);
  }
  return coinClass.createInstance;
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
