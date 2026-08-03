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
 * `@bitgo/*` siblings are resolved as part of the same tree as everything else.
 * `lerna publish` publishes packages in dependency-topological order, so by the
 * time bitgo (which depends on every sibling) is packed, the sibling versions it
 * references are already live on the registry. Resolving them here — rather than
 * excluding them and patching their names back into the shrinkwrap metadata after
 * the fact — is what makes the generated `packages["node_modules/@bitgo/..."]`
 * entries (version/resolved/integrity) actually present, which is what npm uses to
 * populate node_modules for consumers. A shrinkwrap that lists a dependency in
 * `packages[''].dependencies` without a matching resolved `packages[...]` entry is
 * silently dropped from the install by npm rather than falling back to normal
 * resolution — that's what an earlier version of this script did, which broke
 * `npm install bitgo` for every consumer (siblings never landed in node_modules).
 * If a sibling version isn't resolvable yet, the `npm install` below fails loudly
 * and the release fails — which is correct: better a failed release than a
 * silently broken shrinkwrap.
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
    const siblingNames = Object.keys(bitgoPackageJson.dependencies ?? {}).filter((name) => name.startsWith('@bitgo/'));
    if (siblingNames.length > 0) {
      console.log(`Resolving ${siblingNames.length} @bitgo/* siblings as part of the shrinkwrap:`);
      siblingNames.forEach((name) => console.log(`  - ${name}`));
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

    await execa('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: tempDir, stdio: 'inherit' });
    await execa('npm', ['shrinkwrap'], { cwd: tempDir, stdio: 'inherit' });

    const shrinkwrapPath = path.join(tempDir, 'npm-shrinkwrap.json');
    if (!fs.existsSync(shrinkwrapPath)) {
      throw new Error(`npm shrinkwrap did not produce a file at ${shrinkwrapPath}`);
    }

    const shrinkwrap = JSON.parse(fs.readFileSync(shrinkwrapPath, 'utf-8'));

    // Every @bitgo/* sibling must have a resolved node_modules entry — that's what
    // npm actually installs from. A sibling present only in `packages[''].dependencies`
    // (or missing entirely) would be silently skipped by consumers' installs.
    const resolvedPackageNames = new Set(
      Object.keys(shrinkwrap.packages ?? {})
        .filter((key) => key.startsWith('node_modules/'))
        .map((key) => key.slice('node_modules/'.length))
    );
    const unresolvedSiblings = siblingNames.filter((name) => !resolvedPackageNames.has(name));
    if (unresolvedSiblings.length > 0) {
      throw new Error(
        `The following @bitgo/* siblings have no resolved node_modules entry in the generated ` +
          `shrinkwrap and would be silently missing from consumers' installs: ${unresolvedSiblings.join(', ')}`
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
