import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { LernaModule } from './lernaModules';

export type DistTags = Record<string, string>;

/**
 * Makes an HTTP request to fetch all the dist tags for a given package.
 */
export async function getDistTags(packageName: string, targetPreId: string): Promise<DistTags> {
  console.log(`Fetching dist tags for ${packageName}`);
  const url = `https://registry.npmjs.org/-/package/${packageName}/dist-tags`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  let responseJson = await response.json();
  responseJson = await fixInvalidDistTag(responseJson, packageName, targetPreId);
  responseJson = await fixInvalidDistTag(responseJson, packageName, 'latest');
  return responseJson;
}

/**
 * Modifies distTags in place if the targetPreId points to a semantic-release-managed version instead
 * of a real version. This is mainly used to self-repair in the case that a beta release pushed a bad version number.
 * @param distTags
 * @param packageName
 * @param targetPreId
 */
async function fixInvalidDistTag(distTags: DistTags, packageName: string, targetPreId: string): Promise<DistTags> {
  if (distTags[targetPreId].includes('semantic-release-managed')) {
    console.log(
      `Found semantic-release-managed version for ${packageName}, searching for latest version from releases...`
    );
    const latestReleaseVersion = await getLatestReleaseVersion(packageName, targetPreId);
    if (!latestReleaseVersion) {
      throw new Error(`Failed to get latest version for ${packageName}`);
    }
    console.log(`Found latest release version for ${packageName}: ${latestReleaseVersion}`);
    distTags[targetPreId] = latestReleaseVersion;
  }
  return distTags;
}

/**
 * Fetches the latest release version for a given package and preid.
 * @returns The latest version string or undefined if not found.
 * @param packageName
 * @param targetPreId
 */
async function getLatestReleaseVersion(packageName: string, targetPreId: string): Promise<string | undefined> {
  const url = `https://registry.npmjs.org/${packageName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  const responseJson = await response.json();
  const versions = Object.keys(responseJson.versions).reverse();
  return versions.find((v) => {
    if (targetPreId === 'latest') {
      return !v.includes('-');
    }
    return v.includes(`-${targetPreId}`);
  });
}

// Add this function to read from cache
export function getDistTagsCache(): string | undefined {
  return process.env.BITGO_PREPARE_RELEASE_CACHE_DIST_TAGS;
}

/**
 * Get NPM dist tags for a list of module names.
 *
 * @param moduleNames
 * @param uninitializedModules
 * @param preid
 * @returns Map, key is the updated scoped module name, value is the dist tags object
 */
export async function getDistTagsForModuleNames(
  moduleNames: string[],
  uninitializedModules: string[],
  preid: string
): Promise<Map<string, DistTags>> {
  const cachePath = getDistTagsCache();

  // If cache path is set and file exists, read from cache
  if (cachePath && existsSync(cachePath)) {
    console.log(`Reading dist tags from cache: ${cachePath}`);
    const cacheContent = readFileSync(cachePath, { encoding: 'utf-8' });
    const cachedTags = JSON.parse(cacheContent);
    return new Map(Object.entries(cachedTags));
  }

  // Otherwise fetch from npm
  const tagsMap = new Map(
    (
      await Promise.all(
        moduleNames.map(async (moduleName): Promise<[string, DistTags][]> => {
          switch (moduleName) {
            case '@bitgo/express':
            case '@bitgo-beta/express':
            case '@bitgo/web-demo':
            case '@bitgo-beta/web-demo':
            case '@bitgo/sdk-test':
            case '@bitgo-beta/sdk-test':
              console.warn(`Skipping ${moduleName} as it's not published to npm`);
              return [
                [
                  moduleName,
                  {
                    latest: '0.0.0-semantic-release-managed',
                    alpha: '0.0.0-semantic-release-managed',
                    beta: '0.0.0-semantic-release-managed',
                  },
                ],
              ];
          }
          if (uninitializedModules.includes(moduleName)) {
            console.warn(`Skipping ${moduleName} as uninitialized module. Setting default version.`);
            return [
              [
                moduleName,
                {
                  latest: 'v0.0.0',
                  alpha: 'v0.0.0',
                  beta: 'v0.0.0',
                },
              ],
            ];
          }
          return [[moduleName, await getDistTags(moduleName, preid)]];
        })
      )
    ).flat()
  );

  // If cache path is set but file doesn't exist, write to cache
  if (cachePath) {
    console.log(`Writing dist tags to cache: ${cachePath}`);
    const cacheDir = path.dirname(cachePath);
    if (!existsSync(cacheDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(cacheDir, { recursive: true });
    }
    writeFileSync(cachePath, JSON.stringify(Object.fromEntries(tagsMap), null, 2), { encoding: 'utf-8' });
  }

  return tagsMap;
}

/**
 * Get NPM dist tags for a list of lerna modules.
 * Private modules are ignored as they are not published to NPM.
 * @param modules
 * @param uninitializedModules
 * @param preid
 * @returns A map where the key is module name and the value is the dist tags object or undefined if the module is private.
 */
export async function getDistTagsForModules(
  modules: LernaModule[],
  uninitializedModules: string[],
  preid: string
): Promise<Map<string, DistTags | undefined>> {
  const names: string[] = modules.map(
    (m) => JSON.parse(readFileSync(path.join(m.location, 'package.json'), { encoding: 'utf-8' })).name
  );
  return await getDistTagsForModuleNames(names, uninitializedModules, preid);
}
