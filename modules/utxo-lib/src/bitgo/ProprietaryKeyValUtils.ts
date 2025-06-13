import { PsbtInput, PsbtOutput } from 'bip174/src/lib/interfaces';
import { decodeProprietaryKey, encodeProprietaryKey, ProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { UtxoPsbt } from './UtxoPsbt';

/**
 * Psbt proprietary keydata object search fields.
 * <compact size uint identifier length> <bytes identifier> <compact size uint subtype> <bytes subkeydata>
 */
export interface ProprietaryKeySearch {
  identifier: string;
  subtype?: number;
  keydata?: Buffer;
  identifierEncoding?: BufferEncoding;
}
/**
 * Psbt proprietary keydata object.
 * <compact size uint identifier length> <bytes identifier> <compact size uint subtype> <bytes subkeydata>
 * => <bytes valuedata>
 */
export interface ProprietaryKeyValue {
  key: ProprietaryKey;
  value: Buffer;
}

export function getProprietaryKeyValuesFromUnknownKeyValues(
  psbtField: PsbtInput | PsbtOutput,
  keySearch?: ProprietaryKeySearch
): ProprietaryKeyValue[] {
  if (!psbtField.unknownKeyVals?.length) {
    return [];
  }

  if (keySearch && keySearch.subtype === undefined && Buffer.isBuffer(keySearch.keydata)) {
    throw new Error('invalid proprietary key search filter combination. subtype is required');
  }
  const keyVals = psbtField.unknownKeyVals.map(({ key, value }, i) => {
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
  psbtField: PsbtInput | PsbtOutput,
  keysToDelete?: ProprietaryKeySearch
): void {
  if (!psbtField.unknownKeyVals?.length) {
    return;
  }

  if (keysToDelete && keysToDelete.subtype === undefined && Buffer.isBuffer(keysToDelete.keydata)) {
    throw new Error('invalid proprietary key search filter combination. subtype is required');
  }
  psbtField.unknownKeyVals = psbtField.unknownKeyVals.filter((keyValue, i) => {
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

export function updateProprietaryKeyValuesFromUnknownKeyValues(
  keyValueData: ProprietaryKeyValue,
  psbtField: PsbtInput | PsbtOutput
): void {
  if (!psbtField.unknownKeyVals?.length) {
    return;
  }

  const key = encodeProprietaryKey(keyValueData.key);
  const { value } = keyValueData;
  const ukvIndex = psbtField.unknownKeyVals.findIndex((ukv) => ukv.key.equals(key));
  if (ukvIndex <= -1) {
    throw new Error(`The Key-Value pair does not exist within the PSBT.`);
  }
  psbtField.unknownKeyVals[ukvIndex] = { key, value };
}

export function addProprietaryKeyValuesFromUnknownKeyValues(
  psbt: UtxoPsbt,
  entry: string,
  index: number,
  keyValueData: ProprietaryKeyValue
): void {
  if (index < 0) {
    throw new Error('Not a valid index within the PSBT to add proprietary key value.');
  }
  if (entry === 'input') {
    psbt.addUnknownKeyValToInput(index, {
      key: encodeProprietaryKey(keyValueData.key),
      value: keyValueData.value,
    });
  } else if (entry === 'output') {
    psbt.addUnknownKeyValToOutput(index, {
      key: encodeProprietaryKey(keyValueData.key),
      value: keyValueData.value,
    });
  } else {
    throw new Error("Not a valid PSBT entry, only valid for 'input' or 'output'.");
  }
}
