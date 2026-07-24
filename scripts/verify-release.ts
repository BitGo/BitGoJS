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

function isRekorConflict(output: string): boolean {
  return (
    output.includes('TLOG_CREATE_ENTRY_ERROR') ||
    (output.includes('(409)') && output.includes('transparency log'))
  );
}

// retries a stuck package's publish, bumping its version each time to sidestep an already-logged Rekor entry for that exact tarball digest
async function publishWithRecovery(
  cwd: string,
  json: any,
  preid: string,
): Promise<{ stdout: string; exitCode: number }> {
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
      if (!RECOVERY_MODE || !isRekorConflict(output)) {
        throw e;
      }
      if (attempt === maxAttempts) {
        throw new Error(
          `${json.name}: still hitting a Rekor tarball-digest conflict after ${maxAttempts} version bumps`,
        );
      }
      const next = inc(json.version, 'prerelease', undefined, preid);
      assert(typeof next === 'string', `Failed to increment version for ${json.name}`);
      json.version = next;
      writeFileSync(
        path.join(cwd, 'package.json'),
        JSON.stringify(json, null, 2) + '\n',
      );
      console.warn(
        `${json.name}: Rekor conflict, retrying with bumped version ${json.version} (attempt ${attempt + 1}/${maxAttempts})`,
      );
    }
  }
  // unreachable: the loop above always returns or throws
  throw new Error(`${json.name}: exhausted publish attempts`);
}

async function verifyPackage(dir: string, preid = 'beta'): Promise<boolean> {
  const cwd = dir;
  const json = JSON.parse(
    readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }),
  );
  if (json.private) {
    return true;
  }

  try {
    const distTags = await getDistTags(json.name);
    if (json.version !== distTags[preid]) {
      console.log(
        `${json.name} missing. Expected ${json.version}, latest is ${distTags[preid]}`,
      );
      const { stdout, exitCode } = await publishWithRecovery(cwd, json, preid);
      console.log(stdout);
      return exitCode === 0;
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
  let anyFailed = false;
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    const dir = lernaModuleLocations[i];
    if (!(await verifyPackage(dir, preid))) {
      console.error('Failed to verify outstanding packages.');
      if (!RECOVERY_MODE) {
        return;
      }
      // keep bumping/retrying the rest of the packages instead of aborting on the first stuck one
      anyFailed = true;
    }
  }
  if (anyFailed) {
    process.exitCode = 1;
  }
}

// e.g. for alpha releases: `npx tsx ./scripts/verify-beta.ts alpha`
verify(process.argv.slice(2)[0]);
