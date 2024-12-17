import { BIP32Interface } from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

type DescriptorWithKeys<TName extends string> = {
  name: TName;
  keys: BIP32Interface[];
  path: string;
};

export type DescriptorBuilder =
  | DescriptorWithKeys<'Wsh2Of2'>
  | DescriptorWithKeys<'Wsh2Of3'>
  /*
   * This is a segwit (wrapped or native) 2of3 multisig that also uses a
   * relative locktime with an OP_DROP (requiring a miniscript extension).
   * It is basically what is used in CoreDao staking transactions.
   */
  | (DescriptorWithKeys<'ShWsh2Of3CltvDrop' | 'Wsh2Of3CltvDrop'> & { locktime: number });

function toXPub(k: BIP32Interface | string): string {
  if (typeof k === 'string') {
    return k;
  }
  return k.neutered().toBase58();
}

function multi(m: number, n: number, keys: BIP32Interface[] | string[], path: string): string {
  if (n < m) {
    throw new Error(`Cannot create ${m} of ${n} multisig`);
  }
  if (keys.length < n) {
    throw new Error(`Not enough keys for ${m} of ${n} multisig: keys.length=${keys.length}`);
  }
  keys = keys.slice(0, n);
  return `multi(${m},${keys.map((k) => `${toXPub(k)}/${path}`).join(',')})`;
}

function getDescriptorString(builder: DescriptorBuilder): string {
  switch (builder.name) {
    case 'Wsh2Of3':
      return `wsh(${multi(2, 3, builder.keys, builder.path)})`;
    case 'Wsh2Of2':
      return `wsh(${multi(2, 2, builder.keys, builder.path)})`;
    case 'Wsh2Of3CltvDrop':
      return `wsh(and_v(r:after(${builder.locktime}),${multi(2, 3, builder.keys, builder.path)}))`;
    case 'ShWsh2Of3CltvDrop':
      return `sh(${getDescriptorString({ ...builder, name: 'Wsh2Of3CltvDrop' })})`;
  }
  throw new Error(`Unknown descriptor template: ${builder}`);
}

export function getDescriptorFromBuilder(builder: DescriptorBuilder): Descriptor {
  return Descriptor.fromString(getDescriptorString(builder), 'derivable');
}
