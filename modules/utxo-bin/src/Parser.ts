export type ParserNodeValue = number | string | Buffer | boolean | undefined | null;

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
