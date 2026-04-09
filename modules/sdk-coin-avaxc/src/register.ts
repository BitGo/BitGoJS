import { BitGoBase } from '@bitgo/sdk-core';
import { AvaxC } from './avaxc';
import { AvaxCToken } from './avaxcToken';
import { TavaxC } from './tavaxc';

export const register = (sdk: BitGoBase): void => {
  sdk.register('avaxc', AvaxC.createInstance);
  sdk.register('tavaxc', TavaxC.createInstance);
  AvaxCToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
