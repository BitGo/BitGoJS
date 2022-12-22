import { Router, Response, NextFunction } from 'express';
import { parseBody, prepareBitGo, promiseWrapper } from '../../utils';
import { config } from '../config';
import v12 from './v12';
import v1 from './v1';
import v2 from './v2';

const router = Router();

// When adding new routes to BitGo Express make sure that you also add the exact same routes to the server. Since
// some customers were confused when calling a BitGo Express route on the BitGo server, we now handle all BitGo
// Express routes on the BitGo server and return an error message that says that one should call BitGo Express
// instead.

router.use('/:version(v[1-2])', prepareBitGo(config), v12);

router.use('/v1', prepareBitGo(config), v1);

/**
 * Handle all other v1 API requests
 */
router.use('/api/v1/*', parseBody, prepareBitGo(config), promiseWrapper((req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url(createAPIPath(req));
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}));

router.use('/v2', prepareBitGo(config), v2);

/**
 * Handle all other v2 user API requests
 */
router.use('/api/v2/user/*', parseBody, prepareBitGo(config), promiseWrapper((req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const bitgo = req.bitgo;
  const bitgoURL = bitgo.url('/user' + createAPIPath(req), 2);
  return redirectRequest(bitgo, method, bitgoURL, req, next);
}));

/**
 * Handle all other v2 coin API requests
 */
router.use('/api/v2/:coin/*', parseBody, prepareBitGo(config), promiseWrapper((req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const bitgo = req.bitgo;

  debug('handling v2 coin specific rest req');

  try {
    const coin = bitgo.coin(req.params.coin);
    const coinURL = coin.url(createAPIPath(req));
    return redirectRequest(bitgo, method, coinURL, req, next);
  } catch (e) {
    if (e instanceof UnsupportedCoinError) {
      const queryParams = _.transform(
        req.query,
        (acc: string[], value, key) => {
          for (const val of _.castArray(value)) {
            acc.push(`${key}=${val}`);
          }
        },
        []
      );
      const baseUrl = bitgo.url(req.baseUrl.replace(/^\/api\/v2/, ''), 2);
      const url = _.isEmpty(queryParams) ? baseUrl : `${baseUrl}?${queryParams.join('&')}`;

      debug(`coin ${req.params.coin} not supported, attempting to handle as a coinless route with url ${url}`);
      return redirectRequest(bitgo, method, url, req, next);
    }

    throw e;
  }

}));

/**
 * Handle all other requests as proxy requests to BitGo APIs
 */
if (!config.disableProxy) {
  router.use(parseBody, prepareBitGo(config), promiseWrapper(handleProxyReq));
}

export default router;
