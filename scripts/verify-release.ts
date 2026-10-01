import assert from 'node:assert';
import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { inc } from 'semver';
import { getLernaModules, getDistTags } from './prepareRelease';

let lernaModuleLocations: string[] = [];

const RECOVERY_MODE = process.env.RECOVERY_MODE === 'true';
const MAX_RECOVERY_ATTEMPTS = 5;

async function getLernaModuleLocations(): Promise<void> {
  const modules = await getLernaModules();
  lernaModuleLocations = modules.map(({ location }) => location);
}

function isRecoverablePublishConflict(output: string): boolean {
  return (
    output.includes('TLOG_CREATE_ENTRY_ERROR') ||
    output.includes('previously staged version') ||
    (output.includes('409 Conflict') && output.includes('transparency log')) ||
    (output.includes('(409)') && output.includes('transparency log'))
  );
}

// The manifest fields this script reads and writes; everything else is
// preserved verbatim through the read → mutate → write cycle.
type PackageManifest = {
  name: string;
  version: string;
  private?: boolean;
  [key: string]: unknown;
};

function writePackageJson(cwd: string, json: PackageManifest): void {
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}

// retries a stuck package's publish, bumping its version each time to sidestep an already-logged Rekor entry for that exact tarball digest
async function publishWithRecovery(
  cwd: string,
  json: PackageManifest,
  preid: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const maxAttempts = RECOVERY_MODE ? MAX_RECOVERY_ATTEMPTS : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await execa(
        'npm',
        ['publish', '--tag', preid, '--provenance'],
        { cwd },
      );
    } catch (e: any) {
      const output = `${e.stdout ?? ''}\n${e.stderr ?? ''}`;
      if (!RECOVERY_MODE || !isRecoverablePublishConflict(output)) {
        throw e;
      }
      if (attempt === maxAttempts) {
        throw new Error(
          `${json.name}: still hitting a publish conflict after ${maxAttempts} version bumps`,
        );
      }
      const next = inc(json.version, 'prerelease', undefined, preid);
      assert(typeof next === 'string', `Failed to increment version for ${json.name}`);
      json.version = next;
      writePackageJson(cwd, json);
      console.warn(
        `${json.name}: publish conflict, retrying with bumped version ${json.version} (attempt ${attempt + 1}/${maxAttempts})`,
      );
    }
  }
  // unreachable: the loop above always returns or throws
  throw new Error(`${json.name}: exhausted publish attempts`);
}

async function verifyPackage(dir: string, preid = 'beta'): Promise<boolean> {
  const cwd = dir;
  const json: PackageManifest = JSON.parse(
    readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }),
  );
  // bitgo is private but still published via lerna --include-private.
  if (json.private && path.basename(cwd) !== 'bitgo') {
    return true;
  }

  try {
    const distTags = await getDistTags(json.name);
    if (json.version !== distTags[preid]) {
      console.log(
        `${json.name} missing. Expected ${json.version}, latest is ${distTags[preid]}`,
      );
      // `npm publish` will not publish a package marked private: it refuses
      // with EPRIVATE, and inside a workspace it is worse — npm *silently
      // skips* the workspace with exit code 0 and only a stderr warning, so
      // the release reports success while bitgo never lands on npm (run
      // 36817983431: green, bitgo@2198 unpublished). lerna's
      // --include-private publishes it by dropping the flag first; do the
      // same here and restore it after publishing.
      const restorePrivate = json.private === true;
      if (restorePrivate) {
        delete json.private;
        writePackageJson(cwd, json);
      }
      try {
        const { stdout, stderr, exitCode } = await publishWithRecovery(cwd, json, preid);
        // print stderr too: npm routes warnings there (e.g. "Skipping
        // workspace"), and it is the only evidence of a silent skip
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.warn(stderr);
        }
        return exitCode === 0;
      } finally {
        if (restorePrivate) {
          json.private = true;
          writePackageJson(cwd, json);
        }
      }
    } else {
      console.log(`${json.name} matches expected version ${json.version}`);
    }
    return true;
  } catch (e) {
    console.warn(`Failed to fetch dist tags for ${json.name}`, e);
    return false;
  }
}

async function verify(preid?: string) {
  await getLernaModuleLocations();
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    const dir = lernaModuleLocations[i];
    if (!(await verifyPackage(dir, preid))) {
      console.error('Failed to verify outstanding packages.');
      // fail the run in both modes: a non-recovery failure used to return
      // early with exit code 0, reporting success (WCI-1650)
      process.exitCode = 1;
      if (!RECOVERY_MODE) {
        return;
      }
      // recovery mode keeps bumping/retrying the rest of the packages
      // instead of aborting on the first stuck one
    }
  }
}

// e.g. for alpha releases: `npx tsx ./scripts/verify-release.ts alpha`
verify(process.argv.slice(2)[0]);
