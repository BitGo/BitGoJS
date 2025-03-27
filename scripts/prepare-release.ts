import * as assert from 'node:assert';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { inc, lt } from 'semver';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  walk,
  getDistTagsForModuleLocations,
  getLernaModules,
  changeScopeInFile,
  setDependencyVersion,
} from './prepareRelease';

async function setLernaModules(): Promise<{
  modules: string[];
  locations: string[];
}> {
  const modules = await getLernaModules();
  return {
    modules: modules.map(({ name }) => name),
    locations: modules.map(({ location }) => location),
  };
}

function replacePackageScopes(rootDir: string, lernaModules: string[], targetScope: string): number {
  let filesChanged = 0;
  // replace all @bitgo packages & source code with alternate SCOPE
  const filePaths = [...walk(path.join(rootDir, 'modules')), ...walk(path.join(rootDir, 'webpack'))];
  filePaths.forEach((file) => {
    filesChanged += changeScopeInFile(file, lernaModules, targetScope);
  });
  return filesChanged;
}

// modules/bitgo is the only package we publish without an `@bitgo` prefix, so
// we must manually set one
function replaceBitGoPackageScope(rootDir: string, targetScope: string): void {
  const cwd = path.join(rootDir, 'modules', 'bitgo');
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  json.name = `${targetScope}/bitgo`;
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}

/**
 * increment the version based on the preid.
 *
 * @param {String} preid - The prerelease identifier
 * @param {String[]} moduleLocations - The locations of the modules to update
 */
async function incrementVersions(preid: string, moduleLocations: string[]): Promise<void> {
  const distTags = await getDistTagsForModuleLocations(moduleLocations);
  for (let i = 0; i < moduleLocations.length; i++) {
    try {
      const modulePath = moduleLocations[i];
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
        moduleLocations.forEach((otherModulePath) => {
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
      console.warn(`Couldn't set next version for ${moduleLocations[i]}`, e);
    }
  }
}

yargs(hideBin(process.argv))
  .command(
    '$0 [preid]',
    'Prepare packages for release with a new scope and incremented versions',
    (yargs) => {
      return yargs
        .positional('preid', {
          type: 'string',
          describe: 'Prerelease identifier',
          default: 'beta',
        })
        .option('scope', {
          alias: 's',
          type: 'string',
          description: 'Target scope for packages',
          default: '@bitgo-beta',
        })
        .option('root-dir', {
          alias: 'r',
          type: 'string',
          description: 'Root directory of the repository',
          default: process.env.BITGO_PREPARE_RELEASE_ROOT_DIR || path.join(__dirname, '..'),
        });
    },
    async (argv) => {
      const { preid, scope: targetScope, rootDir } = argv;

      console.log(`Preparing to re-target to ${targetScope}`);
      console.log(`Using root directory: ${rootDir}`);
      console.log(`Using prerelease identifier: ${preid}`);

      try {
        // Get lerna modules
        const { modules: lernaModules, locations: lernaModuleLocations } = await setLernaModules();

        // Replace package scopes
        const filesChanged = replacePackageScopes(rootDir, lernaModules, targetScope);

        // Replace BitGo package scope
        replaceBitGoPackageScope(rootDir, targetScope);

        // Increment versions
        await incrementVersions(preid, lernaModuleLocations);

        if (filesChanged) {
          console.log(`Successfully re-targeted ${filesChanged} files.`);
          process.exit(0);
        } else {
          console.error('No files were changed, something must have gone wrong.');
          process.exit(1);
        }
      } catch (error) {
        console.error('Error in prepare-release script:', error);
        process.exit(1);
      }
    }
  )
  .help()
  .alias('help', 'h')
  .parse();
