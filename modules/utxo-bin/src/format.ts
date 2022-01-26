import { Chalk, Instance } from 'chalk';
import * as archy from 'archy';
import { TxNode, TxNodeValue } from './parse';

export function formatTree(n: TxNode, chalk: Chalk = new Instance()): string {
  function getLabel(label: string | number, v?: unknown): string {
    const arr = [chalk.bold(label)];
    if (v !== undefined) {
      arr.push(String(v));
    }
    return arr.join(': ');
  }

  function getLabelFromValue(v: TxNodeValue): string | undefined {
    switch (typeof v) {
      case 'undefined':
        return undefined;
      case 'boolean':
      case 'number':
      case 'string':
        return String(v);
      case 'object':
        if (v === null) {
          return String(v);
        }
        if (Buffer.isBuffer(v)) {
          return v.length === 0 ? '[]' : v.toString('hex');
        }
    }
    throw new Error(`could not get lavel from value`);
  }

  function toArchy(n: TxNode): archy.Data {
    return {
      label: getLabel(n.label, getLabelFromValue(n.value)),
      nodes: n.nodes ? n.nodes.map((e) => toArchy(e)) : undefined,
    };
  }

  return archy(toArchy(n));
}
