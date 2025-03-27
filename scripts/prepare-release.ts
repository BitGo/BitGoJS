import * as assert from 'node:assert';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { inc, lt } from 'semver';
import {
  walk,
  getDistTagsForModuleLocations,
  getLernaModules,
  changeScopeInFile,
  setDependencyVersion,
} from './prepareRelease';

let lernaModules: string[] = [];
let lernaModuleLocations: string[] = [];
let TARGET_SCOPE = '@bitgo-beta';
let filesChanged = 0;
// Default to __dirname/.. but allow override via environment variable
const ROOT_DIR = process.env.BITGO_PREPARE_RELEASE_ROOT_DIR || path.join(__dirname, '..');

async function setLernaModules(): Promise<void> {
  const modules = await getLernaModules();
  lernaModules = modules.map(({ name }) => name);
  lernaModuleLocations = modules.map(({ location }) => location);
}

function replacePackageScopes() {
  // replace all @bitgo packages & source code with alternate SCOPE
  const filePaths = [...walk(path.join(ROOT_DIR, 'modules')), ...walk(path.join(ROOT_DIR, 'webpack'))];
  filePaths.forEach((file) => {
    filesChanged += changeScopeInFile(file, lernaModules, TARGET_SCOPE);
  });
}

// modules/bitgo is the only package we publish without an `@bitgo` prefix, so
// we must manually set one
function replaceBitGoPackageScope() {
  const cwd = path.join(ROOT_DIR, 'modules', 'bitgo');
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  json.name = `${TARGET_SCOPE}/bitgo`;
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}

/**
 * increment the version based on the preid. default to `beta`
 *
 * @param {String | undefined} preid
 */
async function incrementVersions(preid = 'beta') {
  const distTags = await getDistTagsForModuleLocations(lernaModuleLocations);
  for (let i = 0; i < lernaModuleLocations.length; i++) {
    try {
      const modulePath = lernaModuleLocations[i];
      const tags = distTags[i];
      const json = JSON.parse(readFileSync(path.join(modulePath, 'package.json'), { encoding: 'utf-8' }));

      let prevTag: string | undefined = undefined;

      if (typeof tags === 'object') {
        if (tags[preid]) {
          const version = tags[preid].split('-');
          const latest = tags?.latest?.split('-') ?? ['0.0.0'];
          prevTag = lt(version[0], latest[0]) ? `${tags.latest}-${preid}` : tags[preid];
        } else {
          prevTag = `${tags.latest}-${preid}`;
        }
      }

      if (prevTag) {
        const next = inc(prevTag, 'prerelease', undefined, preid);
        assert(typeof next === 'string', `Failed to increment version for ${json.name} prevTag=${prevTag}`);
        console.log(`Setting next version for ${json.name} to ${next}`);
        json.version = next;
        writeFileSync(path.join(modulePath, 'package.json'), JSON.stringify(json, null, 2) + '\n');
        // since we're manually setting new versions, we must also reconcile all other lerna packages to use the 'next' version for this module
        lernaModuleLocations.forEach((otherModulePath) => {
          // skip it for the current version
          if (otherModulePath === modulePath) {
            return;
          }
          const otherJsonContent = readFileSync(path.join(otherModulePath, 'package.json'), { encoding: 'utf-8' });
          if (otherJsonContent.includes(json.name)) {
            const otherJson = JSON.parse(otherJsonContent);
            setDependencyVersion(otherJson, json.name, next as string);
            writeFileSync(path.join(otherModulePath, 'package.json'), JSON.stringify(otherJson, null, 2) + '\n');
          }
        });
      }
    } catch (e) {
      // it's not necessarily a blocking error. Let lerna try and publish anyways
      console.warn(`Couldn't set next version for ${lernaModuleLocations[i]}`, e);
    }
  }
}

function getArgs() {
  const args = process.argv.slice(2) || [];
  const scopeArg = args.find((arg) => arg.startsWith('scope='));
  if (scopeArg) {
    const split = scopeArg.split('=');
    TARGET_SCOPE = split[1] || TARGET_SCOPE;
  }
  console.log(`Preparing to re-target to ${TARGET_SCOPE}`);
  console.log(`Using root directory: ${ROOT_DIR}`);
}

async function main(preid?: string) {
  getArgs();
  await setLernaModules();
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
}

main(process.argv.slice(2)[0]);
