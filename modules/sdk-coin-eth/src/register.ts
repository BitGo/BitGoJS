import { BitGoBase } from '@bitgo/sdk-core';
import { Erc20Token } from './erc20Token';
import { Eth } from './eth';
import { Gteth } from './gteth';
import { Hteth } from './hteth';
import { Teth } from './teth';
import { Erc721Token } from './erc721Token';
import { type CoinMap, getFormattedErc20Tokens } from '@bitgo/statics';

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
};

export const registerWithCoinMap = (sdk: BitGoBase, coinMap: CoinMap): void => {
  register(sdk);

  // Registration for dynamic ERC20 tokens that are not hardcoded in the SDK, but are present in the coin map generated using AMS.
  const formattedTokens = getFormattedErc20Tokens(coinMap);
  Erc20Token.createTokenConstructors(formattedTokens).forEach(({ name, coinConstructor }) => {
    // Register constructor for both type names and contract addresses
    sdk.register(name, coinConstructor);
  });
  // Add new tokens to the global coin map so they're available for lookup
  formattedTokens.forEach((token) => {
    sdk.registerWithBaseCoin(Erc20Token.createTokenConstructor(token), coinMap.get(token.type));
  });
};
