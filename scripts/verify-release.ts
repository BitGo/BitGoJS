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

// Steps in publish.yml tee their lerna output here; Verify's propagation wait
// trusts this list (fail-open: unreadable or empty logs revert to waiting for
// every package, so the list is an optimization, never a correctness dependency).
const publishedLogEnvVars = ['LERNA_SIBLINGS_PUBLISH_LOG', 'LERNA_BITGO_PUBLISH_LOG'];

export interface LernaPublishLog {
  /** Packages lerna confirmed published (`lerna success published <name> <version>`). */
  published: Set<string>;
  /**
   * Packages lerna dispatched a publish for (`lerna verb publish <name>`),
   * published or errored. A TLOG-409-errored package usually landed on npm anyway
   * (the error is a duplicate-provenance false negative), so the propagation
   * wait must cover it — otherwise the settle republishes it, hits a conflict,
   * and burns a needless version bump plus dependent-bump cascades.
   */
  attempted: Set<string>;
}

/** Extracts the package names lerna actually published from its step log. */
export function parseLernaPublishedPackages(logText: string): Set<string> {
  // Require a version (digit-led) after the name: lerna also logs a count
  // summary — `lerna success published 24 packages` — whose bare number must
  // not land in the set (it would inflate the size used by
  // shouldShortPollConflict's aborted-wave threshold), and \S+ (not
  // @-anchored) so unscoped names would match too.
  return new Set([...logText.matchAll(/lerna success published (\S+) \d+\./g)].map((m) => m[1]));
}

/** Extracts every package lerna dispatched a publish for, successful or not. */
export function parseLernaAttemptedPackages(logText: string): Set<string> {
  // `lerna verb publish <name>` fires per attempt (retries log it again), so
  // the Set dedupes; a stray non-package token is harmless — it can never
  // match a candidate name.
  return new Set([...logText.matchAll(/lerna verb publish (\S+)/g)].map((m) => m[1]));
}

/**
 * Parses both lerna publish logs. Returns undefined when the result cannot be
 * trusted — callers must then fall back to waiting for every package
 * (fail-open): no log was readable, or a readable log yielded no recognized
 * lines at all, which means lerna's output format drifted and every set built
 * from it would be wrong.
 */
export function readLernaPublishSets(env: NodeJS.ProcessEnv = process.env): LernaPublishLog | undefined {
  const result: LernaPublishLog = { published: new Set(), attempted: new Set() };
  let failedAnyRead = false;
  let readAnyLog = false;
  for (const envVar of publishedLogEnvVars) {
    const logPath = env[envVar];
    if (!logPath) continue;
    try {
      const logText = readFileSync(logPath, 'utf-8');
      readAnyLog = true;
      const logPublished = parseLernaPublishedPackages(logText);
      const logAttempted = parseLernaAttemptedPackages(logText);
      if ([...logPublished].some((name) => !logAttempted.has(name))) {
        // Success lines without matching verb lines mean the `lerna verb publish`
        // grammar drifted: attempted would silently shrink to published,
        // bringing back the needless-bump behavior without tripping the
        // zero-lines drift check.
        console.warn(
          `Lerna log ${logPath}: published packages without a \`lerna verb publish\` line — output-format drift?`
        );
      }
      for (const name of logPublished) result.published.add(name);
      for (const name of logAttempted) result.attempted.add(name);
    } catch (e) {
      failedAnyRead = true;
      console.warn(`Could not read ${envVar} (${logPath})`, e);
    }
  }
  // A partial read must never shrink the wait list: one unreadable log would
  // drop every package it carried from the wait — the exact needless-bump
  // failure this change exists to prevent. Fail open whenever any configured
  // log is unreadable.
  if (failedAnyRead) {
    console.warn('Failing open to the full propagation wait: not every configured lerna log was readable.');
    return undefined;
  }
  if (!readAnyLog) return undefined;
  // attempted must be a superset of published: a package with a success line
  // but no verb line (partial log, output-format variance) must still get the
  // propagation wait — never skipping the wait for something that landed.
  for (const name of result.published) {
    result.attempted.add(name);
  }
  if (result.published.size === 0 && result.attempted.size === 0) {
    console.warn(
      'Lerna publish logs were readable but contained no recognized publish or attempt lines — ' +
        'possible lerna output-format drift; failing open to the full propagation wait.'
    );
    return undefined;
  }
  return result;
}

/**
 * Decides whether per-package conflict polls should be capped short during the
 * settle pass. Both signals mean the registry is degraded: most of the wait
 * list never became visible, or lerna's wave aborted before attempting half the
 * tree (so the settle will republish most packages and any conflicts must not
 * each burn the full poll budget).
 */
export function shouldShortPollConflict(
  stillMissingCount: number,
  waitListCount: number,
  lernaReachedCount: number | undefined,
  candidateCount: number
): boolean {
  if (waitListCount > 0 && stillMissingCount > waitListCount / 2) {
    return true;
  }
  return lernaReachedCount !== undefined && candidateCount > 0 && lernaReachedCount < candidateCount / 2;
}

// Bump-on-conflict is the default posture: a Rekor/staged conflict does not mean
// the registry write failed, and dist-tags lag minutes behind completed writes.
// Set RECOVERY_MODE=false to restore fail-fast behavior.
const RECOVERY_MODE = process.env.RECOVERY_MODE !== 'false';
const MAX_RECOVERY_ATTEMPTS = 5;
// After a recoverable publish conflict, poll this long for the version to appear
// on npm before bumping it — the write usually completed despite the client error.
const CONFLICT_POLL_TIMEOUT_MS = 5 * 60_000;
const VERSION_POLL_DELAY_MS = 30_000;
// On mass-stall days (most of the tree invisible, or lerna's wave aborted early)
// the settle republishes most packages; a full 5-minute poll per conflict would
// blow the job cap, so polls are capped to a ~30s budget (at most two checks
// at the 30s delay) on those days.
// The cap applies to every package for the whole settle pass (it is computed
// once, before the settle starts): a package whose write genuinely completed
// but is still propagating gets ~2 checks and then a version bump. That bump
// is the accepted cost on degraded-registry days — bounded beats packages × 5
// minutes against the job cap, and beta version numbers are cheap.
const MASS_STALL_CONFLICT_POLL_TIMEOUT_MS = 30_000;

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
  /** Injectable for tests. */
  sleep?: (delayMs: number) => Promise<void>;
  /** Injectable for tests. */
  now?: () => number;
  /** Caps publishWithRecovery's per-package conflict poll; used by the settle pass on mass-stall days. */
  conflictPollTimeoutMs?: number;
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
      const { stdout, exitCode } = await publishWithRecovery(cwd, json, preid, {
        runPublish,
        versionExists,
        sleep: options.sleep,
        now: options.now,
        conflictPollTimeoutMs: options.conflictPollTimeoutMs,
      });
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
  const candidates = modules.filter((m) => !isUnpublishedModule(m));

  // Wait only for packages lerna reached (published or errored). Packages a
  // storm-aborted wave never dispatched cannot be on npm, so waiting for them
  // is pure loss — the settle pass below republishes them immediately instead.
  // Errored packages ARE waited for: a TLOG 409 usually means the registry
  // write completed anyway, and without the wait the settle would bump them
  // (and their dependents) needlessly. The reverse cost is accepted: when the
  // errored writes genuinely never landed (Oct 29's storm profile), the wait
  // runs its full budget on their names instead of resolving early. Fail-open:
  // without a readable publish log the wait covers every package (the log is
  // an optimization, never a correctness dependency).
  const lernaLog = readLernaPublishSets();
  const waitList = lernaLog ? candidates.filter((m) => lernaLog.attempted.has(m.json.name)) : candidates;
  if (lernaLog && waitList.length < candidates.length) {
    console.log(
      `Lerna reached ${waitList.length} of ${candidates.length} packages ` +
        `(${lernaLog.published.size} published); skipping the propagation wait for the other ` +
        `${candidates.length - waitList.length} never dispatched (the settle pass republishes them).`
    );
  }
  const expected = waitList.map((m) => ({ name: m.json.name, version: m.json.version }));

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
  // Mass-stall days (most of the wait list invisible, or lerna's wave aborted
  // early) mean the settle will republish most packages; cap the per-package
  // conflict poll so a degraded registry cannot turn it into (packages × 5 min).
  const conflictPollTimeoutMs = shouldShortPollConflict(
    stillMissing.length,
    expected.length,
    lernaLog?.attempted.size,
    candidates.length
  )
    ? MASS_STALL_CONFLICT_POLL_TIMEOUT_MS
    : undefined;
  const anyFailed = await settleInDependencyOrder(modules, preid ?? 'beta', {
    verifyPackage: (dir, preidArg, pinsDirty) => verifyPackage(dir, preidArg, pinsDirty, { conflictPollTimeoutMs }),
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
