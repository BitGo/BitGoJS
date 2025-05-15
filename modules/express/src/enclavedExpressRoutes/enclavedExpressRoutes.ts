import * as superagent from 'superagent';
import * as debug from 'debug';
import * as express from 'express';
import { retryPromise } from '../retryPromise';

export async function handlePingEnclavedExpress(req: express.Request) {
  console.log('Making enclaved express request with SSL cert to:', req.config?.enclavedExpressUrl);
  return await retryPromise(
    () =>
      superagent
        .get(`${req.config?.enclavedExpressUrl}/ping`)
        .ca(req.config?.enclavedExpressSSLCert as string)
        .send(),
    (err, tryCount) => {
      debug(`Failed to ping enclavedExpress: ${err.message}`);
    }
  );
}
