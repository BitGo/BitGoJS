import { BitGoBase, GlobalCoinFactory } from '@bitgo/sdk-core';
import { type CoinMap, getFormattedSolTokens } from '@bitgo/statics';
import { Sol } from './sol';
import { SolToken } from './solToken';
import { Tsol } from './tsol';

export const register = (sdk: BitGoBase): void => {
  sdk.register('sol', Sol.createInstance);
  sdk.register('tsol', Tsol.createInstance);
  SolToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};

export const registerWithCoinMap = (sdk: BitGoBase, coinMap: CoinMap): void => {
  sdk.register('sol', Sol.createInstance);
  sdk.register('tsol', Tsol.createInstance);
  // Registration for SOL tokens from the coin map (includes both hardcoded and dynamic tokens from AMS).
  SolToken.createTokenConstructors(getFormattedSolTokens(coinMap)).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
    if (coinMap.has(name)) {
      GlobalCoinFactory.registerToken(coinMap.get(name), coinConstructor);
    }
  });
};
