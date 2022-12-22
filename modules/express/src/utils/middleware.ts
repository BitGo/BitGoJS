import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as pjson from '../../package.json';

import { BitGoOptions } from 'bitgo';

const { version } = require('bitgo/package.json');

const expressJSONParser = bodyParser.json({ limit: '20mb' });
const BITGOEXPRESS_USER_AGENT = `BitGoExpress/${pjson.version} BitGoJS/${version}`;

/**
 * Perform body parsing here only on routes we want
 */
export function parseBody(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Set the default Content-Type, in case the client doesn't set it.  If
  // Content-Type isn't specified, Express silently refuses to parse the
  // request body.
  req.headers['content-type'] = req.headers['content-type'] || 'application/json';
  return expressJSONParser(req, res, next);
}

/**
 * Create the bitgo object in the request
 * @param config
 */
export function prepareBitGo(config: Config) {
  const { env, customRootUri, customBitcoinNetwork } = config;

  return function prepBitGo(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Get access token
    let accessToken;
    if (req.headers.authorization) {
      const authSplit = req.headers.authorization.split(' ');
      if (authSplit.length === 2 && authSplit[0].toLowerCase() === 'bearer') {
        accessToken = authSplit[1];
      }
    }
    const userAgent = req.headers['user-agent']
      ? BITGOEXPRESS_USER_AGENT + ' ' + req.headers['user-agent']
      : BITGOEXPRESS_USER_AGENT;
    const bitgoConstructorParams: BitGoOptions = {
      env,
      customRootURI: customRootUri,
      customBitcoinNetwork,
      accessToken,
      userAgent,
    };

    req.bitgo = new BitGo(bitgoConstructorParams);
    req.config = config;

    next();
  };
}

/**
 * Promise handler wrapper to handle sending responses and error cases
 * @param promiseRequestHandler
 */
export function promiseWrapper(promiseRequestHandler: RequestHandler) {
  return async function promWrapper(req: express.Request, res: express.Response, next: express.NextFunction) {
    debug(`handle: ${req.method} ${req.originalUrl}`);
    try {
      const result = await promiseRequestHandler(req, res, next);
      res.status(200).send(result);
    } catch (e) {
      handleRequestHandlerError(res, e);
    }
  };
}

function handleRequestHandlerError(res: express.Response, error: unknown) {
  let err;
  if (error instanceof Error) {
    err = error;
  } else if (typeof error === 'string') {
    err = new Error('(string_error) ' + error);
  } else {
    err = new Error('(object_error) ' + JSON.stringify(error));
  }

  const message = err.message || 'local error';
  // use attached result, or make one
  let result = err.result || { error: message };
  result = _.extend({}, result, {
    message: err.message,
    bitgoJsVersion: version,
    bitgoExpressVersion: pjson.version,
  });
  const status = err.status || 500;
  if (!(status >= 200 && status < 300)) {
    console.log('error %s: %s', status, err.message);
  }
  if (status >= 500 && status <= 599) {
    if (err.response && err.response.request) {
      console.log(`failed to make ${err.response.request.method} request to ${err.response.request.url}`);
    }
    console.log(err.stack);
  }
  res.status(status).send(result);
}