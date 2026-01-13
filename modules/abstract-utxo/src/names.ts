import * as utxolib from '@bitgo/utxo-lib';

export const utxoCoinsMainnet = ['btc', 'bch', 'bcha', 'bsv', 'btg', 'dash', 'doge', 'ltc', 'zec'] as const;
export const utxoCoinsTestnet = [
  'tbtc',
  'tbtc4',
  'tbtcsig',
  'tbtcbgsig',
  'tbch',
  'tbcha',
  'tbsv',
  'tbtg',
  'tdash',
  'tdoge',
  'tltc',
  'tzec',
] as const;

export type UtxoCoinNameMainnet = (typeof utxoCoinsMainnet)[number];
export type UtxoCoinNameTestnet = `t${UtxoCoinNameMainnet}` | 'tbtcsig' | 'tbtc4' | 'tbtcbgsig';
export type UtxoCoinName = UtxoCoinNameMainnet | UtxoCoinNameTestnet;

export function isUtxoCoinNameMainnet(coinName: string): coinName is UtxoCoinNameMainnet {
  return utxoCoinsMainnet.includes(coinName as UtxoCoinNameMainnet);
}

export function isUtxoCoinNameTestnet(coinName: string): coinName is UtxoCoinNameTestnet {
  return utxoCoinsTestnet.includes(coinName as UtxoCoinNameTestnet);
}

export function isUtxoCoinName(coinName: string): coinName is UtxoCoinName {
  return isUtxoCoinNameMainnet(coinName) || isUtxoCoinNameTestnet(coinName);
}

export function getMainnetCoinName(coinName: UtxoCoinName): UtxoCoinNameMainnet {
  if (isUtxoCoinNameMainnet(coinName)) {
    return coinName;
  }
  switch (coinName) {
    case 'tbtc4':
    case 'tbtcsig':
    case 'tbtcbgsig':
      return 'btc';
    default:
      return coinName.slice(1) as UtxoCoinNameMainnet;
  }
}

function getNetworkName(n: utxolib.Network): utxolib.NetworkName {
  const name = utxolib.getNetworkName(n);
  if (!name) {
    throw new Error('Unknown network');
  }
  return name;
}

/**
 * @deprecated - will be removed when we drop support for utxolib
 * @param n
 * @returns the family name for a network. Testnets and mainnets of the same coin share the same family name.
 */
export function getFamilyFromNetwork(n: utxolib.Network): UtxoCoinNameMainnet {
  switch (getNetworkName(n)) {
    case 'bitcoin':
    case 'testnet':
    case 'bitcoinPublicSignet':
    case 'bitcoinTestnet4':
    case 'bitcoinBitGoSignet':
      return 'btc';
    case 'bitcoincash':
    case 'bitcoincashTestnet':
      return 'bch';
    case 'ecash':
    case 'ecashTest':
      return 'bcha';
    case 'bitcoingold':
    case 'bitcoingoldTestnet':
      return 'btg';
    case 'bitcoinsv':
    case 'bitcoinsvTestnet':
      return 'bsv';
    case 'dash':
    case 'dashTest':
      return 'dash';
    case 'dogecoin':
    case 'dogecoinTest':
      return 'doge';
    case 'litecoin':
    case 'litecoinTest':
      return 'ltc';
    case 'zcash':
    case 'zcashTest':
      return 'zec';
  }
}

/**
 * @deprecated - will be removed when we drop support for utxolib
 * Get the chain name for a network.
 * The chain is different for every network.
 */
export function getCoinName(n: utxolib.Network): UtxoCoinName {
  switch (getNetworkName(n)) {
    case 'bitcoinPublicSignet':
      return 'tbtcsig';
    case 'bitcoinTestnet4':
      return 'tbtc4';
    case 'bitcoinBitGoSignet':
      return 'tbtcbgsig';
    case 'bitcoin':
    case 'testnet':
    case 'bitcoincash':
    case 'bitcoincashTestnet':
    case 'ecash':
    case 'ecashTest':
    case 'bitcoingold':
    case 'bitcoingoldTestnet':
    case 'bitcoinsv':
    case 'bitcoinsvTestnet':
    case 'dash':
    case 'dashTest':
    case 'dogecoin':
    case 'dogecoinTest':
    case 'litecoin':
    case 'litecoinTest':
    case 'zcash':
    case 'zcashTest':
      const mainnetName = getFamilyFromNetwork(n);
      return utxolib.isTestnet(n) ? `t${mainnetName}` : mainnetName;
  }
}

/**
 * @deprecated - will be removed when we drop support for utxolib
 * @param coinName - the name of the coin (e.g. 'btc', 'bch', 'ltc'). Also called 'chain' in some contexts.
 * @returns the network for a coin. This is the mainnet network for the coin.
 */
export function getNetworkFromCoinName(coinName: string): utxolib.Network {
  for (const network of utxolib.getNetworkList()) {
    if (getCoinName(network) === coinName) {
      return network;
    }
  }
  throw new Error(`Unknown coin name ${coinName}`);
}

/** @deprecated - use getNetworkFromCoinName instead */
export const getNetworkFromChain = getNetworkFromCoinName;

function getBaseNameFromMainnet(coinName: UtxoCoinNameMainnet): string {
  switch (coinName) {
    case 'btc':
      return 'Bitcoin';
    case 'bch':
      return 'Bitcoin Cash';
    case 'bcha':
      return 'Bitcoin ABC';
    case 'btg':
      return 'Bitcoin Gold';
    case 'bsv':
      return 'Bitcoin SV';
    case 'dash':
      return 'Dash';
    case 'doge':
      return 'Dogecoin';
    case 'ltc':
      return 'Litecoin';
    case 'zec':
      return 'ZCash';
  }
}

export function getFullNameFromCoinName(coinName: UtxoCoinName): string {
  let prefix: string;
  switch (coinName) {
    case 'tbtc4':
      prefix = 'Testnet4 ';
      break;
    case 'tbtcsig':
      prefix = 'Public Signet ';
      break;
    case 'tbtcbgsig':
      prefix = 'BitGo Signet ';
      break;
    default:
      prefix = isUtxoCoinNameTestnet(coinName) ? 'Testnet ' : '';
  }

  return prefix + getBaseNameFromMainnet(getMainnetCoinName(coinName));
}

/** @deprecated - use getFullNameFromCoinName instead */
export function getFullNameFromNetwork(n: utxolib.Network): string {
  return getFullNameFromCoinName(getCoinName(n));
}

export function isTestnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameTestnet(coinName);
}

export function isMainnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameMainnet(coinName);
}
