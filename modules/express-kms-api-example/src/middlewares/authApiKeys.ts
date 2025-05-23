import { NextFunction, Request, Response } from 'express';
//TODO: move the list of API keys to a safer place like an env file
const API_KEYS_EXTERNALS = ['abc', 'def'];

export function checkApiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];
  let invalidKey = false;
  if (!apiKey) {
    invalidKey = true;
  } else if (typeof apiKey === 'string') {
    invalidKey = !API_KEYS_EXTERNALS.includes(apiKey);
  } else if (Array.isArray(apiKey)) {
    // Added the forced cast 'as' because for some reason typescript doesn't infers that
    // apiKey is an array at this point despite the check on L14
    invalidKey = !(apiKey as string[]).some((key) => API_KEYS_EXTERNALS.includes(key));
  }

  if (invalidKey) {
    res.status(401).send({ message: 'Unauthorized' });
    return;
  }
  next();
}
