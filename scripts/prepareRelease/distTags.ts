import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';

export type DistTags = Record<string, string>;

/**
 * Makes an HTTP request to fetch all the dist tags for a given package.
 */
export async function getDistTags(packageName: string): Promise<DistTags> {
  console.log(`Fetching dist tags for ${packageName}`);
  const url = `https://registry.npmjs.org/-/package/${packageName}/dist-tags`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  return response.json();
}

// Add this function to read from cache
export function getDistTagsCache(): string | undefined {
  return process.env.BITGO_PREPARE_RELEASE_CACHE_DIST_TAGS;
}

export async function getDistTagsForModuleNames(moduleNames: string[]): Promise<Map<string, DistTags>> {
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
            case '@bitgo-beta/express':
            case '@bitgo-beta/web-demo':
            case '@bitgo-beta/sdk-test':
              console.warn(`Skipping ${moduleName} as it's not published to npm`);
              return [];
          }
          try {
            return [[moduleName, await getDistTags(moduleName)]];
          } catch (e) {
            console.warn(`Failed to fetch dist tags for ${moduleName}`, e);
            return [];
          }
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

export async function getDistTagsForModuleLocations(moduleLocations: string[]): Promise<(DistTags | undefined)[]> {
  const names: string[] = moduleLocations.map(
    (modulePath) => JSON.parse(readFileSync(path.join(modulePath, 'package.json'), { encoding: 'utf-8' })).name
  );
  const map = await getDistTagsForModuleNames(names);
  return names.map((name) => map.get(name));
}
