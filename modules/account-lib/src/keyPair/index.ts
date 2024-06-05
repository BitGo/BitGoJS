import * as coinModules from '..';
import { BaseKeyPair, KeyPairOptions, NotSupported } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';

export function register(coinName: string, source?: KeyPairOptions): BaseKeyPair {
  const sanitizedCoinName = coins.get(coinName.trim().toLowerCase()).family;
  const key = Object.keys(coinModules)
    .filter((k) => coinModules[k].KeyPair)
    .find((k) => k.trim().toLowerCase() === sanitizedCoinName);
  if (key) {
    return new coinModules[key].KeyPair(source);
  }
  throw new NotSupported(`Coin ${coinName} not supported`);
}
