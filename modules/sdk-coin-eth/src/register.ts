import { BitGoBase, GlobalCoinFactory } from '@bitgo/sdk-core';
import { Erc20Token } from './erc20Token';
import { Erc721Token } from './erc721Token';
import { Erc7984Token } from './erc7984Token';
import { Eth } from './eth';
import { Gteth } from './gteth';
import { Hteth } from './hteth';
import { Teth } from './teth';
import { type CoinMap, getFormattedErc20Tokens, getFormattedErc7984Tokens } from '@bitgo/statics';

export const register = (sdk: BitGoBase): void => {
  sdk.register('eth', Eth.createInstance);
  sdk.register('gteth', Gteth.createInstance);
  sdk.register('teth', Teth.createInstance);
  sdk.register('hteth', Hteth.createInstance);
  Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
  Erc721Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
  Erc7984Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};

export const registerWithCoinMap = (sdk: BitGoBase, coinMap: CoinMap): void => {
  sdk.register('eth', Eth.createInstance);
  sdk.register('gteth', Gteth.createInstance);
  sdk.register('teth', Teth.createInstance);
  sdk.register('hteth', Hteth.createInstance);
  Erc721Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });

  // Registration for ERC20 tokens from the coin map (includes both hardcoded and dynamic tokens from AMS).
  Erc20Token.createTokenConstructors(getFormattedErc20Tokens(coinMap)).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
    if (coinMap.has(name)) {
      GlobalCoinFactory.registerToken(coinMap.get(name), coinConstructor);
    }
  });

  // Registration for ERC-7984 confidential tokens from the coin map.
  Erc7984Token.createTokenConstructors(getFormattedErc7984Tokens(coinMap)).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
    if (coinMap.has(name)) {
      GlobalCoinFactory.registerToken(coinMap.get(name), coinConstructor);
    }
  });
};
