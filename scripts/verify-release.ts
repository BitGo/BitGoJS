import assert from 'node:assert';
import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { inc } from 'semver';
import { getLernaModules, getDistTags } from './prepareRelease';

const RECOVERY_MODE = process.env.RECOVERY_MODE === 'true';
const MAX_RECOVERY_ATTEMPTS = 5;

/**
 * npm processes publishes asynchronously (publish-time malware scanning, since 2026-07-28):
 * a successful `npm publish` only means the upload was accepted, and the version becomes
 * visible on the registry later — minutes in the normal case, hours at the tail. Every
 * decision below therefore waits for the version to actually appear rather than trusting
 * the publish exit code, and "already published" is reconciled instead of re-published.
 */
const visibilityTimeoutEnvVar = 'BITGO_PUBLISH_VISIBILITY_TIMEOUT_MINUTES';
const defaultVisibilityTimeoutMs = 60 * 60_000;
const visibilityDelayMs = 30_000;
const npmRegistryUrl = 'https://registry.npmjs.org';

export type VersionInfo = {
  /** Whether the registry serves this exact version. */
  found: boolean;
  /** Only meaningful for `bitgo`; whether the published version carries shrinkwrap metadata. */
  hasShrinkwrap: boolean;
};

export type FetchVersionInfo = (name: string, version: string) => Promise<VersionInfo>;
export type Publish = (cwd: string, preid: string) => Promise<{ stdout: string }>;
export type Sleep = (delayMs: number) => Promise<void>;

const defaultFetchVersionInfo: FetchVersionInfo = async (name, version) => {
  const url = `${npmRegistryUrl}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
  const response = await fetch(url);
  if (response.status === 404 || response.status === 410) {
    return { found: false, hasShrinkwrap: false };
  }
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as { _hasShrinkwrap?: unknown };
  return { found: true, hasShrinkwrap: body._hasShrinkwrap === true };
};

const defaultPublish: Publish = async (cwd, preid) => {
  const result = await execa('npm', ['publish', '--tag', preid, '--provenance'], { cwd });
  return { stdout: result.stdout ?? '' };
};

export function getVisibilityTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env[visibilityTimeoutEnvVar];
  if (raw === undefined || raw.trim() === '') return defaultVisibilityTimeoutMs;
  const minutes = Number(raw);
  if (!Number.isFinite(minutes) || minutes < 0) {
    throw new Error(`${visibilityTimeoutEnvVar} must be zero or more minutes, got "${raw}".`);
  }
  return minutes * 60_000;
}

export type VerifyDeps = {
  fetchVersionInfo: FetchVersionInfo;
  publish: Publish;
  sleep: Sleep;
  now: () => number;
  getDistTags: (packageName: string) => Promise<Record<string, string>>;
  getLernaModules: () => Promise<Array<{ location: string }>>;
  visibilityTimeoutMs: number;
  visibilityDelayMs: number;
};

export const defaultVerifyDeps: VerifyDeps = {
  fetchVersionInfo: defaultFetchVersionInfo,
  publish: defaultPublish,
  sleep: (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  now: Date.now,
  getDistTags,
  getLernaModules,
  visibilityTimeoutMs: getVisibilityTimeoutMs(),
  visibilityDelayMs,
};

/**
 * Polls until the exact version is served by the registry, or the budget runs out.
 * Returns the last observation, so callers decide what a timeout means.
 */
export async function waitForVersionInfo(
  name: string,
  version: string,
  deps: Pick<
    VerifyDeps,
    'fetchVersionInfo' | 'sleep' | 'now' | 'visibilityTimeoutMs' | 'visibilityDelayMs'
  > = defaultVerifyDeps
): Promise<VersionInfo> {
  const startedAt = deps.now();
  let checks = 0;
  for (;;) {
    checks += 1;
    const info = await deps.fetchVersionInfo(name, version);
    if (info.found) {
      if (checks > 1) {
        console.log(`${name}@${version} became visible on npm after ${Math.round((deps.now() - startedAt) / 1000)}s.`);
      }
      return info;
    }
    console.log(
      `${name}@${version} is not visible on npm yet (check ${checks}, ` +
        `${Math.round((deps.now() - startedAt) / 1000)}s elapsed).`
    );
    const elapsedMs = deps.now() - startedAt;
    if (elapsedMs + deps.visibilityDelayMs > deps.visibilityTimeoutMs) {
      console.warn(
        `${name}@${version} is still not visible after ${Math.round(elapsedMs / 1000)}s ` +
          `(budget ${Math.round(deps.visibilityTimeoutMs / 1000)}s); npm publish-time processing can take longer.`
      );
      return info;
    }
    await deps.sleep(deps.visibilityDelayMs);
  }
}

export function isRecoverablePublishConflict(output: string): boolean {
  return (
    output.includes('TLOG_CREATE_ENTRY_ERROR') ||
    output.includes('previously staged version') ||
    (output.includes('409 Conflict') && output.includes('transparency log')) ||
    (output.includes('(409)') && output.includes('transparency log')) ||
    // npm rejects a publish whose exact version already exists on the registry.
    output.includes('EPUBLISHCONFLICT') ||
    output.includes('cannot publish over the previously published versions') ||
    (output.includes('E403') && output.includes('previously published'))
  );
}

/**
 * A published `bitgo` without shrinkwrap metadata is unusable by consumers (npm only honors
 * a shipped shrinkwrap when the registry reports `_hasShrinkwrap`), so it does not count as
 * published and must be re-published.
 */
function isUsablePublishedVersion(name: string, version: string, info: VersionInfo, isBitgo: boolean): boolean {
  if (!info.found) {
    console.log(`${name}@${version} is not visible on npm yet.`);
    return false;
  }
  if (isBitgo && !info.hasShrinkwrap) {
    console.warn(`${name}@${version} is on npm but without shrinkwrap metadata.`);
    return false;
  }
  return true;
}

// retries a stuck package's publish, bumping its version each time to sidestep an already-logged Rekor entry for that exact tarball digest
async function publishWithRecovery(
  cwd: string,
  json: any,
  preid: string,
  deps: VerifyDeps = defaultVerifyDeps
): Promise<{ stdout: string }> {
  const isBitgo = path.basename(cwd) === 'bitgo';
  const maxAttempts = RECOVERY_MODE ? MAX_RECOVERY_ATTEMPTS : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { stdout } = await deps.publish(cwd, preid);
      console.log(stdout);
      // A successful publish only means the upload was accepted; confirm the registry serves it.
      const info = await waitForVersionInfo(json.name, json.version, deps);
      if (!isUsablePublishedVersion(json.name, json.version, info, isBitgo)) {
        throw new Error(
          `${json.name}@${json.version}: npm reported success but the version is not usable on the registry yet.`
        );
      }
      return { stdout };
    } catch (e: any) {
      const output = `${e.stdout ?? ''}\n${e.stderr ?? ''}\n${e.message ?? ''}`;
      if (!isRecoverablePublishConflict(output)) {
        throw e;
      }
      // Reconcile first: the conflict usually means a previous attempt already published this
      // exact version and the registry had not caught up when we looked.
      const info = await waitForVersionInfo(json.name, json.version, deps);
      if (isUsablePublishedVersion(json.name, json.version, info, isBitgo)) {
        console.log(
          `${json.name}@${json.version} is already published and usable — treating the publish conflict as resolved.`
        );
        return { stdout: output };
      }
      if (attempt === maxAttempts) {
        throw new Error(
          `${json.name}@${json.version} could not be published: the version is taken but not usable` +
            (maxAttempts > 1
              ? ` after ${maxAttempts} version bumps.`
              : '. Re-run with recovery-mode to bump and retry.')
        );
      }
      const next = inc(json.version, 'prerelease', undefined, preid);
      assert(typeof next === 'string', `Failed to increment version for ${json.name}`);
      json.version = next;
      writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
      console.warn(
        `${json.name}: publish conflict, retrying with bumped version ${json.version} (attempt ${
          attempt + 1
        }/${maxAttempts})`
      );
    }
  }
  // unreachable: the loop above always returns or throws
  throw new Error(`${json.name}: exhausted publish attempts`);
}

export async function verifyPackage(
  dir: string,
  preid = 'beta',
  deps: VerifyDeps = defaultVerifyDeps
): Promise<boolean> {
  const cwd = dir;
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  // bitgo is private but still published via lerna --include-private.
  if (json.private && path.basename(cwd) !== 'bitgo') {
    return true;
  }

  const isBitgo = path.basename(cwd) === 'bitgo';

  try {
    const info = await waitForVersionInfo(json.name, json.version, deps);
    if (isUsablePublishedVersion(json.name, json.version, info, isBitgo)) {
      console.log(`${json.name} matches expected version ${json.version}`);
      // The version is the source of truth; a dist-tag that has not moved is worth flagging because
      // consumers resolve `@<preid>` through it, but it must not fail an otherwise complete publish.
      try {
        const distTags = await deps.getDistTags(json.name);
        if (distTags[preid] !== json.version) {
          console.warn(
            `${json.name}: ${json.version} is published but the "${preid}" dist-tag points at ` +
              `${distTags[preid] ?? 'nothing'} — consumers using @${preid} will not get this release.`
          );
        }
      } catch (tagError) {
        console.warn(`Failed to check the "${preid}" dist-tag for ${json.name}`, tagError);
      }
      return true;
    }

    console.log(`${json.name} missing. Expected ${json.version}`);
    await publishWithRecovery(cwd, json, preid, deps);
    return true;
  } catch (e) {
    console.warn(`Failed to verify ${json.name}`, e);
    return false;
  }
}

export async function verify(preid?: string, deps: VerifyDeps = defaultVerifyDeps): Promise<string[]> {
  const modules = await deps.getLernaModules();
  const failed: string[] = [];
  // Check every package before failing so the log lists everything that is missing, not just the first.
  for (const { location: dir } of modules) {
    if (!(await verifyPackage(dir, preid, deps))) {
      failed.push(path.basename(dir));
    }
  }
  if (failed.length > 0) {
    console.error(`Failed to verify outstanding packages: ${failed.join(', ')}`);
    // Fail closed in every mode: a run must never be green while packages are missing from npm.
    process.exitCode = 1;
  }
  return failed;
}

// e.g. for alpha releases: `npx tsx ./scripts/verify-release.ts alpha`
if (require.main === module) {
  verify(process.argv.slice(2)[0]);
}
