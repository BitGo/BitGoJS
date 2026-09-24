import { apiSpec } from '@api-ts/io-ts-http';
import { PostV2Decrypt } from './v2/decrypt';
import { PostV2Encrypt } from './v2/encrypt';
import { PostGenerateWallet } from './v2/generateWallet';
import { GetV2PingExpress } from './v2/pingExpress';
import { PostWalletSweep } from './v2/walletSweep';

/**
 * Cumulative OpenAPI batch entrypoint.
 *
 * Add approved route specs here as they are introduced. Keep previously added
 * routes in this object so generated/openapi-express.yaml remains cumulative.
 */
export const ExpressOpenApiSpec = apiSpec({
  'express.decrypt': {
    post: PostV2Decrypt,
  },
  'express.encrypt': {
    post: PostV2Encrypt,
  },
  'express.wallet.generate': {
    post: PostGenerateWallet,
  },
  'express.wallet.sweep': {
    post: PostWalletSweep,
  },
  'express.pingexpress': {
    get: GetV2PingExpress,
  },
});
