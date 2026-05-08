import { Chalk, Instance } from 'chalk';
import archy from 'archy';

import { Parser, ParserNode, ParserNodeValue } from './Parser';
import { parseUnknown } from './parseUnknown';

const hideDefault = ['pubkeys', 'sequence', 'locktime', 'scriptSig', 'witness'];

export function formatSat(v: number | bigint): string {
  return (Number(v) / 1e8).toFixed(8);
}

type FormatOptions = {
  hide?: string[];
  chalk?: Chalk;
};

function getDefaultChalk(): Chalk {
  if (process.env.NO_COLOR) {
    return new Instance({ level: 0 });
  }
  return new Instance();
}

export function formatTree(
  n: ParserNode,
  { hide = hideDefault, chalk = getDefaultChalk() }: FormatOptions = {}
): string {
  function getLabel(
    label: string | number,
    v?: unknown,
    { showUndefined }: { showUndefined: boolean } = { showUndefined: false }
  ): string {
    const arr = [chalk.bold(label)];
    if (v === undefined) {
      if (showUndefined) {
        arr.push(chalk.dim('undefined'));
      }
    } else {
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
      case 'bigint':
        return String(v);
      case 'object':
        if (v === null) {
          return String(v);
        }
        if (Buffer.isBuffer(v)) {
          return `${v.toString('hex')} ${chalk.dim(`(${v.length} bytes)`)}`;
        }
        if (v instanceof Uint8Array) {
          return getLabelFromValue(Buffer.from(v));
        }
    }
    throw new Error(`could not get label from value ${typeof v}`);
  }

  function toArchy(n: ParserNode): archy.Data {
    return {
      label: getLabel(n.label, getLabelFromValue(n.value), { showUndefined: !Boolean(n.nodes?.length) }),
      nodes: n.nodes ? n.nodes.flatMap((e) => (hide.includes(e.label) ? [] : [toArchy(e)])) : undefined,
    };
  }

  return archy(toArchy(n));
}

export function formatObjAsTree(
  label: string | number,
  obj: unknown,
  { hide = hideDefault, chalk = getDefaultChalk() }: FormatOptions = {}
): string {
  const p = new Parser({ parseError: 'continue' });
  const node = parseUnknown(p, label, obj, { omit: hide });
  return formatTree(node, { hide, chalk });
}
