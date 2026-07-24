export type Signable = boolean | number | string | SignableRecord | SignableArray;

export interface SignableRecord {
  [key: string]: Signable;
}

export interface SignableArray {
  [key: number]: Signable;
}

/**
 * Recursively canonicalizes an object by sorting its keys.
 *
 * @param obj - The object to be canonicalized. It can be a boolean, number, string,
 *              a record of signable values, or an array of signable values.
 * @returns The canonicalized object with sorted keys.
 * @throws Will throw an error if the object type is invalid.
 */
export function canonicalizeObject(obj: Signable): Signable {
  if (typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(canonicalizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result: Record<string, Signable>, key) => {
        result[key] = canonicalizeObject((obj as { [key: string]: Signable })[key]);
        return result;
      }, {});
  }

  throw new Error('Invalid object type');
}
