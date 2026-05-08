import { isParserNodeValue, Parser, ParserNode, ParserNodeValue } from './Parser';

function omitObject(v: unknown): boolean {
  return typeof v === 'function';
}

function getPrototypeKeys(obj: unknown): string[] {
  const keys: string[] = [];
  let proto = obj;
  while (proto && proto !== Object.prototype) {
    keys.push(...Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
  }
  return keys;
}

export function parseUnknown(
  p: Parser,
  label: string | number,
  obj: unknown,
  { omit = [] }: { omit?: string[] } = {}
): ParserNode {
  if (isParserNodeValue(obj)) {
    if (typeof obj === 'string') {
      obj = JSON.stringify(obj);
    }
    return p.node(label, obj as ParserNodeValue);
  }

  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`expected object, got ${typeof obj}`);
  }

  if (Array.isArray(obj)) {
    return p.node(
      label,
      `length: ${obj.length}`,
      obj.filter((v) => !omitObject(v)).map((v, i) => parseUnknown(p, i, v))
    );
  }

  const allKeys = getPrototypeKeys(obj);
  if (allKeys.length > 0) {
    return p.node(
      label,
      undefined,
      allKeys.flatMap((k) => {
        const objAsRecord = obj as Record<string, unknown>;
        if (omitObject(objAsRecord[k]) || omit?.includes(k)) {
          return [];
        }
        try {
          return [parseUnknown(p, k, objAsRecord[k])];
        } catch (e) {
          return [p.node(k, `Error: ${e.message}}`)];
        }
      })
    );
  } else {
    return p.node(label, '{}');
  }
}
