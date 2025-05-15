import { BitGoBase } from '@bitgo/sdk-core';
import { Apt } from './apt';
import { Tapt } from './tapt';
import { AptToken } from './aptToken';
import { AptNFTCollection } from './aptNFTCollection';

export const register = (sdk: BitGoBase): void => {
  sdk.register('apt', Apt.createInstance);
  sdk.register('tapt', Tapt.createInstance);
  AptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
  AptNFTCollection.createNFTCollectionConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
