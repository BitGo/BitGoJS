import * as superagent from 'superagent';
import * as debug from 'debug';
import * as express from 'express';
import { retryPromise } from '../retryPromise';

export async function handlePingEnclavedExpress(req: express.Request) {
  return await retryPromise(
    () =>
      superagent
        .post(`${req.config?.enclavedExpressUrl}/ping`)
        .ca(req.config?.enclavedExpressSSLCert as string)
        .send({}),
    (err, tryCount) => {
      debug(`Failed to ping enclavedExpress: ${err.message}`);
    }
  );
}
