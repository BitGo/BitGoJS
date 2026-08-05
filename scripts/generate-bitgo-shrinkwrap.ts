/**
 * Generates modules/bitgo/npm-shrinkwrap.json so npm consumers who install `bitgo`
 * as a dependency get the same pinned transitive versions that yarn `resolutions`
 * (mirrored as npm `overrides` in the root package.json) already give internal builds.
 *
 * Runs as bitgo's `prepack` script, so it fires after lerna has bumped the version
 * on disk but before the tarball is packed — the generated shrinkwrap's top-level
 * name/version always matches what actually gets published. Only runs when
 * BITGO_GENERATE_SHRINKWRAP=true (set by the release workflow) — otherwise a plain
 * local/offline `npm pack` would force a network install of the full dependency tree.
 *
 * Workspace siblings are resolved as part of the same tree as everything else, not
 * stripped out. Resolving them here — rather than excluding them and patching their
 * names back into the shrinkwrap metadata after the fact — is what makes the
 * generated `packages["node_modules/<sibling>"]` entries (version/resolved/integrity)
 * actually present, which is what npm uses to populate node_modules for consumers.
 * A shrinkwrap that lists a dependency in `packages[''].dependencies` without a
 * matching resolved `packages[...]` entry is silently dropped from the install by
 * npm rather than falling back to normal resolution — that's what an earlier version
 * of this script did, which broke `npm install bitgo` for every consumer (siblings
 * never landed in node_modules).
 *
 * This assumes sibling versions are already live on the registry when this script
 * runs. That is NOT true of a single combined `lerna publish` — lerna runs every
 * package's lifecycle hooks (bitgo's `prepack` included) before uploading any of
 * them, so bitgo's siblings are not yet published at the point this script tries to
 * resolve them. The release workflow is responsible for publishing siblings in a
 * separate, earlier pass — bitgo is committed `private`, so `lerna publish
 * from-package` filters it out of that pass — before invoking a second pass that
 * re-includes bitgo (`--include-private`) and packs it with generation enabled. If a
 * sibling version genuinely isn't resolvable (wrong pass ordering, a sibling publish
 * that itself failed, etc.), the `npm install` below fails loudly and the release
 * fails — which is correct: better a failed release than a silently broken
 * shrinkwrap. A short retry accounts for ordinary registry propagation lag right
 * after a sibling publish; see `npmInstallWithRetry`.
 *
 * `npm shrinkwrap` isn't workspace-aware and modules/bitgo/.npmrc sets
 * `package-lock=false`, so generation happens in an isolated temp copy outside the
 * workspace, resolving against the real npm registry.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';

const rootDir = path.resolve(__dirname, '..');
const bitgoDir = path.join(rootDir, 'modules/bitgo');
const modulesDir = path.join(rootDir, 'modules');

/**
 * Names of every package in the `modules/*` workspace, read from each package's own
 * (possibly rescoped) package.json — e.g. `@bitgo/sdk-core` normally, `@bitgo-beta/sdk-core`
 * on beta/alpha channels after `prepare-release.ts` re-scopes the workspace. Reading
 * the current on-disk names, rather than hardcoding a scope prefix, is what makes
 * sibling detection work regardless of which scope is active: `prepare-release.ts`
 * rewrites both a module's own `name` and bitgo's `dependencies` keys to the same
 * target scope, so intersecting bitgo's dependencies against this set matches
 * correctly on every channel. A hardcoded `@bitgo/` prefix check matches nothing on
 * alpha/beta (where everything is `@bitgo-beta/*`), which would make the safety check
 * below silently verify zero siblings instead of catching a real problem.
 */
function getWorkspacePackageNames(): Set<string> {
  const names = new Set<string>();
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(modulesDir, entry.name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (typeof pkg.name === 'string') names.add(pkg.name);
  }
  return names;
}

/**
 * Runs `npm install --package-lock-only --ignore-scripts`, retrying a bounded number
 * of times if the failure looks like a sibling that was *just* published not having
 * propagated to the registry yet (ETARGET/E404) — the two-phase publish flow runs
 * this immediately after the sibling-publish pass completes, so a brief propagation
 * lag is expected occasionally, not a sign of a real problem. Any other failure (or
 * exhausting the retries) is rethrown as-is.
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

async function main() {
  if (process.env.BITGO_GENERATE_SHRINKWRAP !== 'true') {
    console.log('BITGO_GENERATE_SHRINKWRAP not set to "true" — skipping npm-shrinkwrap.json generation.');
    return;
  }

  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const bitgoPackageJson = JSON.parse(fs.readFileSync(path.join(bitgoDir, 'package.json'), 'utf-8'));

  if (!rootPackageJson.overrides) {
    throw new Error('Root package.json has no "overrides" block to propagate into the bitgo shrinkwrap.');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bitgo-shrinkwrap-'));
  console.log(`Generating npm-shrinkwrap.json for bitgo@${bitgoPackageJson.version} in ${tempDir}`);

  try {
    const workspacePackageNames = getWorkspacePackageNames();
    const siblingNames = Object.keys(bitgoPackageJson.dependencies ?? {}).filter((name) =>
      workspacePackageNames.has(name)
    );
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

    await npmInstallWithRetry(tempDir);
    await execa('npm', ['shrinkwrap'], { cwd: tempDir, stdio: 'inherit' });

    const shrinkwrapPath = path.join(tempDir, 'npm-shrinkwrap.json');
    if (!fs.existsSync(shrinkwrapPath)) {
      throw new Error(`npm shrinkwrap did not produce a file at ${shrinkwrapPath}`);
    }

    const shrinkwrap = JSON.parse(fs.readFileSync(shrinkwrapPath, 'utf-8'));

    // Every workspace sibling must have a fully-resolved node_modules entry — that's
    // what npm actually installs from. A sibling present only in
    // `packages[''].dependencies` (or missing entirely, or present but missing
    // version/resolved/integrity) would be silently skipped or under-specified in
    // consumers' installs. Checking only for key presence previously let this pass
    // for entries npm still couldn't act on; require the actual install-relevant
    // fields to be strings, not just truthy.
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
