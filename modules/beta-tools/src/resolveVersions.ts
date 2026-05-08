import { readFileSync } from 'fs';

import * as github from './github';
import * as registry from './registry';

export interface ResolveOptions {
  /** Package names to resolve (e.g., ["@bitgo-beta/sdk-core", ...]) */
  packages: string[];
  /** Dist tag to resolve (e.g., "beta") */
  tag: string;
  /** Package scope (e.g., "@bitgo-beta") */
  scope: string;
  /**
   * Path to JSON manifest mapping package names to exact versions.
   * Bypasses all registry fetches.
   */
  manifestPath?: string;
  /**
   * Override the megapackage used as a version reference.
   * Default: "<scope>/bitgo"
   */
  referencePackage?: string;
  /**
   * GitHub API token. When set, versions are resolved from the latest
   * successful publish workflow run logs (complete, race-free).
   * Falls back to registry strategy when not set.
   */
  githubToken?: string;
}

export interface ResolvedVersions {
  /** Map from package name to exact version string */
  versions: Map<string, string>;
}

function resolveFromManifest(manifestPath: string, packages: string[]): ResolvedVersions {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, string>;
  const versions = new Map<string, string>();
  for (const pkg of packages) {
    const version = manifest[pkg];
    if (version) {
      versions.set(pkg, version);
    } else {
      console.warn(`Package ${pkg} not found in manifest ${manifestPath}`);
    }
  }
  return { versions };
}

/**
 * Default resolution strategy:
 *
 * 1. Fetch the megapackage (@bitgo-beta/bitgo) at the given dist tag.
 *    Its dependencies are pinned to exact versions from the same CI
 *    publish run — one atomic fetch gives us a release snapshot.
 *
 * 2. For any requested packages NOT covered by the megapackage's deps,
 *    fall back to individual dist-tag fetches.
 */
async function resolveFromRegistry(
  packages: string[],
  tag: string,
  referencePackage: string
): Promise<ResolvedVersions> {
  const versions = new Map<string, string>();
  const uncovered: string[] = [];

  // Step 1: fetch the megapackage's published dependencies
  let megaDeps: Record<string, string> = {};
  try {
    const mega = await registry.getPackageVersion(referencePackage, tag);
    console.log(`Using ${referencePackage}@${mega.version} as version reference`);
    megaDeps = mega.dependencies;
  } catch (e) {
    console.warn(`Failed to fetch ${referencePackage}@${tag}, falling back to individual dist-tag fetches:`, e);
  }

  for (const pkg of packages) {
    const version = megaDeps[pkg];
    if (version) {
      versions.set(pkg, version);
    } else {
      uncovered.push(pkg);
    }
  }

  // Step 2: individual dist-tag fetch for uncovered packages
  if (uncovered.length > 0) {
    console.log(
      `${uncovered.length} package(s) not in ${referencePackage}, fetching dist-tags individually: ${uncovered.join(
        ', '
      )}`
    );
    const allTags = await registry.getAllDistTags(uncovered);
    for (const pkg of uncovered) {
      const tags = allTags.get(pkg);
      if (!tags) {
        console.warn(`No dist-tags found for ${pkg}, skipping`);
        continue;
      }
      const version = tags[tag];
      if (!version) {
        console.warn(`No '${tag}' dist-tag for ${pkg}, skipping`);
        continue;
      }
      versions.set(pkg, version);
    }
  }

  return { versions };
}

async function resolveFromGitHub(packages: string[], scope: string, token: string): Promise<ResolvedVersions> {
  const runId = await github.getLatestPublishRunId(token, 'BitGo', 'BitGoJS');
  const logs = await github.getPublishJobLogs(token, 'BitGo', 'BitGoJS', runId);
  const allVersions = github.parseVersionsFromLogs(logs, scope);
  console.log(`Resolved ${allVersions.size} package versions from publish run ${runId}`);

  const versions = new Map<string, string>();
  for (const pkg of packages) {
    const version = allVersions.get(pkg);
    if (version) {
      versions.set(pkg, version);
    } else {
      console.warn(`Package ${pkg} not found in publish run ${runId} logs`);
    }
  }
  return { versions };
}

export async function resolveVersions(options: ResolveOptions): Promise<ResolvedVersions> {
  if (options.manifestPath) {
    return resolveFromManifest(options.manifestPath, options.packages);
  }
  if (options.githubToken) {
    return resolveFromGitHub(options.packages, options.scope, options.githubToken);
  }
  const referencePackage = options.referencePackage ?? `${options.scope}/bitgo`;
  return resolveFromRegistry(options.packages, options.tag, referencePackage);
}
