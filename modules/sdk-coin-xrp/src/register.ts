import { BitGoBase } from '@bitgo/sdk-core';
import { Txrp } from './txrp';
import { Xrp } from './xrp';
import { XrpToken } from './xrpToken';
import { XrpMptToken } from './xrpMptToken';

export const register = (sdk: BitGoBase): void => {
  sdk.register('xrp', Xrp.createInstance);
  sdk.register('txrp', Txrp.createInstance);
  XrpToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
  XrpMptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
