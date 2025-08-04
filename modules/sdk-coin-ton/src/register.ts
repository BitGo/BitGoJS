import { BitGoBase } from '@bitgo/sdk-core';
import { Ton } from './ton';
import { Tton } from './tton';
import { TonToken } from './tonToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ton', Ton.createInstance);
  sdk.register('tton', Tton.createInstance);

  // Register Jetton tokens
  const tokens = TonToken.createTokenConstructors();
  tokens.forEach((token) => {
    sdk.register(token.name, token.coinConstructor);
  });
};
