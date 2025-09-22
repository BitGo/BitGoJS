import { BitGoBase } from '@bitgo-beta/sdk-core';
import { Polyx } from './polyx';
import { Tpolyx } from './tpolyx';
import { PolyxToken } from './polyxToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('polyx', Polyx.createInstance);
  sdk.register('tpolyx', Tpolyx.createInstance);
  PolyxToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
