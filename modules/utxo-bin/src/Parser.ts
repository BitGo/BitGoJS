export type ParserNodeValue = number | bigint | string | Buffer | Uint8Array | boolean | undefined | null;

export function isParserNodeValue(v: unknown): v is ParserNodeValue {
  switch (typeof v) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
      return true;
    case 'object':
      return v === null || Buffer.isBuffer(v) || v instanceof Uint8Array;
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
  parseError: 'throw' | 'continue';
  constructor(params: { parseError?: 'throw' | 'continue' } = {}) {
    this.parseError = params.parseError ?? 'continue';
  }
  node(label: string | number, value: ParserNodeValue, nodes: ParserNode[] = []): ParserNode {
    if (!isParserNodeValue(value)) {
      throw new Error(`invalid node value ${typeof value}`);
    }
    return {
      type: 'node',
      label: String(label),
      value,
      nodes,
    };
  }

  handleParseError(e: unknown): ParserNode {
    if (this.parseError === 'throw') {
      throw e;
    }
    return this.node('error', String(e));
  }
}
