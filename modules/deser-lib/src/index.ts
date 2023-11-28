import { decodeFirstSync, encodeCanonical } from 'cbor';

/** Return a string describing value as a type. */
function getType(value): string {
  if (Array.isArray(value)) {
    const types = value.map(getType);
    if (!types.slice(1).every((value) => value === types[0])) {
      throw new Error('Array elements are not of the same type');
    }
    return JSON.stringify([types[0]]);
  }
  if (typeof value === 'object') {
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

/** Compare two buffers for sorting. */
function bufferCompare(a: Buffer, b: Buffer) {
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

/** Compare two array elements for sorting. */
function elementCompare(a: any, b: any) {
  if (!('weight' in a) || !('weight' in b)) {
    throw new Error('Array elements lack weight property');
  }
  if (a.weight === b.weight) {
    if (!('value' in a) || !('value' in b)) {
      throw new Error('Array elements lack value property');
    }
    const aVal = transform(a.value);
    const bVal = transform(b.value);
    if (!Buffer.isBuffer(aVal) && typeof aVal !== 'string' && typeof aVal !== 'number') {
      throw new Error('Array element value cannot be compared');
    }
    if (!Buffer.isBuffer(bVal) && typeof bVal !== 'string' && typeof bVal !== 'number') {
      throw new Error('Array element value cannot be compared');
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }
    let aBuf, bBuf;
    if (typeof aVal === 'number') {
      aBuf = Buffer.from([aVal]);
    } else {
      aBuf = Buffer.from(aVal);
    }
    if (typeof bVal === 'number') {
      bBuf = Buffer.from([bVal]);
    } else {
      bBuf = Buffer.from(bVal);
    }
    return bufferCompare(aBuf, bBuf);
  }
  return a.weight - b.weight;
}

/** Transform value into its canonical, serializable form. */
export function transform(value: any) {
  if (typeof value === 'string') {
    // Transform hex strings to buffers.
    if (value.startsWith('0x')) {
      if (!value.match(/^0x([0-9a-fA-F]{2})*$/)) {
        throw new Error('0x prefixed string contains non-hex characters.');
      }
      return Buffer.from(value.slice(2), 'hex');
    }
  } else if (Array.isArray(value)) {
    // Enforce array elemenst are same type.
    getType(value);
    value = value.slice(0);
    value.sort(elementCompare).map(transform);
    return value.map(transform);
  } else if (typeof value === 'object') {
    const properties = Object.getOwnPropertyNames(value);
    properties.sort();
    return properties.reduce((acc, name) => {
      acc[name] = transform(value[name]);
      return acc;
    }, {});
  }
  return value;
}

/** Untransform value into its human readable form. */
export function untransform(value: any) {
  if (Buffer.isBuffer(value)) {
    return '0x' + value.toString('hex');
  }
  if (Array.isArray(value) && value.length > 1) {
    for (let i = 1; i < value.length; i++) {
      if (value[i - 1].weight > value[i].weight) {
        throw new Error('Array elements are not in canonical order');
      }
    }
    return value.map(untransform);
  } else if (typeof value === 'object') {
    const properties = Object.getOwnPropertyNames(value);
    for (let i = 1; i < properties.length; i++) {
      if (properties[i - 1].localeCompare(properties[i]) > 0) {
        throw new Error('Object properties are not in caonical order');
      }
    }
    return properties.reduce((acc, name) => {
      acc[name] = untransform(value[name]);
      return acc;
    }, {});
  }
  return value;
}

/** Serialize a value. */
export function serialize(value: any): Buffer {
  return encodeCanonical(transform(value));
}

/** Deserialize a value. */
export function deserialize(value: Buffer) {
  return untransform(decodeFirstSync(value));
}
