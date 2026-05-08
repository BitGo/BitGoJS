import { createRouter, WrappedRouter } from '@api-ts/typed-express-router';

import { ExpressApi } from './api';
import { createValidationError } from './utils';

const { version: bitgoJsVersion } = require('bitgo/package.json');
const { version: bitgoExpressVersion } = require('../../package.json');

export default function (): WrappedRouter<ExpressApi> {
  const router: WrappedRouter<ExpressApi> = createRouter(ExpressApi, {
    decodeErrorFormatter: (errors) => {
      const err = createValidationError(errors);
      return {
        error: err.message,
        message: err.message,
        name: err.name,
        bitgoJsVersion,
        bitgoExpressVersion,
      };
    },
  });
  return router;
}
