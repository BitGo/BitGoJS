import { instantiateProviderForKeySource } from '../providers/provider-importer';

let userKeyProvider: Awaited<ReturnType<typeof instantiateProviderForKeySource>>;
let backupKeyProvider: Awaited<ReturnType<typeof instantiateProviderForKeySource>>;

export default async function keyProviderMiddleware(req, res, next) {
  if (!userKeyProvider) userKeyProvider = await instantiateProviderForKeySource('user');
  if (!backupKeyProvider) backupKeyProvider = await instantiateProviderForKeySource('backup');

  req.userKeyProvider = userKeyProvider;
  req.backupKeyProvider = backupKeyProvider;

  next();
}
