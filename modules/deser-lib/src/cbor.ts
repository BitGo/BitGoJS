import { decodeFirstSync, encodeCanonical } from 'cbor';

/**
 * Return a string describing value as a type.
 * @param value - Any javascript value to type.
 * @returns String describing value type.
 */
function getType(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (value instanceof Array) {
    const types = value.map(getType);
    if (!types.slice(1).every((value) => value === types[0])) {
      throw new Error('Array elements are not of the same type');
    }
    return JSON.stringify([types[0]]);
  }
  if (value instanceof Object) {
    const properties = Object.getOwnPropertyNames(value);
    properties.sort();
    return JSON.stringify(
      properties.reduce((acc, name) => {
        acc[name] = getType(value[name]);
        return acc;
      }, {})
    );
  }
  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return 'bytes';
    }
    return 'string';
  }
  return JSON.stringify(typeof value);
}

/**
 * Compare two buffers for sorting.
 * @param a - left buffer to compare to right buffer.
 * @param b - right buffer to compare to left buffer.
 * @returns Negative if a < b, positive if b > a, 0 if equal.
 */
function bufferCompare(a: Buffer, b: Buffer): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] == b[i]) {
    i++;
  }
  if (i === a.length && i === b.length) {
    return 0;
  }
  if (i === a.length || i === b.length) {
    return a.length - b.length;
  }
  return a[i] - b[i];
}

/** A sortable array element. */
type Sortable = {
  weight: number;
  value?: unknown;
};

/**
 * Type check for sortable array element.
 * @param value - Value to type check.
 * @returns True if value is a sortable array element.
 */
function isSortable(value: unknown): value is Sortable {
  return value instanceof Object && 'weight' in value && typeof (value as Sortable).weight === 'number';
}

/**
 * Convert number to base 256 and return as a big-endian Buffer.
 * @param value - Value to convert.
 * @returns Buffer representation of the number.
 */
function numberToBufferBE(value: number): Buffer {
  // Normalize value so that negative numbers aren't compared higher
  // than positive numbers when accounting for two's complement.
  value += Math.pow(2, 52);
  const byteCount = Math.floor((value.toString(2).length + 7) / 8);
  const buffer = Buffer.alloc(byteCount);
  let i = 0;
  while (value) {
    buffer[i++] = value % 256;
    value = Math.floor(value / 256);
  }
  return buffer.reverse();
}

/**
 * Compare two array elements for sorting.
 * @param a - left element to compare to right element.
 * @param b - right element to compare to left element.
 * @returns Negative if a < b, positive if b > a, 0 if equal.
 */
function elementCompare(a: unknown, b: unknown): number {
  if (!isSortable(a) || !isSortable(b)) {
    throw new Error('Array elements must be sortable');
  }
  if (a.weight === b.weight) {
    if (a.value === undefined && b.value === undefined) {
      throw new Error('Array elements must be sortable');
    }
    const aVal = transform(a.value);
    const bVal = transform(b.value);
    if (
      (!Buffer.isBuffer(aVal) && typeof aVal !== 'string' && typeof aVal !== 'number') ||
      (!Buffer.isBuffer(bVal) && typeof bVal !== 'string' && typeof bVal !== 'number')
    ) {
      throw new Error('Array element value cannot be compared');
    }
    let aBuf, bBuf;
    if (typeof aVal === 'number') {
      aBuf = numberToBufferBE(aVal);
    } else {
      aBuf = Buffer.from(aVal);
    }
    if (typeof bVal === 'number') {
      bBuf = numberToBufferBE(bVal);
    } else {
      bBuf = Buffer.from(bVal);
    }
    return bufferCompare(aBuf, bBuf);
  }
  return a.weight - b.weight;
}

/**
 * Transform value into its canonical, serializable form.
 * @param value - Value to transform.
 * @returns Canonical, serializable form of value.
 */
export function transform<T>(value: T): T | Buffer {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    // Transform hex strings to buffers.
    if (value.startsWith('0x')) {
      if (!value.match(/^0x([0-9a-fA-F]{2})*$/)) {
        throw new Error('0x prefixed string contains non-hex characters.');
      }
      return Buffer.from(value.slice(2), 'hex');
    } else if (value.startsWith('\\0x')) {
      return value.slice(1) as unknown as T;
    }
  } else if (value instanceof Array) {
    // Enforce array elements are same type.
    getType(value);
    value = [...value] as unknown as T;
    (value as unknown as Array<unknown>).sort(elementCompare);
    return (value as unknown as Array<unknown>).map(transform) as unknown as T;
  } else if (value instanceof Object) {
    const properties = Object.getOwnPropertyNames(value);
    properties.sort();
    return properties.reduce((acc, name) => {
      acc[name] = transform(value[name]);
      return acc;
    }, {}) as unknown as T;
  }
  return value;
}

/**
 * Untransform value into its human readable form.
 * @param value - Value to untransform.
 * @returns Untransformed, human readable form of value.
 */
export function untransform<T>(value: T): T | string {
  if (Buffer.isBuffer(value)) {
    return '0x' + value.toString('hex');
  } else if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return '\\' + value;
    }
  } else if (value instanceof Array && value.length > 1) {
    for (let i = 1; i < value.length; i++) {
      if (value[i - 1].weight > value[i].weight) {
        throw new Error('Array elements are not in canonical order');
      }
    }
    return value.map(untransform) as unknown as T;
  } else if (value instanceof Object) {
    const properties = Object.getOwnPropertyNames(value);
    for (let i = 1; i < properties.length; i++) {
      if (properties[i - 1].localeCompare(properties[i]) > 0) {
        throw new Error('Object properties are not in caonical order');
      }
    }
    return properties.reduce((acc, name) => {
      acc[name] = untransform(value[name]);
      return acc;
    }, {}) as unknown as T;
  }
  return value;
}

/**
 * Serialize a value.
 * @param value - Value to serialize.
 * @returns Buffer representing serialized value.
 */
export function serialize<T>(value: T): Buffer {
  return encodeCanonical(transform(value));
}

/**
 * Deserialize a value.
 * @param value - Buffer to deserialize.
 * @returns Deserialized value.
 */
export function deserialize(value: Buffer): unknown {
  return untransform(decodeFirstSync(value));
}
