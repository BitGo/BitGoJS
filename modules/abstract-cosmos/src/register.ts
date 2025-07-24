import { BitGoBase } from '@bitgo/sdk-core';
import { CosmosToken } from './cosmosToken';

export const register = (sdk: BitGoBase): void => {
  CosmosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
