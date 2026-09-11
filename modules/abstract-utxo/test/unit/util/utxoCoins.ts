import * as utxolib from '@bitgo/utxo-lib';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo } from '@bitgo/sdk-test';
import { coins, UtxoCoin } from '@bitgo/statics';

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
  getReplayProtectionAddresses,
} from '../../../src';
import type { UtxoCoinName } from '../../../src/names';

export const defaultBitGo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });

function isUtxolibNetworkName(name: string): name is utxolib.NetworkName {
  return Object.prototype.hasOwnProperty.call(utxolib.networks, name);
}

/**
 * Get the utxolib network for a coin name from the canonical statics definition.
 */
export function getNetworkForCoinName(coinName: string): utxolib.Network {
  const coin = coins.getOrUndefined(coinName);
  if (!(coin instanceof UtxoCoin)) {
    throw new Error(`Unknown coin name: ${coinName}`);
  }

  const networkName = coin.network.utxolibName;
  if (!isUtxolibNetworkName(networkName)) {
    throw new Error(`Unknown utxolib network ${networkName} for coin ${coinName}`);
  }

  return utxolib.networks[networkName];
}

/**
 * Get the canonical test coin for a utxolib network.
 */
export function getCoinNameForNetwork(network: utxolib.Network): UtxoCoinName {
  const coin = utxoCoins.find((coin) => getNetworkForCoinName(coin.name) === network);
  if (coin) {
    return coin.name;
  }

  throw new Error(`Unknown network: ${utxolib.getNetworkName(network)}`);
}

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
    .sort((a, b) => {
      const networkList = utxolib.getNetworkList();
      return networkList.indexOf(getNetworkForCoinName(a.name)) - networkList.indexOf(getNetworkForCoinName(b.name));
    });
}

export const utxoCoins = getUtxoCoins();

/**
 * Minimal subset of coins for comprehensive test coverage.
 * - btc: Full feature set (segwit, taproot, musig2)
 * - bch: replay protection addresses
 * - zec: special transaction format (Overwinter/Sapling)
 */
export const minUtxoCoinNames = ['btc', 'bch', 'zec'] as const;

/**
 * Get minimal set of coins for testing. Covers ~99% of feature paths.
 */
export function getMinUtxoCoins(): AbstractUtxoCoin[] {
  return minUtxoCoinNames.map(getUtxoCoin);
}

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
    if (getNetworkForCoinName(c.name) === n) {
      return c;
    }
  }
  throw new Error(`no coin for network ${utxolib.getNetworkName(n)}`);
}

export type TxFormat = 'legacy' | 'psbt';

export function getScriptTypes(coin: AbstractUtxoCoin, txFormat: TxFormat): utxolib.testutil.InputScriptType[] {
  return (['p2shP2pk', 'p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2', 'taprootKeyPathSpend'] as const).filter(
    (t) => {
      if (t === 'p2shP2pk') {
        return getReplayProtectionAddresses(coin.name).length > 0;
      }
      if (txFormat === 'legacy') {
        if (t === 'p2tr' || t === 'p2trMusig2' || t === 'taprootKeyPathSpend') {
          return false;
        }
      }
      if (t === 'taprootKeyPathSpend') {
        return coin.supportsAddressType('p2trMusig2');
      }
      return coin.supportsAddressType(t);
    }
  );
}
