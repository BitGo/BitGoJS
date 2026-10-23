import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { inc } from 'semver';
import { LernaModule } from './getLernaModules';

export type DistTags = Record<string, string>;

/**
 * Makes an HTTP request to fetch all the dist tags for a given package.
 */
export async function getDistTags(packageName: string): Promise<DistTags> {
  console.log(`Fetching dist tags for ${packageName}`);
  const url = `https://registry.npmjs.org/-/package/${packageName}/dist-tags`;
  const response = await fetch(url);
  if (response.status === 404) {
    return {};
  }
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  return response.json();
}

export type PackageVersionExists = (
  packageName: string,
  version: string,
) => Promise<boolean>;

export const packageVersionExists: PackageVersionExists = async (
  packageName,
  version,
) => {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`;
  const response = await fetch(url);
  if (response.status === 404 || response.status === 410) {
    return false;
  }
  if (!response.ok) {
    throw new Error(
      `Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`,
    );
  }
  return true;
};

export async function findFirstUnpublishedVersion(
  packageName: string,
  initialCandidate: string,
  preid: string,
  versionExists: PackageVersionExists = packageVersionExists,
): Promise<string> {
  let candidate = initialCandidate;
  while (await versionExists(packageName, candidate)) {
    const next = inc(candidate, 'prerelease', undefined, preid);
    if (!next) {
      throw new Error(
        `Failed to increment occupied version ${packageName}@${candidate}`,
      );
    }
    candidate = next;
  }
  return candidate;
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
          return [[moduleName, await getDistTags(moduleName)]];
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

export async function getDistTagsForModules(modules: LernaModule[]): Promise<Map<LernaModule, DistTags | undefined>> {
  const names: string[] = modules.map(
    (m) => JSON.parse(readFileSync(path.join(m.location, 'package.json'), { encoding: 'utf-8' })).name
  );
  const nameMap = await getDistTagsForModuleNames(names);
  return new Map<LernaModule, DistTags | undefined>(modules.map((m, i) => [m, nameMap.get(names[i])]));
}
