export type ParserNodeValue = number | bigint | string | Buffer | boolean | undefined | null;

export function isParserNodeValue(v: unknown): v is ParserNodeValue {
  switch (typeof v) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
      return true;
    case 'object':
      return v === null || Buffer.isBuffer(v);
  }
  return false;
}

export type ParserNode = {
  type: 'node';
  label: string;
  value: ParserNodeValue | undefined;
  nodes: ParserNode[] | undefined;
};

export class Parser {
  node(label: string | number, value: ParserNodeValue, nodes: ParserNode[] = []): ParserNode {
    return {
      type: 'node',
      label: String(label),
      value,
      nodes,
    };
  }
}
