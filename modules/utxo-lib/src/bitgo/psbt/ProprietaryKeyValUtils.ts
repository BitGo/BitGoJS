import { KeyValue } from 'bip174/src/lib/interfaces';
import { decodeProprietaryKey, encodeProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { ProprietaryKeySearch, ProprietaryKeyValue } from '../PsbtUtil';

export type UnknownKeyValsType = 'output' | 'input';

export function getProprietaryKeyValuesFromUnknownKeyValues(
  unknownKeyVals: KeyValue[],
  keySearch?: ProprietaryKeySearch
): ProprietaryKeyValue[] {
  if (keySearch && keySearch.subtype === undefined && Buffer.isBuffer(keySearch.keydata)) {
    throw new Error('invalid proprietary key search filter combination. subtype is required');
  }
  const keyVals = unknownKeyVals.map(({ key, value }, i) => {
    return { key: decodeProprietaryKey(key), value };
  });
  return keyVals.filter((keyVal) => {
    return (
      keySearch === undefined ||
      (keySearch.identifier === keyVal.key.identifier &&
        (keySearch.subtype === undefined ||
          (keySearch.subtype === keyVal.key.subtype &&
            (!Buffer.isBuffer(keySearch.keydata) || keySearch.keydata.equals(keyVal.key.keydata)))))
    );
  });
}

export function deleteProprietaryKeyValuesFromUnknownKeyValues(
  unknownKeyVals: KeyValue[],
  keysToDelete?: ProprietaryKeySearch
): KeyValue[] {
  if (keysToDelete && keysToDelete.subtype === undefined && Buffer.isBuffer(keysToDelete.keydata)) {
    throw new Error('invalid proprietary key search filter combination. subtype is required');
  }
  return unknownKeyVals.filter((keyValue, i) => {
    const key = decodeProprietaryKey(keyValue.key);
    return !(
      keysToDelete === undefined ||
      (keysToDelete.identifier === key.identifier &&
        (keysToDelete.subtype === undefined ||
          (keysToDelete.subtype === key.subtype &&
            (!Buffer.isBuffer(keysToDelete.keydata) || keysToDelete.keydata.equals(key.keydata)))))
    );
  });
}

export function updateProprietaryKeyValuesToUnknownKeyValues(
  keyValueData: ProprietaryKeyValue,
  unknownKeyVals: KeyValue[]
): void {
  const key = encodeProprietaryKey(keyValueData.key);
  const { value } = keyValueData;
  const ukvIndex = unknownKeyVals.findIndex((ukv) => ukv.key.equals(key));
  if (ukvIndex > -1) {
    unknownKeyVals[ukvIndex] = { key, value };
  }
}
