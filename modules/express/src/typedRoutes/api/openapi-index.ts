import { apiSpec } from '@api-ts/io-ts-http';
import { PostWalletSweep } from './v2/walletSweep';

/**
 * Cumulative OpenAPI batch entrypoint.
 *
 * Add approved route specs here as they are introduced. Keep previously added
 * routes in this object so generated/openapi-express.yaml remains cumulative.
 */
export const ExpressOpenApiSpec = apiSpec({
  'express.wallet.sweep': {
    post: PostWalletSweep,
  },
});
