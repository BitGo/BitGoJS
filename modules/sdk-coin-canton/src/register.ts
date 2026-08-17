import { BitGoBase, GlobalCoinFactory } from '@bitgo/sdk-core';
import { type CoinMap, getFormattedCantonTokens } from '@bitgo/statics';
import { Canton } from './canton';
import { Tcanton } from './tcanton';
import { CantonToken } from './cantonToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('canton', Canton.createInstance);
  sdk.register('tcanton', Tcanton.createInstance);
  CantonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};

export const registerWithCoinMap = (sdk: BitGoBase, coinMap: CoinMap): void => {
  sdk.register('canton', Canton.createInstance);
  sdk.register('tcanton', Tcanton.createInstance);
  // Registration for Canton tokens from the coin map (includes both hardcoded and dynamic tokens from AMS).
  CantonToken.createTokenConstructors(getFormattedCantonTokens(coinMap)).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
    // name is derived from coinMap itself (via getFormattedCantonTokens), so it is always present.
    GlobalCoinFactory.registerToken(coinMap.get(name), coinConstructor);
  });
};
