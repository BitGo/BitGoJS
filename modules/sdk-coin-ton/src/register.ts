import { BitGoBase } from '@bitgo/sdk-core';
import { Ton } from './ton';
import { Tton } from './tton';
import { JettonToken } from './jettonToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('ton', Ton.createInstance);
  sdk.register('tton', Tton.createInstance);
  JettonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
