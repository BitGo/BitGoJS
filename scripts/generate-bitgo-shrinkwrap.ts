/**
 * Generates modules/bitgo/npm-shrinkwrap.json, pinning the same resolved
 * versions as internal builds (yarn `resolutions`/npm `overrides`) so
 * `npm install bitgo` installs its workspace siblings correctly (WCI-1200).
 *
 * Runs as bitgo's `prepack` script, gated on BITGO_GENERATE_SHRINKWRAP=true.
 * Before npm resolves the isolated package, it verifies that every exact workspace
 * sibling version is visible on the public registry. Missing versions are retried
 * three times to absorb npm propagation delay before the release fails loudly.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
const rootDir = path.resolve(__dirname, '..');
const bitgoDir = path.join(rootDir, 'modules/bitgo');
const modulesDir = path.join(rootDir, 'modules');
const npmRegistryUrl = 'https://registry.npmjs.org';
const siblingAvailabilityAttempts = 3;
const siblingAvailabilityDelayMs = 30_000;

type PackageJson = {
  name?: unknown;
  version?: unknown;
  dependencies?: Record<string, string>;
  overrides?: Record<string, unknown>;
};

export type WorkspaceSibling = {
  name: string;
  version: string;
};

export type RegistryResponse = {
  status: number;
  statusText?: string;
};

export type RegistryFetcher = (url: string) => Promise<RegistryResponse>;
export type Sleep = (delayMs: number) => Promise<void>;

/**
 * Workspace package versions, read from disk rather than a hardcoded `@bitgo/`
 * prefix — on alpha/beta these get rescoped to `@bitgo-beta/*`.
 */
export function getWorkspacePackageVersions(modulesDirectory = modulesDir): Map<string, string> {
  const versions = new Map<string, string>();
  for (const entry of fs.readdirSync(modulesDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(modulesDirectory, entry.name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJson;
    if (typeof pkg.name !== 'string') continue;
    if (typeof pkg.version !== 'string') {
      throw new Error(`Workspace package ${pkg.name} at ${pkgPath} has no valid version.`);
    }
    versions.set(pkg.name, pkg.version);
  }
  return versions;
}

export function getWorkspaceSiblingDependencies(
  dependencies: Record<string, string> | undefined,
  workspacePackageVersions: ReadonlyMap<string, string>
): WorkspaceSibling[] {
  return Object.keys(dependencies ?? {}).flatMap((name) => {
    const version = workspacePackageVersions.get(name);
    return version === undefined ? [] : [{ name, version }];
  });
}

const fetchRegistry: RegistryFetcher = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  return { status: response.status, statusText: response.statusText };
};

function registryUrlFor(sibling: WorkspaceSibling): string {
  return `${npmRegistryUrl}/${encodeURIComponent(sibling.name)}/${encodeURIComponent(sibling.version)}`;
}

export async function findUnavailableWorkspaceSiblings(
  siblings: readonly WorkspaceSibling[],
  registryFetcher: RegistryFetcher = fetchRegistry
): Promise<WorkspaceSibling[]> {
  const results = await Promise.all(
    siblings.map(async (sibling) => {
      const url = registryUrlFor(sibling);
      let response: RegistryResponse;
      try {
        response = await registryFetcher(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to check npm availability for ${sibling.name}@${sibling.version}: ${message}`);
      }

      if (response.status === 404 || response.status === 410) {
        return sibling;
      }
      if (response.status < 200 || response.status >= 300) {
        const statusText = response.statusText ? ` ${response.statusText}` : '';
        throw new Error(
          `Failed to check npm availability for ${sibling.name}@${sibling.version}: ` +
            `HTTP ${response.status}${statusText}`
        );
      }
      return undefined;
    })
  );

  return results.filter((sibling): sibling is WorkspaceSibling => sibling !== undefined);
}

export interface WorkspaceSiblingAvailabilityOptions {
  registryFetcher?: RegistryFetcher;
  sleep?: Sleep;
  attempts?: number;
  delayMs?: number;
}

const sleep: Sleep = (delayMs) => setTimeoutPromise(delayMs);

export async function ensureWorkspaceSiblingVersionsAvailable(
  siblings: readonly WorkspaceSibling[],
  options: WorkspaceSiblingAvailabilityOptions = {}
): Promise<void> {
  if (siblings.length === 0) return;

  const registryFetcher = options.registryFetcher ?? fetchRegistry;
  const sleepFn = options.sleep ?? sleep;
  const attempts = options.attempts ?? siblingAvailabilityAttempts;
  const delayMs = options.delayMs ?? siblingAvailabilityDelayMs;
  if (attempts < 1) {
    throw new Error(`Workspace sibling availability checks require at least one attempt, got ${attempts}.`);
  }

  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`Checking npm availability for workspace siblings (attempt ${attempt}/${attempts}).`);
    const missing = await findUnavailableWorkspaceSiblings(siblings, registryFetcher);
    if (missing.length === 0) return;

    const missingPackages = missing.map(({ name, version }) => `${name}@${version}`);
    console.warn(`Missing workspace sibling versions: ${missingPackages.join(', ')}`);
    if (attempt === attempts) {
      throw new Error(
        `Workspace sibling versions are still unavailable from npm after ${attempts} checks: ` +
          `${missingPackages.join(', ')}. This is likely npm registry propagation delay; ` +
          'retry the release in recovery mode after these versions become visible.'
      );
    }

    console.log(`Waiting ${delayMs}ms before the next npm availability check.`);
    await sleepFn(delayMs);
  }
}

/**
 * Retries on ETARGET/E404 only — covers a just-published sibling not yet
 * propagated to the registry. Any other failure throws immediately.
 */
async function npmInstallWithRetry(cwd: string, attempts = 5, delayMs = 5000): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await execa('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd });
      if (result.stdout) process.stdout.write(result.stdout + '\n');
      if (result.stderr) process.stderr.write(result.stderr + '\n');
      return;
    } catch (e) {
      const err = e as execa.ExecaError;
      if (err.stdout) process.stdout.write(err.stdout + '\n');
      if (err.stderr) process.stderr.write(err.stderr + '\n');
      const output = `${err.stdout ?? ''}\n${err.stderr ?? ''}\n${err.message ?? ''}`;
      const looksLikePropagationLag = /\bETARGET\b/.test(output) || /\bE404\b/.test(output);
      if (attempt === attempts || !looksLikePropagationLag) {
        throw e;
      }
      console.log(
        `npm install failed with what looks like a registry propagation delay ` +
          `(attempt ${attempt}/${attempts}) — retrying in ${delayMs}ms.`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function main() {
  if (process.env.BITGO_GENERATE_SHRINKWRAP !== 'true') {
    console.log('BITGO_GENERATE_SHRINKWRAP not set to "true" — skipping npm-shrinkwrap.json generation.');
    return;
  }

  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')) as PackageJson;
  const bitgoPackageJson = JSON.parse(fs.readFileSync(path.join(bitgoDir, 'package.json'), 'utf-8')) as PackageJson;

  if (!rootPackageJson.overrides) {
    throw new Error('Root package.json has no "overrides" block to propagate into the bitgo shrinkwrap.');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bitgo-shrinkwrap-'));
  console.log(`Generating npm-shrinkwrap.json for bitgo@${bitgoPackageJson.version} in ${tempDir}`);

  try {
    const workspacePackageVersions = getWorkspacePackageVersions();
    const siblingDependencies = getWorkspaceSiblingDependencies(
      bitgoPackageJson.dependencies,
      workspacePackageVersions
    );
    const siblingNames = siblingDependencies.map(({ name }) => name);
    if (siblingNames.length > 0) {
      console.log(`Resolving ${siblingNames.length} workspace siblings as part of the shrinkwrap:`);
      siblingNames.forEach((name) => console.log(`  - ${name}`));
    } else {
      console.log(
        'No workspace siblings found among bitgo dependencies — double check this is expected ' +
          '(e.g. an intentionally sibling-free release), since a detection bug here would silently ' +
          'skip the safety check below.'
      );
    }

    const isolatedPackageJson: Record<string, unknown> = { ...bitgoPackageJson };
    delete isolatedPackageJson.devDependencies;
    delete isolatedPackageJson.scripts;
    const directDeps = new Set(Object.keys(bitgoPackageJson.dependencies ?? {}));
    const filteredOverrides = Object.fromEntries(
      Object.entries(rootPackageJson.overrides as Record<string, unknown>).filter(
        ([name, value]) => typeof value !== 'string' || !directDeps.has(name)
      )
    );
    const filteredCount = Object.keys(rootPackageJson.overrides).length - Object.keys(filteredOverrides).length;
    if (filteredCount > 0) {
      console.log(`Skipping ${filteredCount} override(s) already pinned as direct bitgo dependencies.`);
    }
    isolatedPackageJson.overrides = filteredOverrides;

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(isolatedPackageJson, null, 2) + '\n');

    await ensureWorkspaceSiblingVersionsAvailable(siblingDependencies);
    await npmInstallWithRetry(tempDir);
    await execa('npm', ['shrinkwrap'], { cwd: tempDir, stdio: 'inherit' });

    const shrinkwrapPath = path.join(tempDir, 'npm-shrinkwrap.json');
    if (!fs.existsSync(shrinkwrapPath)) {
      throw new Error(`npm shrinkwrap did not produce a file at ${shrinkwrapPath}`);
    }

    const shrinkwrap = JSON.parse(fs.readFileSync(shrinkwrapPath, 'utf-8'));

    // Require version + resolved + integrity, not just key presence — a
    // partially-specified entry is still unusable by npm.
    const packages = (shrinkwrap.packages ?? {}) as Record<string, Record<string, unknown>>;
    const unresolvedSiblings = siblingNames.filter((name) => {
      const entry = packages[`node_modules/${name}`];
      return (
        !entry ||
        typeof entry.version !== 'string' ||
        typeof entry.resolved !== 'string' ||
        typeof entry.integrity !== 'string'
      );
    });
    if (unresolvedSiblings.length > 0) {
      throw new Error(
        `The following workspace siblings have no fully-resolved (version + resolved + integrity) ` +
          `node_modules entry in the generated shrinkwrap and would be silently missing or ` +
          `under-specified in consumers' installs: ${unresolvedSiblings.join(', ')}`
      );
    }

    fs.writeFileSync(path.join(bitgoDir, 'npm-shrinkwrap.json'), JSON.stringify(shrinkwrap, null, 2) + '\n');
    console.log(`Wrote ${path.join(bitgoDir, 'npm-shrinkwrap.json')}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
