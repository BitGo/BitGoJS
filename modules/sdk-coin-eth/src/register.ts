import { BitGoBase } from '@bitgo/sdk-core';
import { Erc20Token } from './erc20Token';
import { Eth } from './eth';
import { Gteth } from './gteth';
import { Teth } from './teth';

export const register = (sdk: BitGoBase): void => {
  sdk.register('eth', Eth.createInstance);
  sdk.register('gteth', Gteth.createInstance);
  sdk.register('teth', Teth.createInstance);
  Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
