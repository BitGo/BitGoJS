import { createRouter, WrappedRouter } from '@api-ts/typed-express-router';

import { ExpressApi } from './api';

export default function (): WrappedRouter<ExpressApi> {
  const router: WrappedRouter<ExpressApi> = createRouter(ExpressApi);
  return router;
}
