import { readFileSync, writeFileSync, existsSync } from 'fs';
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
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

export type PackageVersionExists = (packageName: string, version: string) => Promise<boolean>;

export const packageVersionExists: PackageVersionExists = async (packageName, version) => {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`;
  const response = await fetch(url);
  if (response.status === 404 || response.status === 410) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText} ${await response.text()}`);
  }
  return true;
};

export async function findFirstUnpublishedVersion(
  packageName: string,
  initialCandidate: string,
  preid: string,
  versionExists: PackageVersionExists = packageVersionExists
): Promise<string> {
  let candidate = initialCandidate;
  while (await versionExists(packageName, candidate)) {
    const next = inc(candidate, 'prerelease', undefined, preid);
    if (!next) {
      throw new Error(`Failed to increment occupied version ${packageName}@${candidate}`);
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
            case '@bitgo-beta/beta-tools':
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

const versionWaitTimeoutEnvVar = 'BITGO_VERIFY_PUBLISH_WAIT_MINUTES';
const defaultVersionWaitTimeoutMs = 15 * 60_000; // 15 minutes
const defaultVersionPollDelayMs = 30_000; // 30 seconds
const maxConsecutiveVersionCheckErrors = 5;

/**
 * Wall-clock budget for waiting until published versions become queryable on npm.
 * Registry writes can complete minutes before they are visible, and npm can hold
 * failed-write versions in a staged state for far longer, so callers must never
 * treat an immediate 404 after a publish as final.
 */
export function getVersionWaitTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[versionWaitTimeoutEnvVar];
  if (raw === undefined || raw.trim() === '') return defaultVersionWaitTimeoutMs;
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error(`${versionWaitTimeoutEnvVar} must be zero or more minutes, got "${raw}".`);
  }
  return minutes * 60_000;
}

export interface PackageVersionWaitOptions {
  /** Total wall-clock budget for waiting. Defaults to getVersionWaitTimeoutMs(). Zero polls once and does not wait. */
  timeoutMs?: number;
  /** Delay between polls. Defaults to 30s. */
  delayMs?: number;
  /** Wall-clock source in milliseconds. Injectable for tests. */
  now?: () => number;
  /** Injectable for tests. */
  sleep?: (delayMs: number) => Promise<void>;
  /** Injectable for tests. */
  versionExists?: PackageVersionExists;
}

function formatWaitDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const minutes = ms / 60_000;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min`;
}

/**
 * Polls the registry's exact-version endpoint until every requested version is
 * visible or the time budget runs out, then returns the versions still missing.
 * A request whose registry checks keep failing is degraded to "not visible"
 * (returned in the missing list) rather than aborting the wait for all packages.
 */
export async function waitForPackageVersions(
  requests: ReadonlyArray<{ name: string; version: string }>,
  options: PackageVersionWaitOptions = {}
): Promise<{ name: string; version: string }[]> {
  if (requests.length === 0) return [];

  const versionExists = options.versionExists ?? packageVersionExists;
  const sleepFn = options.sleep ?? setTimeoutPromise;
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? getVersionWaitTimeoutMs();
  const delayMs = options.delayMs ?? defaultVersionPollDelayMs;
  if (!(timeoutMs >= 0)) {
    throw new Error(`Version wait timeout must be zero or more milliseconds, got ${timeoutMs}.`);
  }
  if (!(delayMs > 0)) {
    throw new Error(`Version wait delay must be more than zero milliseconds, got ${delayMs}.`);
  }

  const startedAt = now();
  let pending: { name: string; version: string; errorStreak: number }[] = requests.map((request) => ({
    ...request,
    errorStreak: 0,
  }));
  const erroredOut: { name: string; version: string; errorStreak: number }[] = [];
  let checks = 0;

  for (;;) {
    checks += 1;
    console.log(
      `Checking npm for ${pending.length} expected package version(s) (check ${checks}, ${formatWaitDuration(
        now() - startedAt
      )} elapsed).`
    );
    const nextPending: { name: string; version: string; errorStreak: number }[] = [];
    await Promise.all(
      pending.map(async (request) => {
        try {
          const exists = await versionExists(request.name, request.version);
          // A round that resolved (even to not-visible) breaks the error streak,
          // so only consecutive failures count toward the cap.
          request.errorStreak = 0;
          if (!exists) nextPending.push(request);
        } catch (error) {
          request.errorStreak += 1;
          if (request.errorStreak > maxConsecutiveVersionCheckErrors) {
            // One persistently-failing URL must not abort the wait for the other
            // packages; degrade it to "not visible" and let the caller's recovery
            // path deal with it.
            console.warn(
              `Registry check for ${request.name}@${request.version} failed ${request.errorStreak} rounds in a row; treating as not visible.`
            );
            erroredOut.push(request);
          } else {
            console.warn(`Registry check failed for ${request.name}@${request.version}, will retry: ${error}`);
            nextPending.push(request);
          }
        }
      })
    );
    pending = nextPending;
    if (pending.length === 0) {
      if (erroredOut.length === 0 && checks > 1) {
        console.log(
          `All ${requests.length} expected package versions are visible on npm after ${formatWaitDuration(
            now() - startedAt
          )}.`
        );
      }
      return erroredOut.map(({ name, version }) => ({ name, version }));
    }
    const elapsedMs = now() - startedAt;
    if (elapsedMs + delayMs > timeoutMs) {
      const missing = pending.concat(erroredOut).map(({ name, version }) => ({ name, version }));
      console.warn(
        `Still missing from npm after ${checks} checks over ${formatWaitDuration(elapsedMs)}: ` +
          missing.map(({ name, version }) => `${name}@${version}`).join(', ')
      );
      return missing;
    }
    console.log(`Waiting ${delayMs}ms before the next npm version check.`);
    await sleepFn(delayMs);
  }
}
