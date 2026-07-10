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
 * `@bitgo/*` siblings are deliberately excluded from the resolved tree: `lerna
 * publish` bumps and packs every package in the same operation, so a sibling's
 * newly-bumped version is not guaranteed to be live on the registry yet when bitgo
 * is packed — resolving it here would either fail the release outright or silently
 * pin a stale sibling version. Excluding them means consumers resolve `@bitgo/*`
 * siblings normally (by then they are published); everything beneath those siblings
 * still gets pinned via `overrides` for whichever version ends up installed.
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
      console.log(`Excluding ${siblingNames.length} @bitgo/* siblings from shrinkwrap resolution:`);
      siblingNames.forEach((name) => console.log(`  - ${name}`));
    }

    const isolatedPackageJson: Record<string, unknown> = { ...bitgoPackageJson };
    delete isolatedPackageJson.devDependencies;
    delete isolatedPackageJson.scripts;
    isolatedPackageJson.dependencies = Object.fromEntries(
      Object.entries(bitgoPackageJson.dependencies ?? {}).filter(([name]) => !name.startsWith('@bitgo/'))
    );
    isolatedPackageJson.overrides = rootPackageJson.overrides;

    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(isolatedPackageJson, null, 2) + '\n');

    await execa('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd: tempDir, stdio: 'inherit' });
    await execa('npm', ['shrinkwrap'], { cwd: tempDir, stdio: 'inherit' });

    const shrinkwrapPath = path.join(tempDir, 'npm-shrinkwrap.json');
    if (!fs.existsSync(shrinkwrapPath)) {
      throw new Error(`npm shrinkwrap did not produce a file at ${shrinkwrapPath}`);
    }

    // The shrinkwrap was generated against a package.json with @bitgo/* siblings
    // removed, so its top-level `dependencies` no longer lists them. Restore the
    // real dependency list so the shipped shrinkwrap matches what's published.
    const shrinkwrap = JSON.parse(fs.readFileSync(shrinkwrapPath, 'utf-8'));
    shrinkwrap.dependencies = bitgoPackageJson.dependencies;
    if (shrinkwrap.packages?.['']) {
      shrinkwrap.packages[''].dependencies = bitgoPackageJson.dependencies;
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
