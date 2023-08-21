import { decodeProprietaryKey, ProprietaryKey } from 'bip174/src/lib/proprietaryKeyVal';
import { PsbtInput } from 'bip174/src/lib/interfaces';
import { Psbt } from 'bitcoinjs-lib/src/psbt';

/**
 * bitgo proprietary key identifier
 */
export const PSBT_PROPRIETARY_IDENTIFIER = 'BITGO';

/**
 * subtype for proprietary keys that bitgo uses
 */
export enum ProprietaryKeySubtype {
  ZEC_CONSENSUS_BRANCH_ID = 0x00,
  MUSIG2_PARTICIPANT_PUB_KEYS = 0x01,
  MUSIG2_PUB_NONCE = 0x02,
  MUSIG2_PARTIAL_SIG = 0x03,
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
 * Search any data from psbt proprietary key value against keydata.
 * Default identifierEncoding is utf-8 for identifier.
 */
export function getPsbtInputProprietaryKeyVals(
  input: PsbtInput,
  keySearch?: ProprietaryKeySearch
): ProprietaryKeyValue[] {
  if (!input.unknownKeyVals?.length) {
    return [];
  }
  if (keySearch && keySearch.subtype === undefined && Buffer.isBuffer(keySearch.keydata)) {
    throw new Error('invalid proprietary key search filter combination. subtype is required');
  }
  const keyVals = input.unknownKeyVals.map(({ key, value }, i) => {
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

/**
 * @return partialSig/tapScriptSig/MUSIG2_PARTIAL_SIG count iff input is not finalized
 */
export function getPsbtInputSignatureCount(input: PsbtInput): number {
  if (isPsbtInputFinalized(input)) {
    throw new Error('Input is already finalized');
  }
  return Math.max(
    Array.isArray(input.partialSig) ? input.partialSig.length : 0,
    Array.isArray(input.tapScriptSig) ? input.tapScriptSig.length : 0,
    getPsbtInputProprietaryKeyVals(input, {
      identifier: PSBT_PROPRIETARY_IDENTIFIER,
      subtype: ProprietaryKeySubtype.MUSIG2_PARTIAL_SIG,
    }).length
  );
}

/**
 * @return true iff PSBT input is finalized
 */
export function isPsbtInputFinalized(input: PsbtInput): boolean {
  return Buffer.isBuffer(input.finalScriptSig) || Buffer.isBuffer(input.finalScriptWitness);
}

/**
 * @return true iff data starts with magic PSBT byte sequence
 * @param data byte array or hex string
 * */
export function isPsbt(data: Buffer | string): boolean {
  // https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki#specification
  // 0x70736274 - ASCII for 'psbt'. 0xff - separator
  if (typeof data === 'string') {
    if (data.length < 10) {
      return false;
    }
    data = Buffer.from(data.slice(0, 10), 'hex');
  }
  return 5 <= data.length && data.readUInt32BE(0) === 0x70736274 && data.readUInt8(4) === 0xff;
}

/**
 * This function allows signing or validating a psbt with non-segwit inputs those do not contain nonWitnessUtxo.
 */
export function withUnsafeNonSegwit<T>(psbt: Psbt, fn: () => T, unsafe = true): T {
  (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = unsafe;
  try {
    return fn();
  } finally {
    (psbt as any).__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
  }
}
