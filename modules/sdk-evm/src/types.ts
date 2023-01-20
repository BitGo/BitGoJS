import { CoinFamily } from '@bitgo/statics';

export const supportedCoins: CoinFamily[] = [CoinFamily.ETH, CoinFamily.BSC, CoinFamily.POLYGON];
export type EvmWalletCoins = typeof supportedCoins[number];

export interface EvmWalletID {
  coinName: string;
  walletId: string;
}

export interface EvmWalletParams {
  address: string;
  wallets: EvmWalletID[];
}

export interface EvmWallet extends EvmWalletParams {
  id: string;
}
