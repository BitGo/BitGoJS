export const DEFAULT_UTXO_PATTERNS = [
  'utxo',
  'unspents',
  'abstract-lightning',
  'babylonlabs-io-btc-staking-ts',
  'sdk-coin-btc',
  'sdk-coin-bch',
  'sdk-coin-bsv',
  'sdk-coin-btg',
  'sdk-coin-dash',
  'sdk-coin-doge',
  'sdk-coin-ltc',
  'sdk-coin-zec',
];

export interface FilterOptions {
  ignore: string[];
  onlyUtxo: boolean;
  ignoreUtxo: boolean;
  utxoPatterns: string[];
}

export function isUtxoPackage(packageName: string, patterns: string[] = DEFAULT_UTXO_PATTERNS): boolean {
  return patterns.some((p) => packageName.includes(p));
}

export function filterDependencies(deps: string[], options: FilterOptions): string[] {
  return deps.filter((d) => {
    if (options.ignore.includes(d)) {
      return false;
    }
    const utxo = isUtxoPackage(d, options.utxoPatterns);
    if (options.onlyUtxo) {
      return utxo;
    }
    if (options.ignoreUtxo) {
      return !utxo;
    }
    return true;
  });
}
