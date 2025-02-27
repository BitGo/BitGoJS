import assert from 'assert';

import { Descriptor, ast } from '@bitgo/wasm-miniscript';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';

import { DescriptorMap, PsbtParams } from '../../descriptor';
import { getKeyTriple, Triple, KeyTriple } from '../key.utils';

export function getDefaultXPubs(seed?: string): Triple<string> {
  return getKeyTriple(seed).map((k) => k.neutered().toBase58()) as Triple<string>;
}

export function getUnspendableKey(): string {
  /*
  https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#constructing-and-spending-taproot-outputs

  ```
  If one or more of the spending conditions consist of just a single key (after aggregation), the most likely one should
  be made the internal key. If no such condition exists, it may be worthwhile adding one that consists of an aggregation
  of all keys participating in all scripts combined; effectively adding an "everyone agrees" branch. If that is
  inacceptable, pick as internal key a "Nothing Up My Sleeve" (NUMS) point, i.e., a point with unknown discrete
  logarithm.

  One example of such a point is H = lift_x(0x50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0) which is
  constructed by taking the hash of the standard uncompressed encoding of the secp256k1 base point G as X coordinate.
  In order to avoid leaking the information that key path spending is not possible it is recommended to pick a fresh
  integer r in the range 0...n-1 uniformly at random and use H + rG as internal key. It is possible to prove that this
  internal key does not have a known discrete logarithm with respect to G by revealing r to a verifier who can then
  reconstruct how the internal key was created.
  ```

  We could do the random integer trick here, but for internal testing it is sufficient to use the fixed point.
  */
  return '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';
}

function toDescriptorMap(v: Record<string, string>): DescriptorMap {
  return new Map(Object.entries(v).map(([k, v]) => [k, Descriptor.fromString(v, 'derivable')]));
}

export type DescriptorTemplate =
  | 'Wsh2Of3'
  | 'Tr1Of3-NoKeyPath-Tree'
  // no xpubs, just plain keys
  | 'Tr1Of3-NoKeyPath-Tree-Plain'
  | 'Tr2Of3-NoKeyPath'
  | 'Wsh2Of2'
  /*
   * This is a wrapped segwit 2of3 multisig that also uses a relative locktime with
   * an OP_DROP (requiring a miniscript extension).
   * It is basically what is used in CoreDao staking transactions.
   */
  | 'Wsh2Of3CltvDrop';

function toXPub(k: BIP32Interface | string, path: string): string {
  if (typeof k === 'string') {
    return k + '/' + path;
  }
  return k.neutered().toBase58() + '/' + path;
}

function toPlain(k: BIP32Interface | string, { xonly = false } = {}): string {
  if (typeof k === 'string') {
    if (k.startsWith('xpub') || k.startsWith('xprv')) {
      return toPlain(bip32.fromBase58(k), { xonly });
    }
    return k;
  }
  return k.publicKey.subarray(xonly ? 1 : 0).toString('hex');
}

function toXOnly(k: BIP32Interface | string): string {
  return toPlain(k, { xonly: true });
}

function multiArgs(m: number, n: number, keys: BIP32Interface[] | string[], path: string): [number, ...string[]] {
  if (n < m) {
    throw new Error(`Cannot create ${m} of ${n} multisig`);
  }
  if (keys.length < n) {
    throw new Error(`Not enough keys for ${m} of ${n} multisig: keys.length=${keys.length}`);
  }
  keys = keys.slice(0, n);
  return [m, ...keys.map((k) => toXPub(k, path))];
}

export function getPsbtParams(t: DescriptorTemplate): Partial<PsbtParams> {
  switch (t) {
    case 'Wsh2Of3CltvDrop':
      return { locktime: 1 };
    default:
      return {};
  }
}

function getDescriptorNode(
  template: DescriptorTemplate,
  keys: KeyTriple | string[] = getDefaultXPubs(),
  path = '0/*'
): ast.DescriptorNode {
  switch (template) {
    case 'Wsh2Of3':
      return {
        wsh: { multi: multiArgs(2, 3, keys, path) },
      };
    case 'Wsh2Of3CltvDrop':
      const { locktime } = getPsbtParams(template);
      assert(locktime);
      return {
        wsh: {
          and_v: [{ 'r:after': locktime }, { multi: multiArgs(2, 3, keys, path) }],
        },
      };
    case 'Wsh2Of2':
      return {
        wsh: { multi: multiArgs(2, 2, keys, path) },
      };
    case 'Tr2Of3-NoKeyPath':
      return {
        tr: [getUnspendableKey(), { multi_a: multiArgs(2, 3, keys, path) }],
      };
    case 'Tr1Of3-NoKeyPath-Tree':
      return {
        tr: [
          getUnspendableKey(),
          [{ pk: toXPub(keys[0], path) }, [{ pk: toXPub(keys[1], path) }, { pk: toXPub(keys[2], path) }]],
        ],
      };
    case 'Tr1Of3-NoKeyPath-Tree-Plain':
      return {
        tr: [getUnspendableKey(), [{ pk: toXOnly(keys[0]) }, [{ pk: toXOnly(keys[1]) }, { pk: toXOnly(keys[2]) }]]],
      };
  }
  throw new Error(`Unknown descriptor template: ${template}`);
}

export function getDescriptor(
  template: DescriptorTemplate,
  keys: KeyTriple | string[] = getDefaultXPubs(),
  path = '0/*'
): Descriptor {
  return Descriptor.fromStringDetectType(ast.formatNode(getDescriptorNode(template, keys, path)));
}

export function getDescriptorMap(
  template: DescriptorTemplate,
  keys: KeyTriple | string[] = getDefaultXPubs()
): DescriptorMap {
  return toDescriptorMap({
    external: getDescriptor(template, keys, '0/*').toString(),
    internal: getDescriptor(template, keys, '1/*').toString(),
  });
}
