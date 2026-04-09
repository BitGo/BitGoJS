/*
 Some normalization helpers for use in `assert.deepStrictEqual
 */

function normBufferToHex(v: Buffer | unknown) {
  if (Buffer.isBuffer(v)) {
    return v.toString('hex');
  }

  if (typeof v === 'object' && v !== null) {
    if (Array.isArray(v)) {
      return v.map((e) => normBufferToHex(e));
    }

    return Object.fromEntries(Object.entries(v).map(([k, v]) => [k, normBufferToHex(v)]));
  }

  return v;
}

function normOmitUndefined(v: unknown) {
  if (typeof v === 'object' && v !== null) {
    if (Array.isArray(v)) {
      return v.map((e) => normOmitUndefined(e));
    }

    return Object.fromEntries(
      Object.entries(v).flatMap(([k, v]) => (v === undefined ? [] : [[k, normOmitUndefined(v)]]))
    );
  }

  return v;
}

/**
 * @param v
 */
export function normDefault(v: unknown): unknown {
  return normOmitUndefined(normBufferToHex(v));
}
