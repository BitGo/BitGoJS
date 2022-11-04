import { Chalk, Instance } from 'chalk';
import * as archy from 'archy';
import { ParserNode, ParserNodeValue } from './Parser';

const hideDefault = ['pubkeys', 'sequence', 'locktime', 'scriptSig', 'witness'];

export function formatSat(v: number): string {
  return (v / 1e8).toFixed(8);
}

export function formatTree(
  n: ParserNode,
  { hide = hideDefault, chalk = new Instance() }: { hide?: string[]; chalk?: Chalk } = {}
): string {
  function getLabel(label: string | number, v?: unknown): string {
    const arr = [chalk.bold(label)];
    if (v !== undefined) {
      arr.push(String(v));
    }
    return arr.join(': ');
  }

  function getLabelFromValue(v: ParserNodeValue): string | undefined {
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
    throw new Error(`could not get label from value`);
  }

  function toArchy(n: ParserNode): archy.Data {
    return {
      label: getLabel(n.label, getLabelFromValue(n.value)),
      nodes: n.nodes ? n.nodes.flatMap((e) => (hide.includes(e.label) ? [] : [toArchy(e)])) : undefined,
    };
  }

  return archy(toArchy(n));
}
