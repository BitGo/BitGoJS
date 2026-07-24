import { CachingHttpClient } from '../src';

export function isHttpEnabled(): boolean {
  return process.env.BITGO_BLOCKAPIS_TEST_ENABLE_HTTP === '1';
}

/**
 * @param name
 * @return a new CachingHttpClient that reads from the given fixture directory.
 */
export function getHttpClient(name: string): CachingHttpClient {
  return new CachingHttpClient(`${__dirname}/fixtures/responses/` + name, { isHttpEnabled: isHttpEnabled() });
}
