import { BIP32Interface } from '@bitgo/utxo-lib';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { DescriptorBuilder, getDescriptorFromBuilder } from './builder';

type NodeUnary<Key extends string> = { [k in Key]: unknown };

function isUnaryNode<TKey extends string>(node: unknown, key: TKey): node is NodeUnary<TKey> {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  const keys = Object.keys(node);
  return keys.length === 1 && keys[0] === key;
}

function unwrapNode(node: unknown, path: string[]): unknown {
  let current = node;
  for (const key of path) {
    if (!isUnaryNode(current, key)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function parseMulti(node: unknown): {
  threshold: number;
  keys: BIP32Interface[];
  path: string;
} {
  if (!Array.isArray(node)) {
    throw new Error('Unexpected node');
  }
  const [threshold, ...keyNodes] = node;
  if (typeof threshold !== 'number') {
    throw new Error('Expected threshold number');
  }
  const keyWithPath = keyNodes.map((keyNode) => {
    if (!isUnaryNode(keyNode, 'XPub')) {
      throw new Error('Expected XPub node');
    }
    if (typeof keyNode.XPub !== 'string') {
      throw new Error('Expected XPub string');
    }
    const parts = keyNode.XPub.split('/');
    return { xpub: parts[0], path: parts.slice(1).join('/') };
  });
  const paths = keyWithPath.map((k) => k.path);
  paths.forEach((path, i) => {
    if (path !== paths[0]) {
      throw new Error(`Expected all paths to be the same: ${path} !== ${paths[0]}`);
    }
  });
  return {
    threshold,
    keys: keyWithPath.map((k) => utxolib.bip32.fromBase58(k.xpub)),
    path: paths[0],
  };
}

export function parseDescriptorNode(node: unknown): DescriptorBuilder {
  const wshMsMulti = unwrapNode(node, ['Wsh', 'Ms', 'Multi']);
  if (wshMsMulti) {
    const { threshold, keys, path } = parseMulti(wshMsMulti);
    let name;
    if (threshold === 2 && keys.length === 2) {
      name = 'Wsh2Of2';
    } else if (threshold === 2 && keys.length === 3) {
      name = 'Wsh2Of3';
    } else {
      throw new Error('Unexpected multisig');
    }
    return {
      name,
      keys,
      path,
    };
  }

  const shWshMsAndV = unwrapNode(node, ['Sh', 'Wsh', 'Ms', 'AndV']);
  if (shWshMsAndV) {
    if (Array.isArray(shWshMsAndV) && shWshMsAndV.length === 2) {
      const [a, b] = shWshMsAndV;
      const dropAfterAbsLocktime = unwrapNode(a, ['Drop', 'After', 'absLockTime']);
      if (typeof dropAfterAbsLocktime !== 'number') {
        throw new Error('Expected absLockTime number');
      }
      if (!isUnaryNode(b, 'Multi')) {
        throw new Error('Expected Multi node');
      }
      const multi = parseMulti(b.Multi);
      if (multi.threshold === 2 && multi.keys.length === 3) {
        return {
          name: 'ShWsh2Of3CltvDrop',
          locktime: dropAfterAbsLocktime,
          keys: multi.keys,
          path: multi.path,
        };
      }
    }
  }

  throw new Error('Not implemented');
}

export function parseDescriptor(descriptor: Descriptor): DescriptorBuilder {
  const builder = parseDescriptorNode(descriptor.node());
  if (getDescriptorFromBuilder(builder).toString() !== descriptor.toString()) {
    throw new Error('Failed to parse descriptor');
  }
  return builder;
}
