import { decodeFirstSync, encode } from 'cbor';

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
    value = [...value] as unknown as T;
    return (value as unknown as Array<unknown>).map(transform) as unknown as T;
  } else if (value instanceof Object) {
    const properties = Object.getOwnPropertyNames(value);
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
    return value.map(untransform) as unknown as T;
  } else if (value instanceof Object) {
    const properties = Object.getOwnPropertyNames(value);
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
  return encode(transform(value));
}

/**
 * Deserialize a value.
 * @param value - Buffer to deserialize.
 * @returns Deserialized value.
 */
export function deserialize(value: Buffer): unknown {
  return untransform(decodeFirstSync(value));
}
