import { AbiCoder } from 'ethers/utils/abi-coder';
import BN from 'bignumber.js';
import { FieldStruct } from './iface';
import { isObject } from './utils';

const ethersAbiCoder = new AbiCoder(function(type, value) {
  if (type.match(/^u?int/) && !Array.isArray(value) && (!isObject(value) || value.constructor.name !== 'BN')) {
    return value.toString();
  }
  return value;
});

/**
 * Should be used to encode list of params
 *
 * @param {Array<string|object>} types the types to encode
 * @param {Array<any>} params the params to be encoded
 *
 * @returns {string} encoded list of params
 */
export function encodeParameters(types: FieldStruct[], params: any): string {
  return ethersAbiCoder.encode(
    _mapTypes(types),
    params.map(function(param: any) {
      if (BN.isBigNumber(param)) {
        return param.toString(10);
      }
      return param;
    }),
  );
}

/**
 * Map types if simplified format is used
 *
 * @param {Array} types types to map
 * @returns {Array} mapped types
 */
function _mapTypes(types: FieldStruct[]): FieldStruct[] {
  const mappedTypes: FieldStruct[] = [];
  types.forEach(function(type: FieldStruct) {
    if (_isSimplifiedStructFormat(type)) {
      const structName = Object.keys(type)[0];
      mappedTypes.push(
        Object.assign(_mapStructNameAndType(structName), {
          components: _mapStructToCoderFormat(type[structName]),
        }),
      );
      return;
    } else {
      mappedTypes.push(type);
    }
  });

  return mappedTypes;
}

/**
 * Check if type is simplified struct format
 *
 * @function isSimplifiedStructFormat
 * @param {object} type type
 * @returns {boolean} true if the type is simplified struct format
 */
function _isSimplifiedStructFormat(type: FieldStruct): boolean {
  return typeof type === 'object' && typeof type.components === 'undefined' && typeof type.name === 'undefined';
}

/**
 * Maps the correct tuple type and name when the simplified format in encode/decodeParameter is used
 *
 * @function mapStructNameAndType
 * @param {string} structName the struct name
 * @returns {FieldStruct} the struct name mapped
 */
function _mapStructNameAndType(structName: string): FieldStruct {
  let type = 'tuple';

  if (structName.indexOf('[]') > -1) {
    type = 'tuple[]';
    structName = structName.slice(0, -2);
  }

  return { type: type, name: structName };
}

/**
 * Maps the simplified format in to the expected format of the ABICoder
 *
 * @function mapStructToCoderFormat
 * @param {object} struct the struct object to map
 * @returns {Array} struct mapped in coder format
 */
function _mapStructToCoderFormat(struct: object): FieldStruct[] {
  const components: FieldStruct[] = [];
  Object.keys(struct).forEach(function(key) {
    if (typeof struct[key] === 'object') {
      components.push(
        Object.assign(_mapStructNameAndType(key), {
          components: _mapStructToCoderFormat(struct[key]),
        }),
      );
      return;
    }

    components.push({
      name: key,
      type: struct[key],
    });
  });

  return components;
}
