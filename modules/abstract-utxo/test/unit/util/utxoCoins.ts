import * as utxolib from '@bitgo/utxo-lib';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';

import {
  AbstractUtxoCoin,
  Btc,
  Tbtc,
  Tbtc4,
  Tbtcsig,
  Tbtcbgsig,
  Bch,
  Tbch,
  Bcha,
  Tbcha,
  Bsv,
  Tbsv,
  Btg,
  Ltc,
  Tltc,
  Dash,
  Tdash,
  Doge,
  Tdoge,
  Zec,
  Tzec,
} from '../../../src';

export const defaultBitGo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });

const utxoCoinClasses = [
  Btc,
  Tbtc,
  Tbtc4,
  Tbtcsig,
  Tbtcbgsig,
  Bch,
  Tbch,
  Bcha,
  Tbcha,
  Bsv,
  Tbsv,
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

function getUtxoCoins(bitgo: BitGoAPI = defaultBitGo): AbstractUtxoCoin[] {
  return utxoCoinClasses
    .map((cls): AbstractUtxoCoin => {
      try {
        return cls.createInstance(bitgo);
      } catch (e) {
        throw new Error(`error creating ${cls.name}: ${e}`);
      }
    })
    .sort((a, b) => utxolib.getNetworkList().indexOf(a.network) - utxolib.getNetworkList().indexOf(b.network));
}

export const utxoCoins = getUtxoCoins();

export function getUtxoCoin(name: string): AbstractUtxoCoin {
  for (const c of utxoCoins) {
    if (c.getChain() === name) {
      return c;
    }
  }
  throw new Error(`no coin with name ${name}`);
}

export function getUtxoCoinForNetwork(n: utxolib.Network): AbstractUtxoCoin {
  for (const c of utxoCoins) {
    if (c.network === n) {
      return c;
    }
  }
  throw new Error(`no coin for network ${utxolib.getNetworkName(n)}`);
}
