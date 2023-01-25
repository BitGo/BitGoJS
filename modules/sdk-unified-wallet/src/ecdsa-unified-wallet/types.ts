import { CoinFamily } from '@bitgo/statics';

export const supportedCoins: CoinFamily[] = [CoinFamily.ETH, CoinFamily.BSC, CoinFamily.POLYGON];
export type EvmWalletCoins = typeof supportedCoins[number];
