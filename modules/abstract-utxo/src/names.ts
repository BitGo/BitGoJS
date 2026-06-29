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

export function isTestnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameTestnet(coinName);
}

export function isMainnetCoin(coinName: UtxoCoinName): boolean {
  return isUtxoCoinNameMainnet(coinName);
}
