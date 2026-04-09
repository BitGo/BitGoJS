import * as utxolib from '@bitgo/utxo-lib';

import { Parser, ParserNode } from './Parser';
import { parseUnknown } from './parseUnknown';

export function parseBip32(bip32Key: string, params: { derive?: string }): ParserNode {
  const parser = new Parser();
  let bip32 = utxolib.bip32.fromBase58(bip32Key);
  if (params.derive) {
    bip32 = bip32.derivePath(params.derive);
  }
  const label = bip32.isNeutered() ? 'xpub' : 'xprv';
  const node = parseUnknown(parser, label, bip32, {
    omit: ['network', '__Q', '__D', '__DEPTH', '__INDEX', '__PARENT_FINGERPRINT'],
  });
  if (!bip32.isNeutered()) {
    node.nodes?.unshift(parser.node('xpub', bip32.neutered().toBase58()));
  }
  node.value = bip32.toBase58();
  return node;
}
