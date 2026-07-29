const NPM_REGISTRY = 'https://registry.npmjs.org';

export type DistTags = Record<string, string>;

export async function getDistTags(packageName: string): Promise<DistTags> {
  const url = `${NPM_REGISTRY}/-/package/${packageName}/dist-tags`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dist-tags for ${packageName}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<DistTags>;
}

export async function getAllDistTags(packageNames: string[]): Promise<Map<string, DistTags>> {
  const entries = await Promise.all(
    packageNames.map(async (name): Promise<[string, DistTags] | undefined> => {
      try {
        return [name, await getDistTags(name)];
      } catch (e) {
        console.warn(`Failed to fetch dist-tags for ${name}:`, e);
        return undefined;
      }
    })
  );
  return new Map(entries.filter((e): e is [string, DistTags] => e !== undefined));
}

/**
 * Fetch a specific version of a package from the npm registry.
 * If version is a dist-tag name (e.g., "beta"), npm resolves it.
 */
export async function getPackageVersion(
  packageName: string,
  version: string
): Promise<{ version: string; dependencies: Record<string, string> }> {
  const url = `${NPM_REGISTRY}/${packageName}/${version}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${packageName}@${version}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { version: string; dependencies?: Record<string, string> };
  return { version: data.version, dependencies: data.dependencies ?? {} };
}
