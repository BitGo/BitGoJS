import * as utxolib from '@bitgo/utxo-lib';
import { Parser, ParserNode } from './Parser';
import { parseUnknown } from './parseUnknown';

export function parseXpub(xpub: string, params: { derive?: string }): ParserNode {
  if (!xpub.startsWith('xpub')) {
    throw new Error('expected xpub');
  }
  const parser = new Parser();
  let xpubObj = utxolib.bip32.fromBase58(xpub);
  if (params.derive) {
    xpubObj = xpubObj.derivePath(params.derive);
  }
  const node = parseUnknown(parser, 'xpub', xpubObj, {
    omit: ['network', '__Q', '__D', '__DEPTH', '__INDEX', '__PARENT_FINGERPRINT'],
  });
  node.value = xpubObj.toBase58();
  return node;
}
