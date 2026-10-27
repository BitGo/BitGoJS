import assert from 'node:assert';
import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { setTimeout as setTimeoutPromise } from 'node:timers/promises';
import { inc } from 'semver';
import {
  getDistTags,
  getLernaModules,
  setDependencyVersion,
  packageVersionExists,
  waitForPackageVersions,
  PackageVersionExists,
} from './prepareRelease';

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
  name: string;
  version: string;
  // Some workspace packages (e.g. modules/sdk-test) declare "private": "true" as
  // a string; npm treats any truthy value as private, so both forms are valid.
  private?: boolean | string;
}

function isPackageJson(value: unknown): value is PackageJson {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  if (!('name' in value) || typeof value.name !== 'string') return false;
  if (!('version' in value) || typeof value.version !== 'string') return false;
  if ('private' in value && typeof value.private !== 'boolean' && typeof value.private !== 'string') return false;
  if ('dependencies' in value && (typeof value.dependencies !== 'object' || value.dependencies === null)) return false;
  if ('devDependencies' in value && (typeof value.devDependencies !== 'object' || value.devDependencies === null))
    return false;
  return true;
}

export function readPackageJson(dir: string): PackageJson {
  const parsed: unknown = JSON.parse(readFileSync(path.join(dir, 'package.json'), { encoding: 'utf-8' }));
  if (!isPackageJson(parsed)) {
    throw new Error(`${dir}/package.json is missing string "name"/"version" fields`);
  }
  return parsed;
}

export interface WorkspaceModule {
  dir: string;
  json: PackageJson;
}

/**
 * Private modules are never published, so their versions never settle and
 * dependents' pins on them cannot go stale — they are excluded from the
 * release-verification ordering. bitgo is private but published, so it is
 * always included.
 */
function isUnpublishedModule(module: { dir: string; json: PackageJson }): boolean {
  return Boolean(module.json.private) && path.basename(module.dir) !== 'bitgo';
}

let lernaModuleLocations: string[] = [];

// Bump-on-conflict is the default posture: a Rekor/staged conflict does not mean
// the registry write failed, and dist-tags lag minutes behind completed writes.
// Set RECOVERY_MODE=false to restore fail-fast behavior.
const RECOVERY_MODE = process.env.RECOVERY_MODE !== 'false';
const MAX_RECOVERY_ATTEMPTS = 5;
// After a recoverable publish conflict, poll this long for the version to appear
// on npm before bumping it — the write usually completed despite the client error.
const CONFLICT_POLL_TIMEOUT_MS = 5 * 60_000;
const VERSION_POLL_DELAY_MS = 30_000;

async function getLernaModuleLocations(): Promise<void> {
  const modules = await getLernaModules();
  lernaModuleLocations = modules.map(({ location }) => location);
}

export function isRecoverablePublishConflict(output: string): boolean {
  return (
    output.includes('TLOG_CREATE_ENTRY_ERROR') ||
    output.includes('previously staged version') ||
    output.includes('publish over the previously published version') ||
    (output.includes('409 Conflict') && output.includes('transparency log')) ||
    (output.includes('(409)') && output.includes('transparency log'))
  );
}

export interface PublishRecoveryOptions {
  /** Publishes the package in `cwd` with the given dist-tag. Injectable for tests; defaults to `npm publish --provenance`. */
  runPublish?: (cwd: string, preid: string) => Promise<string>;
  /** Injectable for tests. */
  versionExists?: PackageVersionExists;
  /** Injectable for tests. */
  sleep?: (delayMs: number) => Promise<void>;
  /** Injectable for tests. */
  now?: () => number;
  /** Poll budget after a conflict before bumping. Injectable for tests. */
  conflictPollTimeoutMs?: number;
}

// npm publish failures carry the CLI output on execa errors; join stdout/stderr
// for pattern matching.
function publishErrorOutput(e: unknown): string {
  const parts: string[] = [];
  if (typeof e === 'object' && e !== null) {
    if ('stdout' in e && typeof e.stdout === 'string') parts.push(e.stdout);
    if ('stderr' in e && typeof e.stderr === 'string') parts.push(e.stderr);
  }
  return parts.join('\n');
}

const defaultRunPublish = async (cwd: string, preid: string): Promise<string> => {
  const env: NodeJS.ProcessEnv = { ...process.env };
  // bitgo's prepack only generates npm-shrinkwrap.json when asked; the fallback
  // publish must ship it exactly like the lerna pass does. Its prepack keeps
  // the FULL default sibling wait: the settle pass may have bumped and
  // republished siblings seconds before this publish, and the earlier global
  // propagation wait only covered the original versions. When everything is
  // already visible the prepack check passes in one round, so the budget is
  // only spent when it is genuinely needed.
  if (path.basename(cwd) === 'bitgo') {
    env.BITGO_GENERATE_SHRINKWRAP = 'true';
  }
  const result = await execa('npm', ['publish', '--tag', preid, '--provenance'], { cwd, env });
  return result.stdout;
};

// Recovers a stuck package after a publish conflict: polls the registry on the
// first attempt in case the write completed despite the client error, then
// bumps the version — a fresh version has no Rekor entry and no staged
// conflict, so it publishes cleanly.
export async function publishWithRecovery(
  cwd: string,
  json: PackageJson,
  preid: string,
  options: PublishRecoveryOptions = {}
): Promise<{ stdout: string; exitCode: number }> {
  const runPublish = options.runPublish ?? defaultRunPublish;
  const versionExists = options.versionExists ?? packageVersionExists;
  const sleepFn = options.sleep ?? setTimeoutPromise;
  const now = options.now ?? Date.now;
  const conflictPollTimeoutMs = options.conflictPollTimeoutMs ?? CONFLICT_POLL_TIMEOUT_MS;
  const maxAttempts = RECOVERY_MODE ? MAX_RECOVERY_ATTEMPTS : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const stdout = await runPublish(cwd, preid);
      return { stdout, exitCode: 0 };
    } catch (e) {
      const output = publishErrorOutput(e);
      if (!RECOVERY_MODE || !isRecoverablePublishConflict(output)) {
        throw e;
      }
      // Poll only on the first attempt: a bumped version is a fresh tarball, so
      // a conflict on it cannot be an equivalent-entry false negative — bump
      // immediately instead. A staged-version conflict also skips polling: npm
      // holds the version, so polling can never make it visible.
      if (attempt === 1 && !output.includes('previously staged version')) {
        const missing = await waitForPackageVersions([{ name: json.name, version: json.version }], {
          timeoutMs: conflictPollTimeoutMs,
          delayMs: VERSION_POLL_DELAY_MS,
          versionExists,
          sleep: sleepFn,
          now,
        });
        if (missing.length === 0) {
          console.log(
            `${json.name}: ${json.version} is visible on npm after the publish conflict — treating the publish as complete.`
          );
          return { stdout: output, exitCode: 0 };
        }
      }
      if (attempt === maxAttempts) {
        throw new Error(`${json.name}: still hitting a publish conflict after ${maxAttempts} version bumps`);
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

// Dist-tags are flaky at exactly the moments we care about (right after
// publishes, and for never-published names npm returns 401 instead of 404). A
// few retries before falling back keeps one bad read from failing the release.
export async function getDistTagsWithRetry(
  packageName: string,
  fetcher: (name: string) => Promise<Record<string, string>> = getDistTags,
  attempts = 3,
  delayMs = 5000,
  sleep: (delayMs: number) => Promise<void> = setTimeoutPromise
): Promise<Record<string, string>> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetcher(packageName);
    } catch (e) {
      if (attempt === attempts) {
        throw e;
      }
      console.warn(`Dist-tags fetch for ${packageName} failed (attempt ${attempt}/${attempts}), retrying...`);
      await sleep(delayMs);
    }
  }
  // unreachable: the loop above always returns or throws
  throw new Error(`unreachable: dist-tags fetch loop for ${packageName}`);
}

export interface VerifyPackageOptions {
  versionExists?: PackageVersionExists;
  fetchDistTags?: (name: string) => Promise<Record<string, string>>;
  runPublish?: (cwd: string, preid: string) => Promise<string>;
}

// Verifies one package against registry truth and, when needed, (re)publishes
// it with the local — already final — pins:
//  - on npm, pins unchanged: report success (with a note if the dist-tag lags)
//  - on npm, pins changed since its publish (a dependency settled later in this
//    run): npm cannot change a published manifest, so bump and republish
//  - missing from npm: publish (conflict-tolerant recovery included)
// Every success path prints the canonical "<name> matches expected version
// <version>" line that beta-tools' bump-bitgo-beta parses from run logs.
export async function verifyPackage(
  dir: string,
  preid = 'beta',
  pinsDirty = false,
  options: VerifyPackageOptions = {}
): Promise<boolean> {
  const cwd = dir;
  const json = readPackageJson(cwd);
  if (isUnpublishedModule({ dir, json })) {
    return true;
  }
  const versionExists = options.versionExists ?? packageVersionExists;
  const fetchDistTags = options.fetchDistTags ?? getDistTags;
  const runPublish = options.runPublish ?? defaultRunPublish;

  const reportSuccess = () => {
    console.log(`${json.name} matches expected version ${json.version}`);
    return true;
  };
  const attemptPublish = async (): Promise<boolean> => {
    try {
      const { stdout, exitCode } = await publishWithRecovery(cwd, json, preid, { runPublish });
      console.log(stdout);
      if (exitCode !== 0) {
        return false;
      }
      return reportSuccess();
    } catch (e) {
      console.error(`${json.name}: recovery publish failed: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  };

  if (pinsDirty) {
    const next = inc(json.version, 'prerelease', undefined, preid);
    assert(typeof next === 'string', `Failed to increment version for ${json.name}`);
    json.version = next;
    writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
    console.warn(
      `${json.name}: published pins are stale (a dependency settled after its publish); ` +
        `bumping to ${next} and republishing with the final pins.`
    );
    // npm cannot change a published manifest, so a new version is the only
    // fix — regardless of what a visibility read would say. A failed or
    // lagging read must never make us republish the stale version itself:
    // the republish would be rejected with publish-over-published, the
    // conflict poll would then see the old version as visible, and the run
    // would go green with the stale pins still shipped.
    return attemptPublish();
  }

  // Registry truth: the exact-version endpoint. A version published moments
  // ago can be absent from dist-tags while already queryable here. A read
  // failure is treated as not-visible so the publish attempt still runs.
  let visibleOnRegistry = false;
  try {
    visibleOnRegistry = await versionExists(json.name, json.version);
  } catch (e) {
    console.warn(`Registry check failed for ${json.name}@${json.version}; falling through to dist-tags`, e);
  }

  if (visibleOnRegistry) {
    // One non-fatal dist-tags read for the log: if the tag still lags, npm
    // will catch up on its own — republishing cannot move it.
    try {
      const distTags = await fetchDistTags(json.name);
      if (distTags[preid] !== json.version) {
        console.log(
          `${json.name}@${json.version} is on npm but the "${preid}" dist-tag still points at ` +
            `${distTags[preid] ?? '(none)'}; npm propagation will catch up.`
        );
      }
    } catch (e) {
      console.warn(`Dist-tags read for ${json.name} failed after publish; ignoring`, e);
    }
    return reportSuccess();
  }

  try {
    const distTags = await getDistTagsWithRetry(json.name, fetchDistTags);
    console.log(
      `${json.name} missing from npm. Expected ${json.version}, dist-tag "${preid}" is ${distTags[preid] ?? '(none)'}`
    );
  } catch (e) {
    console.warn(`Failed to fetch dist tags for ${json.name}; proceeding with recovery publish`, e);
  }
  return attemptPublish();
}

/**
 * Orders workspace modules dependencies-first (Kahn's algorithm) over
 * production-dependency edges, so a package is only ever verified and published
 * after every dependency's version has settled. bitgo depends on the whole
 * workspace and nothing depends on it, so it lands last. Throws on a dependency
 * cycle, which a publishable workspace must not contain.
 */
export function topoOrder(modules: ReadonlyArray<WorkspaceModule>): WorkspaceModule[] {
  const targets = modules.filter((m) => !isUnpublishedModule(m));
  const byName: Record<string, WorkspaceModule> = {};
  for (const m of targets) {
    byName[m.json.name] = m;
  }
  const targetNames = new Set(targets.map((m) => m.json.name));
  const remainingDeps: Record<string, number> = {};
  const dependents: Record<string, string[]> = {};
  for (const m of targets) {
    const deps = Object.keys(m.json.dependencies ?? {}).filter((dep) => targetNames.has(dep));
    remainingDeps[m.json.name] = deps.length;
    for (const dep of deps) {
      (dependents[dep] ??= []).push(m.json.name);
    }
  }
  const ready = targets.filter((m) => remainingDeps[m.json.name] === 0).map((m) => m.json.name);
  const ordered: WorkspaceModule[] = [];
  while (ready.length > 0) {
    const name = ready.shift();
    if (name === undefined) break;
    const module = byName[name];
    if (module === undefined) continue;
    ordered.push(module);
    for (const dependent of dependents[name] ?? []) {
      remainingDeps[dependent] -= 1;
      if (remainingDeps[dependent] === 0) {
        ready.push(dependent);
      }
    }
  }
  if (ordered.length !== targets.length) {
    throw new Error(
      'Workspace dependency cycle detected among publishable modules; cannot order release verification.'
    );
  }
  return ordered;
}

/**
 * Writes `name@version` into every module's dependency pins (prod and dev) and
 * returns the names of modules whose PRODUCTION pin changed. Those modules'
 * intended pins now diverge from whatever lerna published earlier in this run,
 * so their published manifest is stale and they must be bumped and republished
 * when their turn comes. dev-only pin changes are written for repo hygiene but
 * never mark a module dirty: consumers do not install devDependencies.
 */
export function propagateVersionToDependents(
  modules: ReadonlyArray<WorkspaceModule>,
  name: string,
  version: string
): string[] {
  const changed: string[] = [];
  for (const mod of modules) {
    if (mod.json.name === name) continue;
    const json = readPackageJson(mod.dir);
    const before = JSON.stringify(json, null, 2) + '\n';
    const prodPinBefore = json.dependencies?.[name];
    setDependencyVersion(json, name, version);
    const after = JSON.stringify(json, null, 2) + '\n';
    if (after !== before) {
      writeFileSync(path.join(mod.dir, 'package.json'), after);
      // Only a PRODUCTION pin that actually moved marks the module dirty — a
      // dev-only pin update (e.g. the prod pin already pointed at the new
      // version) must not trigger a redundant bump+republish.
      if (prodPinBefore !== undefined && prodPinBefore !== version) {
        changed.push(json.name);
      }
    }
  }
  return changed;
}

export interface SettleOptions {
  /** Verifies (and if needed, bump-) publishes one package. Injectable for tests. */
  verifyPackage: (dir: string, preid: string, pinsDirty: boolean) => Promise<boolean>;
  /** Injectable for tests. */
  propagate?: typeof propagateVersionToDependents;
  /** Stop at the first failed package (non-recovery mode) instead of continuing. */
  failFast?: boolean;
}

/**
 * The heart of the release fix: verify (and publish where needed) every
 * module in dependency order, so each package's pins are final before its
 * turn and exactly one pass converges. When a module's version settles
 * (staged-conflict recovery bump, or a stale-pin republish), the final version
 * is propagated into every dependent's local pins and those dependents are
 * marked dirty; a dependent that was already published then gets one
 * bump+republish at its own turn. In dependency order a dependent is never
 * processed before its dependencies settle, so dirtyPins can only ever mark
 * modules that have not been processed yet.
 *
 * Failure safety: npm is append-only, so a failed publish must block every
 * dependent's publish too — nothing ships pinning a version that never
 * settled, even though the run is already red. The block is transitive through
 * the same topological order.
 *
 * Returns true when any package failed to verify/publish.
 */
export async function settleInDependencyOrder(
  modules: ReadonlyArray<WorkspaceModule>,
  preid: string,
  options: SettleOptions
): Promise<boolean> {
  const settleOrder = topoOrder(modules);
  // Invariant: lerna published the LOCAL state, so at verify entry every
  // published manifest matches its local package.json. dirtyPins therefore
  // starts EMPTY — do not pre-populate it; only pin changes made during this
  // run mark a module as needing a bump+republish.
  const dirtyPins: Record<string, true> = {};
  // Packages that failed to settle, or were skipped because a dependency of
  // theirs failed. npm is append-only: even on an already-red run, publishing
  // a dependent that pins an unsettled version would ship a permanently
  // broken artifact and move the dist-tag to it, so failures must block every
  // downstream publish. Topological order makes the block transitive for
  // free: a skipped module is itself marked blocked before its dependents'
  // turns arrive.
  const blocked: Record<string, true> = {};

  let anyFailed = false;
  for (const mod of settleOrder) {
    const before = readPackageJson(mod.dir);
    const blockingDependency = Object.keys(before.dependencies ?? {}).find((dep) => blocked[dep] === true);
    if (blockingDependency !== undefined) {
      console.error(
        `${before.name}: skipping publish — dependency ${blockingDependency} did not settle; ` +
          'not shipping a version that pins it.'
      );
      blocked[before.name] = true;
      anyFailed = true;
      continue;
    }
    const ok = await options.verifyPackage(mod.dir, preid, dirtyPins[before.name] === true);
    const after = readPackageJson(mod.dir);
    if (ok && after.version !== before.version) {
      for (const changed of (options.propagate ?? propagateVersionToDependents)(modules, after.name, after.version)) {
        dirtyPins[changed] = true;
      }
    }
    if (!ok) {
      console.error(`Failed to verify ${after.name}.`);
      blocked[after.name] = true;
      if (options.failFast) {
        return true;
      }
      // keep publishing the rest of the packages instead of aborting on the first stuck one
      anyFailed = true;
    }
  }
  return anyFailed;
}

async function verify(preid?: string) {
  await getLernaModuleLocations();
  const modules: WorkspaceModule[] = lernaModuleLocations.map((dir) => ({ dir, json: readPackageJson(dir) }));
  const expected = modules
    .filter((m) => !isUnpublishedModule(m))
    .map((m) => ({ name: m.json.name, version: m.json.version }));

  // One bounded wait for the whole release: a successful publish can stay
  // invisible on npm for minutes (occasionally much longer when npm stages a
  // version), so wait for propagation once here instead of racing it
  // package-by-package below.
  const stillMissing = await waitForPackageVersions(expected);
  if (stillMissing.length > 0) {
    console.warn(
      `${stillMissing.length} expected version(s) did not become visible within the propagation window; ` +
        'attempting recovery publish for those below.'
    );
  }
  const anyFailed = await settleInDependencyOrder(modules, preid ?? 'beta', {
    verifyPackage: (dir, preidArg, pinsDirty) => verifyPackage(dir, preidArg, pinsDirty),
    failFast: !RECOVERY_MODE,
  });
  if (anyFailed) {
    process.exitCode = 1;
  }
}

// e.g. for alpha releases: `npx tsx ./scripts/verify-release.ts alpha`
if (require.main === module) {
  verify(process.argv.slice(2)[0]);
}
