type ToPlainObjectOpts = {
  propertyDescriptors?: boolean;
  skipUndefinedValues?: boolean;
  ignorePaths?: string[] | ((path: PathElement[]) => boolean);
  apply?: (v: unknown, path: PathElement[]) => unknown;
};
export type PathElement = string | number;

export function matchPath(a: PathElement[], b: PathElement[]): boolean {
  return a.length === b.length && a.every((e, i) => e === b[i]);
}

function includePath(opts: ToPlainObjectOpts, path: PathElement[]): boolean {
  if (!opts.ignorePaths) {
    return true;
  }
  if (typeof opts.ignorePaths === 'function') {
    return !opts.ignorePaths(path);
  }
  return !opts.ignorePaths.some((ignorePath) => matchPath(path, ignorePath.split('.')));
}

function toPlainEntries(
  key: string,
  value: string,
  opts: ToPlainObjectOpts,
  path: PathElement[]
): [] | [[string, unknown]] {
  if (!includePath(opts, [...path, key])) {
    return [];
  }
  if (value === undefined && (opts.skipUndefinedValues ?? true)) {
    return [];
  }
  return [[key, toPlainObject(value, opts, [...path, key])]];
}

function toPlainObjectFromPropertyDescriptors(v: unknown, opts: ToPlainObjectOpts, path: PathElement[]) {
  const descriptors = Object.getOwnPropertyDescriptors(v);
  return Object.fromEntries(
    Object.entries(descriptors).flatMap(([key, descriptor]) => {
      if (descriptor.value !== undefined) {
        return toPlainEntries(key, descriptor.value, opts, path);
      }
      if (typeof descriptor.get === 'function') {
        return toPlainEntries(key, descriptor.get.call(v), opts, path);
      }
      return [];
    })
  );
}

export function toPlainObject(v: unknown, opts: ToPlainObjectOpts, path: PathElement[]): unknown {
  if (opts.apply) {
    const result = opts.apply(v, path);
    if (result !== undefined) {
      return result;
    }
  }

  switch (typeof v) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
      return v;
    case 'bigint':
      return v.toString();
    case 'function':
    case 'symbol':
      return undefined;
  }

  if (v === null) {
    return v;
  }

  if (Buffer.isBuffer(v)) {
    return v.toString('hex');
  }
  if (Array.isArray(v)) {
    return v.map((e, i) => toPlainObject(e, opts, [...path, i]));
  }
  if (typeof v === 'object') {
    const result = Object.fromEntries(
      Object.entries(v).flatMap(([key, value]) => toPlainEntries(key, value, opts, path))
    );
    if (opts.propertyDescriptors) {
      Object.assign(result, toPlainObjectFromPropertyDescriptors(v, opts, path));
    }
    return result;
  }
  throw new Error(`unknown v ${typeof v}`);
}
