import { BitGoBase } from '@bitgo/sdk-core';
import { CoinFeature, coins } from '@bitgo/statics';
import { EvmCoin } from './evm';

export const register = (sdk: BitGoBase): void => {
  coins
    .filter((coin) => coin.features.includes(CoinFeature.SHARED_EVM_SDK))
    .forEach((coin) => {
      sdk.register(coin.name, EvmCoin.createInstance);
    });
};
