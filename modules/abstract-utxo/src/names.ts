import { isCoinName, type CoinName } from '@bitgo/wasm-utxo';

export type WasmUtxoCoinName = CoinName;

export const utxoCoinsMainnet = ['btc', 'bch', 'bcha', 'bsv', 'btg', 'dash', 'doge', 'ltc', 'pearl', 'zec'] as const;
export const utxoCoinsTestnet = [
  'tbtc',
  'tbtc4',
  'tbtcsig',
  'tbtcbgsig',
  'tbtcstx',
  'tbtcstxprivate1',
  'tbch',
  'tbcha',
  'tbsv',
  'tbtg',
  'tdash',
  'tdoge',
  'tltc',
  'tpearl',
  'tzec',
] as const;

export type UtxoCoinNameMainnet = (typeof utxoCoinsMainnet)[number];
export type UtxoCoinNameTestnet =
  | `t${UtxoCoinNameMainnet}`
  | 'tbtcsig'
  | 'tbtc4'
  | 'tbtcbgsig'
  | 'tbtcstx'
  | 'tbtcstxprivate1';
export type UtxoCoinName = UtxoCoinNameMainnet | UtxoCoinNameTestnet;

export function toWasmUtxoCoinName(coinName: UtxoCoinName | WasmUtxoCoinName): WasmUtxoCoinName {
  if (!isCoinName(coinName)) {
    throw new Error(`coin ${coinName} is not supported by wasm-utxo`);
  }
  return coinName;
}

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
    case 'tbtcstx':
    case 'tbtcstxprivate1':
      return 'btc';
    default:
      return coinName.slice(1) as UtxoCoinNameMainnet;
  }
}

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
    case 'pearl':
      return 'Pearl';
    case 'zec':
      return 'ZCash';
  }
}

export function getFullNameFromCoinName(coinName: UtxoCoinName): string {
  if (coinName === 'tbtcstxprivate1') {
    return 'Stacks Bitcoin (Private-1 Regtest)';
  }

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
    case 'tbtcstx':
      prefix = 'Stacks ';
      break;
    default:
      prefix = isUtxoCoinNameTestnet(coinName) ? 'Testnet ' : '';
  }

  return prefix + getBaseNameFromMainnet(getMainnetCoinName(coinName));
}

export function isTestnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameTestnet(coinName);
}

export function isMainnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameMainnet(coinName);
}
