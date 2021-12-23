import * as coinModules from '..';
import { BaseKeyPair } from '../coin/baseCoin';
import { KeyPairOptions } from '../coin/baseCoin/iface';

export function register(coinName: string, source?: KeyPairOptions): BaseKeyPair {
  const sanitizedCoinName = coinName.trim().toLowerCase();
  const key = Object.keys(coinModules)
    .filter((k) => coinModules[k].KeyPair)
    // TODO(BG-40990): eth2 BLS keypair init error
    .find((k) => k.trim().toLowerCase() !== 'eth2' && k.trim().toLowerCase() === sanitizedCoinName);
  if (key) {
    return new coinModules[key].KeyPair(source);
  }
  return {} as BaseKeyPair;
}
