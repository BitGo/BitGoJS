// TODO: add the full list of supported coins
export const MultiSigCoins = ['btc', 'heth'] as const;
export const KeySource = ['user', 'backup'] as const;
export const KeyType = ['independent', 'tss'] as const;

export type MultiSigCoinsType = (typeof MultiSigCoins)[number];
export type KeySourceType = (typeof KeySource)[number];
export type KeyTypeType = (typeof KeyType)[number];
