/**
 *
 * @param status
 * @param result
 * @param message
 */
export function apiResponse(status: number, result: any, message?: string): ApiResponseError {
  return new ApiResponseError(message, status, result);
}

function createSendParams(req: express.Request) {
  if (req.config?.externalSignerUrl !== undefined) {
    return {
      ...req.body,
      customSigningFunction: createCustomSigningFunction(req.config.externalSignerUrl),
    };
  } else {
    return req.body;
  }
}

export function createCustomSigningFunction(externalSignerUrl: string): CustomSigningFunction {
  return async function (params): Promise<SignedTransaction> {
    const { body: signedTx } = await retryPromise(
      () =>
        superagent
          .post(`${externalSignerUrl}/api/v2/${params.coin.getChain()}/sign`)
          .type('json')
          .send({ txPrebuild: params.txPrebuild, pubs: params.pubs }),
      (err, tryCount) => {
        debug(`failed to connect to external signer (attempt ${tryCount}, error: ${err.message})`);
      }
    );
    return signedTx;
  };
}

/**
 * Redirect a request using the bitgo request functions
 * @param bitgo
 * @param method
 * @param url
 * @param req
 * @param next
 */
 function redirectRequest(bitgo: BitGo, method: string, url: string, req: express.Request, next: express.NextFunction) {
  switch (method) {
    case 'GET':
      return bitgo.get(url).result();
    case 'POST':
      return bitgo.post(url).send(req.body).result();
    case 'PUT':
      return bitgo.put(url).send(req.body).result();
    case 'DELETE':
      return bitgo.del(url).send(req.body).result();
  }
  // something has presumably gone wrong
  next();
}



async function handleProxyReq(req: express.Request, res: express.Response, next: express.NextFunction) {
  const fullUrl = req.bitgo.microservicesUrl(req.url);
  if (req.url === 'docs' || (req.url && (/^\/api.*$/.test(req.url) || /^\/oauth\/token.*$/.test(req.url)))) {
    req.isProxy = true;
    debug('proxying %s request to %s', req.method, fullUrl);
    return await redirectRequest(req.bitgo, req.method, fullUrl, req, next);
  }

  // user tried to access a url which is not an api route, do not proxy
  debug('unable to proxy %s request to %s', req.method, fullUrl);
  throw new ApiResponseError('bitgo-express can only proxy BitGo API requests', 404);
}

/**
 * Builds the API's URL string, optionally building the querystring if parameters exist
 * @param req
 * @return {string}
 */
 function createAPIPath(req: express.Request) {
  let apiPath = '/' + req.params[0];
  if (!_.isEmpty(req.query)) {
    // req.params does not contain the querystring, so we manually add them here
    const urlDetails = url.parse(req.url);
    if (urlDetails.search) {
      // "search" is the properly URL encoded query params, prefixed with "?"
      apiPath += urlDetails.search;
    }
  }
  return apiPath;
}