import { readFileSync } from 'fs';
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

export async function getDistTagsForModuleNames(moduleNames: string[]): Promise<Map<string, DistTags>> {
  return new Map(
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
}

export async function getDistTagsForModuleLocations(moduleLocations: string[]): Promise<(DistTags | undefined)[]> {
  const names: string[] = moduleLocations.map(
    (modulePath) => JSON.parse(readFileSync(path.join(modulePath, 'package.json'), { encoding: 'utf-8' })).name
  );
  const map = await getDistTagsForModuleNames(names);
  return names.map((name) => map.get(name));
}
