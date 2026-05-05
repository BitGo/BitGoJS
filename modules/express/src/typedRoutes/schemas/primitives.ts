import * as t from 'io-ts';

/**
 * Integer codec — maps to OpenAPI `type: integer` via the codec handler.
 * Use this instead of `t.Int` which the openapi-generator cannot resolve.
 */
export const IntegerC = t.number;
