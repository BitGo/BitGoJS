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
  const familyCoins = coins.filter((coin) => coin.family === coinFamily && !coin.isToken);

  familyCoins.forEach((coin) => {
    // Handle SHARED_EVM_SDK registration
    if (coinFeatures.includes(CoinFeature.SHARED_EVM_SDK)) {
      sdk.register(coin.name, EvmCoin.createInstance);
    }
  });

  // Token configs cover both networks, so register them once from the mainnet base coin.
  // The testnet name is derived from the mainnet name (`t<mainnetName>`), otherwise testnet
  // tokens resolve their statics coin (and chain ID) from the mainnet network.
  const mainnetCoinName = familyCoins.reduce<string | undefined>(
    (name, coin) => name ?? (coin.network.type === NetworkType.MAINNET ? coin.name : undefined),
    undefined
  );
  if (!mainnetCoinName) {
    return;
  }
  const coinNames = {
    Mainnet: mainnetCoinName,
    Testnet: `t${mainnetCoinName}`,
  };

  // Handle SUPPORTS_ERC20 registration
  if (coinFeatures.includes(CoinFeature.SUPPORTS_ERC20)) {
    EthLikeErc20Token.createTokenConstructors(coinNames).forEach(({ name, coinConstructor }) => {
      sdk.register(name, coinConstructor);
    });
  }

  // Handle SUPPORTS_ERC721 registration
  if (coinFeatures.includes(CoinFeature.SUPPORTS_ERC721)) {
    EthLikeErc721Token.createTokenConstructors(coinNames).forEach(({ name, coinConstructor }) => {
      sdk.register(name, coinConstructor);
    });
  }
};
