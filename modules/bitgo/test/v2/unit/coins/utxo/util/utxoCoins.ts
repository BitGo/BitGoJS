/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import * as coins from '../../../../../../src/v2/coins';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../../src/bitgo';

const AbstractUtxoCoinCtor = AbstractUtxoCoin as unknown as ObjectConstructor;

function getPrototypeChain(c: ObjectConstructor): ObjectConstructor[] {
  if (!c) {
    return [];
  }
  return [c, ...getPrototypeChain(Object.getPrototypeOf(c))];
}

function hasAbstractUtxoCoinPrototype(c: ObjectConstructor): boolean {
  return getPrototypeChain(c).includes(AbstractUtxoCoinCtor);
}

export const defaultBitGo = TestBitGo.decorate(BitGo, { env: 'mock' });

function getUtxoCoins(bitgo: BitGo = defaultBitGo): AbstractUtxoCoin[] {
  return Object.values(coins)
    .map((c) => c as unknown as ObjectConstructor)
    .filter((cls) => hasAbstractUtxoCoinPrototype(cls) && cls !== AbstractUtxoCoinCtor)
    .map((cls) => {
      try {
        return new cls(bitgo) as AbstractUtxoCoin;
      } catch (e) {
        throw new Error(`error creating ${cls.name}: ${e}`);
      }
    })
    .sort((a, b) => utxolib.getNetworkList().indexOf(a.network) - utxolib.getNetworkList().indexOf(b.network));
}

export const utxoCoins = getUtxoCoins();

export function getUtxoCoin(name: string): AbstractUtxoCoin {
  for (const c of utxoCoins) {
    if (c.getChain() === name) {
      return c;
    }
  }
  throw new Error(`no coin with name ${name}`);
}

export function getUtxoCoinForNetwork(n: utxolib.Network): AbstractUtxoCoin {
  for (const c of utxoCoins) {
    if (c.network === n) {
      return c;
    }
  }
  throw new Error(`no coin for network ${utxolib.getNetworkName(n)}`);
}
