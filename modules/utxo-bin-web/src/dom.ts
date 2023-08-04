import { ParserNode } from '@bitgo/utxo-bin';

export function createEl(
  d: Document,
  tag: string,
  props: {
    className?: string;
    textContent?: string;
    children?: HTMLElement[];
  }
): HTMLElement {
  const el = d.createElement(tag);
  if (props.className !== undefined) {
    el.className = props.className;
  }
  if (props.textContent !== undefined) {
    el.textContent = props.textContent;
  }
  for (const child of props.children ?? []) {
    el.appendChild(child);
  }
  return el;
}

export function getClassNameForValue(v: ParserNode['value']): string {
  return typeof v;
}

export function toTextContent(v: ParserNode['value']): string {
  switch (typeof v) {
    case 'undefined':
      return 'undefined';
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
        return `${v.toString('hex')} (${v.length} bytes)`;
      }
  }
  return 'unknown ${typeof v}';
}

export function toDomNode(d: Document, node: ParserNode): HTMLElement {
  return createEl(d, 'ul', {
    className: 'tree-view',
    children: [
      createEl(d, 'div', {
        className: 'label',
        textContent: node.label + '\u205F' /* word separator space */,
      }),
      // createEl(d, 'div', {}),
      createEl(d, 'div', {
        className: ['value', getClassNameForValue(node.value)].join(' '),
        textContent: toTextContent(node.value),
      }),
      ...(node.nodes ?? []).map((child) => {
        return createEl(d, 'li', {
          className: 'child',
          children: [toDomNode(d, child)],
        });
      }),
    ],
  });
}

export function setDocumentContent(d: Document, p: ParserNode): void {
  const n = toDomNode(d, p);
  n.className += ' root';
  d.body.textContent = '';
  d.body.appendChild(n);
}
