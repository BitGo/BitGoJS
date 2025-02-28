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

export async function getDistTagsForModuleNames(moduleNames: string[]): Promise<(DistTags | undefined)[]> {
  return Promise.all(
    moduleNames.map(async (moduleName) => {
      switch (moduleName) {
        case '@bitgo-beta/express':
        case '@bitgo-beta/web-demo':
        case '@bitgo-beta/sdk-test':
          console.warn(`Skipping ${moduleName} as it's not published to npm`);
          return undefined;
      }
      try {
        return await getDistTags(moduleName);
      } catch (e) {
        console.warn(`Failed to fetch dist tags for ${moduleName}`, e);
        return undefined;
      }
    })
  );
}

export async function getDistTagsForModuleLocations(moduleLocations: string[]): Promise<(DistTags | undefined)[]> {
  return getDistTagsForModuleNames(
    moduleLocations.map(
      (modulePath) => JSON.parse(readFileSync(path.join(modulePath, 'package.json'), { encoding: 'utf-8' })).name
    )
  );
}
