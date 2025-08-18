import { BitGoBase } from '@bitgo/sdk-core';
import { CosmosToken } from '@bitgo/abstract-cosmos';
import { Hash } from './hash';
import { Thash } from './thash';

export const register = (sdk: BitGoBase): void => {
  sdk.register('hash', Hash.createInstance);
  sdk.register('thash', Thash.createInstance);
  CosmosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    const baseCoin = name.split(':')[0];
    if (baseCoin === 'hash' || baseCoin === 'thash') {
      sdk.register(name, coinConstructor);
    }
  });
};
