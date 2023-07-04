import * as execa from 'execa';
import { readFileSync } from 'fs';
import * as path from 'path';
import { get as httpGet } from 'https';

let lernaModuleLocations: string[] = [];

/**
 * Create a function which can run lerna commands
 * @param {String} lernaPath - path to lerna binary
 * @returns {function(string, string[], Object.<string, string>): Promise<string>}
 */
function getLernaRunner(lernaPath: string) {
  return async (command: string, args: string[] = [], options = {}) => {
    const { stdout } = await execa(lernaPath, [command, ...args], options);
    return stdout;
  };
}

const getLernaModules = async (): Promise<void> => {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);
  const modules: Array<{ name: string; location: string }> = JSON.parse(
    await lerna('list', ['--loglevel', 'silent', '--json', '--all', '--toposort'])
  );

  lernaModuleLocations = modules.map(({ location }) => location);
};

/**
 * Makes an HTTP request to fetch all the dist tags for a given package.
 */
const getDistTags = async (packageName: string): Promise<Record<string, string>> => {
  return new Promise((resolve) => {
    httpGet(`https://registry.npmjs.org/-/package/${packageName}/dist-tags`, (res) => {
      let data = '';
      res.on('data', (d) => {
        data += d;
      });
      res.on('end', () => {
        const tags: Record<string, string> = JSON.parse(data);
        resolve(tags);
      });
    });
  });
};

const verifyPackage = async (dir: string, preid: string = 'beta'): Promise<boolean> => {
  const cwd = dir;
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  if (json.private) {
    return true;
  }
  const distTags = await getDistTags(json.name);
  if (json.version !== distTags[preid]) {
    console.log(`${json.name} missing. Expected ${json.version}, latest is ${distTags[preid]}`);
    const { stdout, exitCode } = await execa('npm', ['publish', '--tag', preid], { cwd });
    console.log(stdout);
    return exitCode === 0;
  } else {
    console.log(`${json.name} matches expected version ${json.version}`);
  }
  return true;
};

const verify = async (preid?: string) => {
  await getLernaModules();
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    const dir = lernaModuleLocations[i];
    if (!(await verifyPackage(dir, preid))) {
      console.error('Failed to verify outstanding packages.');
      return;
    }
  }
};

// e.g. for alpha releases: `npx ts-node ./scripts/verify-beta.ts alpha`
verify(process.argv.slice(2)[0]);
