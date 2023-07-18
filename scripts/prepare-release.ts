import * as execa from 'execa';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import * as path from 'path';
import { get as httpGet } from 'https';
import { inc } from 'semver';

let lernaModules: string[] = [];
let lernaModuleLocations: string[] = [];
let TARGET_SCOPE = '@bitgo-beta';
let filesChanged = 0;

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
    await lerna('list', ['--loglevel', 'silent', '--json', '--all'])
  );
  lernaModules = modules.map(({ name }) => name);
  lernaModuleLocations = modules.map(({ location }) => location);
};

const walk = (dir: string): string[] => {
  let results: string[] = [];
  const ignoredFolders = [/node_modules/];
  const list = readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) {
      if (!ignoredFolders.some((folder) => folder.test(file))) {
        results = [...results, ...walk(file)];
      }
    } else if (['.ts', '.tsx', '.js', '.json'].includes(path.extname(file))) {
      // Is a file
      results.push(file);
    }
  });
  return results;
};

const changeScopeInFile = (filePath: string): void => {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  let newContent = oldContent;
  lernaModules.forEach((moduleName) => {
    const newName = `${moduleName.replace('@bitgo/', `${TARGET_SCOPE}/`)}`;
    newContent = newContent.replace(new RegExp(moduleName, 'g'), newName);
  });
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    ++filesChanged;
  }
};

const replacePackageScopes = () => {
  // replace all @bitgo packages & source code with alternate SCOPE
  const filePaths = [...walk(path.join(__dirname, '../', 'modules')), ...walk(path.join(__dirname, '../', 'webpack'))];
  filePaths.forEach((file) => changeScopeInFile(file));
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

// modules/bitgo is the only package we publish without an `@bitgo` prefix, so
// we must manually set one
const replaceBitGoPackageScope = () => {
  const cwd = path.join(__dirname, '../', 'modules', 'bitgo');
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  json.name = `${TARGET_SCOPE}/bitgo`;
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
};

/** Small version checkers in place of an npm dependency installation */
function compareversion(version1, version2) {
  let result = false;

  if (typeof version1 !== 'object') {
    version1 = version1.toString().split('.');
  }
  if (typeof version2 !== 'object') {
    version2 = version2.toString().split('.');
  }

  for (let i = 0; i < Math.max(version1.length, version2.length); i++) {
    if (version1[i] === undefined) {
      version1[i] = 0;
    }
    if (version2[i] === undefined) {
      version2[i] = 0;
    }

    if (Number(version1[i]) < Number(version2[i])) {
      result = true;
      break;
    }
    if (version1[i] !== version2[i]) {
      break;
    }
  }
  return result;
}

/**
 * increment the version based on the preid. default to `beta`
 *
 * @param {String | undefined} preid
 */
const incrementVersions = async (preid = 'beta') => {
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    try {
      const modulePath = lernaModuleLocations[i];
      const json = JSON.parse(readFileSync(path.join(modulePath, 'package.json'), { encoding: 'utf-8' }));
      const tags = await getDistTags(json.name);

      let prevTag: string | undefined = undefined;

      if (typeof tags !== 'string') {
        if (tags[preid]) {
          const version = tags[preid].split('-');
          const latest = tags?.latest?.split('-') ?? ['0.0.0'];
          prevTag = compareversion(version[0], latest[0]) ? `${tags.latest}-${preid}` : tags[preid];
        } else {
          prevTag = `${tags.latest}-${preid}`;
        }
      }

      if (prevTag) {
        const next = inc(prevTag, 'prerelease', undefined, preid);
        console.log(`Setting next version for ${json.name} to ${next}`);
        json.version = next;
        writeFileSync(path.join(modulePath, 'package.json'), JSON.stringify(json, null, 2) + '\n');
        // since we're manually setting new versions, we must also reconcile all other lerna packages to now use the 'next' version for this module
        lernaModuleLocations.forEach((otherModulePath) => {
          // skip it for the current version
          if (otherModulePath === modulePath) {
            return;
          }
          const otherJsonContent = readFileSync(path.join(otherModulePath, 'package.json'), { encoding: 'utf-8' });
          if (otherJsonContent.includes(json.name)) {
            const otherJson = JSON.parse(otherJsonContent);
            if (otherJson.dependencies && otherJson.dependencies[json.name]) {
              otherJson.dependencies[json.name] = next;
            }
            if (otherJson.devDependencies && otherJson.devDependencies[json.name]) {
              otherJson.devDependencies[json.name] = next;
            }
            writeFileSync(path.join(otherModulePath, 'package.json'), JSON.stringify(otherJson, null, 2) + '\n');
          }
        });
      }
    } catch (e) {
      // it's not necessarily a blocking error. Let lerna try and publish anyways
      console.warn(`Couldn't set next version for ${lernaModuleLocations[i]}`, e);
    }
  }
};

const getArgs = () => {
  const args = process.argv.slice(2) || [];
  const scopeArg = args.find((arg) => arg.startsWith('scope='));
  if (scopeArg) {
    const split = scopeArg.split('=');
    TARGET_SCOPE = split[1] || TARGET_SCOPE;
  }
  console.log(`Preparing to re-target to ${TARGET_SCOPE}`);
};

const main = async (preid?: string) => {
  getArgs();
  await getLernaModules();
  replacePackageScopes();
  replaceBitGoPackageScope();
  await incrementVersions(preid);
  if (filesChanged) {
    console.log(`Successfully re-targeted ${filesChanged} files.`);
    process.exit(0);
  } else {
    console.error('No files were changed, something must have gone wrong.');
    process.exit(1);
  }
};

main(process.argv.slice(2)[0]);
