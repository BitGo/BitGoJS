import execa from 'execa';
import { readFileSync } from 'fs';
import path from 'path';
import { getLernaModules, getDistTags } from './prepareRelease';

let lernaModuleLocations: string[] = [];

async function getLernaModuleLocations(): Promise<void> {
  const modules = await getLernaModules();
  lernaModuleLocations = modules.map(({ location }) => location);
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
      const { stdout, exitCode } = await execa(
        'npm',
        ['publish', '--tag', preid],
        { cwd },
      );
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
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    const dir = lernaModuleLocations[i];
    if (!(await verifyPackage(dir, preid))) {
      console.error('Failed to verify outstanding packages.');
      return;
    }
  }
}

// e.g. for alpha releases: `npx tsx ./scripts/verify-beta.ts alpha`
verify(process.argv.slice(2)[0]);
