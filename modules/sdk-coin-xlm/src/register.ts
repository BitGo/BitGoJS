import { BitGoBase } from '@bitgo/sdk-core';
import { StellarToken } from './stellarToken';
import { Txlm } from './txlm';
import { Xlm } from './xlm';

export const register = (sdk: BitGoBase): void => {
  sdk.register('txlm', Txlm.createInstance);
  sdk.register('xlm', Xlm.createInstance);
  StellarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
