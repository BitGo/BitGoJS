import { sbtc } from '@bitgo/utxo-descriptors';
import { bip32, Descriptor } from '@bitgo/wasm-utxo';

type DescriptorWithKeys<TName extends string> = {
  name: TName;
  keys: bip32.BIP32Interface[];
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
  | (DescriptorWithKeys<'ShWsh2Of3CltvDrop' | 'Wsh2Of3CltvDrop'> & { locktime: number })
  /*
   * sBTC peg-in deposit Taproot descriptor:
   *   tr(<UNSPENDABLE>,
   *     {
   *       c:and_v(payload_drop(<feeBE||recipient>), pk_k(<signersKey>)),
   *       and_v(r:older(<lockTime>), multi_a(2, k1/*, k2/*, k3/*))
   *     }
   *   )
   *
   * `keys` are the three reclaim keys used in the reclaim-leaf multi_a.
   */
  | (DescriptorWithKeys<'SbtcDeposit'> & {
      lockTime: number;
      maxFee: bigint;
      stacksRecipient: Buffer;
      signersAggregateKey: Buffer;
    });

function toXPub(k: bip32.BIP32Interface | string): string {
  if (typeof k === 'string') {
    return k;
  }
  return k.neutered().toBase58();
}

function multi(m: number, n: number, keys: bip32.BIP32Interface[] | string[], path: string): string {
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
    case 'SbtcDeposit':
      // The reclaim leaf always uses `/*` wildcard derivation; `createSbtcDepositDescriptor`
      // hardcodes that suffix when given BIP32 keys, so reject any other path here.
      if (builder.path !== '*') {
        throw new Error(`SbtcDeposit path must be '*', got '${builder.path}'`);
      }
      if (builder.keys.length !== 3) {
        throw new Error(`SbtcDeposit needs exactly 3 reclaim keys, got ${builder.keys.length}`);
      }
      return sbtc.createSbtcDepositDescriptor({
        walletKeys: [builder.keys[0], builder.keys[1], builder.keys[2]],
        lockTime: builder.lockTime,
        maxFee: builder.maxFee,
        stacksRecipient: builder.stacksRecipient,
        signersAggregateKey: builder.signersAggregateKey,
      });
  }
  throw new Error(`Unknown descriptor template: ${builder}`);
}

export function getDescriptorFromBuilder(builder: DescriptorBuilder): Descriptor {
  return Descriptor.fromString(getDescriptorString(builder), 'derivable');
}
