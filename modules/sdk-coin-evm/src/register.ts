import { BitGoBase } from '@bitgo/sdk-core';
import { CoinFeature, coins, NetworkType } from '@bitgo/statics';
import { EvmCoin } from './evmCoin';
import { EthLikeErc20Token } from './ethLikeErc20Token';
import { EthLikeErc721Token } from './ethLikeErc721Token';

export const registerAll = (sdk: BitGoBase): void => {
  coins
    .filter(
      (coin) =>
        coin.features.includes(CoinFeature.SHARED_EVM_SDK) && coin.network.type === NetworkType.MAINNET && !coin.isToken
    )
    .forEach((coin) => {
      register(coin.family, sdk);
    });
};

export const register = (coinFamily: string, sdk: BitGoBase): void => {
  const coinFeatures = coins.get(coinFamily).features;
  coins
    .filter((coin) => coin.family === coinFamily && !coin.isToken)
    .forEach((coin) => {
      // Handle SHARED_EVM_SDK registration
      if (coinFeatures.includes(CoinFeature.SHARED_EVM_SDK)) {
        sdk.register(coin.name, EvmCoin.createInstance);
      }

      // Handle SUPPORTS_ERC20 registration
      if (coinFeatures.includes(CoinFeature.SUPPORTS_ERC20)) {
        const coinNames = {
          Mainnet: `${coin.name}`,
          Testnet: `${coin.name}`,
        };

        EthLikeErc20Token.createTokenConstructors(coinNames).forEach(({ name, coinConstructor }) => {
          sdk.register(name, coinConstructor);
        });
      }

      // Handle SUPPORTS_ERC721 registration
      if (coinFeatures.includes(CoinFeature.SUPPORTS_ERC721)) {
        const coinNames = {
          Mainnet: `${coin.name}`,
          Testnet: `${coin.name}`,
        };

        EthLikeErc721Token.createTokenConstructors(coinNames).forEach(({ name, coinConstructor }) => {
          sdk.register(name, coinConstructor);
        });
      }
    });
};
