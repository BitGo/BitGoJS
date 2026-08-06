/**
 * Generates modules/bitgo/npm-shrinkwrap.json, pinning the same resolved
 * versions as internal builds (yarn `resolutions`/npm `overrides`) so
 * `npm install bitgo` installs its workspace siblings correctly (WCI-1200).
 *
 * Runs as bitgo's `prepack` script, gated on BITGO_GENERATE_SHRINKWRAP=true.
 * Assumes siblings are already published on the registry — the release
 * workflow guarantees this by publishing siblings first, then bitgo via
 * `--include-private` (WCN-1818). An unresolvable sibling fails the release
 * loudly rather than shipping a broken shrinkwrap.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import execa from 'execa';

const rootDir = path.resolve(__dirname, '..');
const bitgoDir = path.join(rootDir, 'modules/bitgo');
const modulesDir = path.join(rootDir, 'modules');

/**
 * Workspace package names, read from disk rather than a hardcoded `@bitgo/`
 * prefix — on alpha/beta these get rescoped to `@bitgo-beta/*`, and a fixed
 * prefix would silently match nothing there.
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
