/**
 * OpenAPI Generator Configuration
 * Custom codec handlers for OpenAPI generation
 */

module.exports = (E) => {
  return {
    '.': {
      JsonFromStringifiedJson: () => E.right({ type: 'string' }),
      Optional: (args) => E.right({ ...args[0], nullable: true }),
    },
    'io-ts-types': {
      Json: () => E.right({ type: 'object', properties: {}, required: [] }),
      NonEmptyString: () => E.right({ type: 'string', minLength: 1 }),
      DateFromISOString: () => E.right({ type: 'string', format: 'date-time' }),
      BigIntFromString: () => E.right({ type: 'string' }),
      BooleanFromString: () => E.right({ type: 'string', enum: ['true', 'false'] }),
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
