import { BitGoBase } from '@bitgo/sdk-core';
import { Erc20Token } from './erc20Token';
import { Eth } from './eth';
import { Gteth } from './gteth';
import { Hteth } from './hteth';
import { Teth } from './teth';
import { Erc721Token } from './erc721Token';
import { type CoinMap, getFormattedErc20Tokens } from '@bitgo/statics';

export const register = (sdk: BitGoBase): void => {
  sdk.register('eth', Eth.createInstance);
  sdk.register('gteth', Gteth.createInstance);
  sdk.register('teth', Teth.createInstance);
  sdk.register('hteth', Hteth.createInstance);
  Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
  Erc721Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};

export const registerWithCoinMap = (sdk: BitGoBase, coinMap: CoinMap): void => {
  Erc20Token.createTokenConstructors(getFormattedErc20Tokens(coinMap)).forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
