/**
 * OpenAPI Generator Configuration
 * Custom codec handlers for OpenAPI generation
 */

module.exports = (E) => {
  return {
    '.': {
      JsonFromStringifiedJson: () => E.right({ type: 'string' }),
      Optional: (_, innerSchema) => E.right({ type: 'union', schemas: [innerSchema, { type: 'undefined' }] }),
    },
    'io-ts-types': {
      Json: () => E.right({ type: 'object', properties: {}, required: [] }),
      NonEmptyString: () => E.right({ type: 'string', minLength: 1 }),
      DateFromISOString: () => E.right({ type: 'string', format: 'date-time' }),
      // Matches the generator's built-in io-ts-types handler (used by wallet-platform) so that
      // components shared with wallet-platform.yaml are emitted identically.
      BigIntFromString: () => E.right({ type: 'string', format: 'number', decodedType: 'bigint' }),
      BooleanFromString: () => E.right({ type: 'boolean' }),
      NumberFromString: () => E.right({ type: 'string' }),
    },
    'io-ts-bigint': {
      BigIntFromString: () => E.right({ type: 'string' }),
      NegativeBigIntFromString: () => E.right({ type: 'string' }),
      PositiveBigIntFromString: () => E.right({ type: 'string' }),
      NonZeroBigIntFromString: () => E.right({ type: 'string' }),
      NonNegativeBigIntFromString: () => E.right({ type: 'string' }),
    },
    'io-ts-numbers': {
      NumberFromString: () => E.right({ type: 'string' }),
    },
  };
};
