import { NextFunction, Request, Response } from 'express';
import { instantiateProviderForKeySource } from '../providers/provider-importer';

let userKeyProvider: Awaited<ReturnType<typeof instantiateProviderForKeySource>>;
let backupKeyProvider: Awaited<ReturnType<typeof instantiateProviderForKeySource>>;

export default async function keyProviderMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!userKeyProvider) userKeyProvider = await instantiateProviderForKeySource('user');
  if (!backupKeyProvider) backupKeyProvider = await instantiateProviderForKeySource('backup');

  req.body.userKeyProvider = userKeyProvider;
  req.body.backupKeyProvider = backupKeyProvider;

  next();
}
