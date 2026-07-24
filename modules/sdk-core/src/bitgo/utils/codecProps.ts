import * as t from 'io-ts';

/**
 * @param type
 * @returns {string[]} the top-level properties of a codec
 */
export function getCodecProperties(type: t.Type<any>): string[] {
  if (type instanceof t.IntersectionType) {
    return type.types.flatMap(getCodecProperties);
  }
  if (type instanceof t.ExactType) {
    return getCodecProperties(type.type);
  }
  if (type instanceof t.PartialType || type instanceof t.InterfaceType) {
    return Object.keys(type.props);
  }

  throw new Error(`Unsupported type: ${type.name}`);
}
