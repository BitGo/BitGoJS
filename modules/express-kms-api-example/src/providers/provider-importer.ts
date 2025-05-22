import * as dotenv from 'dotenv';
import { capitalize } from '../utils/string-utils';

dotenv.config();

export async function instantiateProviderForKeySource(
  source: 'user' | 'backup'
): Promise<import('./kms-interface/kmsInterface').KmsInterface> {
  // const provider = process.env[source === 'user' ? 'USER_PROVIDER_CLASS' : 'BACKUP_PROVIDER_CLASS'];
  //TODO: module resolution error to solve, hardcoded for now
  const provider = 'mock';
  if (!provider) throw new Error(`Provider for ${source} is not defined. Only 'user' or 'backup' are allowed.`);

  const modulePath = `./${provider}/${provider}-kms`;
  const providerModule = await import(modulePath);

  const className = `${capitalize(provider)}KmsProvider`;

  const ProviderClass = providerModule[className];
  if (!ProviderClass) throw new Error(`Provider class "${className}" not found in ${modulePath}`);

  return new ProviderClass();
}
