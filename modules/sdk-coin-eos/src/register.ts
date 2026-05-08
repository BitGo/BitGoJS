import { BitGoBase } from '@bitgo/sdk-core';
import { Eos } from './eos';
import { EosToken } from './eosToken';
import { Teos } from './teos';

export const register = (sdk: BitGoBase): void => {
  sdk.register('eos', Eos.createInstance);
  sdk.register('teos', Teos.createInstance);
  EosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
