import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

export const lightningNetworkName = ['bitcoin', 'testnet'] as const;
export type LightningNetworkName = (typeof lightningNetworkName)[number];

/**
 * Get the utxolib network for a lightning network.
 */
export function getLightningNetwork(networkName: LightningNetworkName): utxolib.Network {
  return utxolib.networks[networkName];
}

/**
 * Get the lightning coin name for a utxolib network.
 */
export function getLightningCoinName(network: utxolib.Network): string {
  return network === utxolib.networks.bitcoin ? 'lnbtc' : 'tlnbtc';
}

/**
 * Checks if the network name is a valid lightning network name.
 */
export function isValidLightningNetworkName(networkName: unknown): networkName is LightningNetworkName {
  return lightningNetworkName.includes(networkName as LightningNetworkName);
}

/**
 * Checks if the network is a valid lightning network.
 */
export function isValidLightningNetwork(network: unknown): network is utxolib.Network {
  return utxolib.isValidNetwork(network) && isValidLightningNetworkName(utxolib.getNetworkName(network));
}

/**
 * Returns the utxolib network name for a lightning coin.
 */
export function getUtxolibNetworkName(coinName: string): string | undefined {
  const coin = statics.coins.get(coinName);
  return coin instanceof statics.LightningCoin ? coin.network.utxolibName : undefined;
}

/**
 * Returns coin specific data for a lightning coin.
 */
export function unwrapLightningCoinSpecific<V>(obj: { lnbtc: V } | { tlnbtc: V }, coinSpecificPath: string): V {
  if (coinSpecificPath !== 'lnbtc' && coinSpecificPath !== 'tlnbtc') {
    throw new Error(`invalid coinSpecificPath ${coinSpecificPath} for lightning coin`);
  }
  if (coinSpecificPath === 'lnbtc' && 'lnbtc' in obj) {
    return obj.lnbtc;
  }
  if (coinSpecificPath === 'tlnbtc' && 'tlnbtc' in obj) {
    return obj.tlnbtc;
  }
  throw new Error('invalid lightning coin specific');
}
