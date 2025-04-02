import * as assert from 'node:assert';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { inc, lt } from 'semver';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import {
  walk,
  getDistTagsForModules,
  getLernaModules,
  changeScopeInFile,
  setDependencyVersion,
  DistTags,
  LernaModule,
} from './prepareRelease';

function replacePackageScopes(rootDir: string, lernaModules: LernaModule[], targetScope: string): number {
  let filesChanged = 0;
  // replace all @bitgo packages & source code with alternate SCOPE
  const filePaths = [...walk(path.join(rootDir, 'modules')), ...walk(path.join(rootDir, 'webpack'))];
  const moduleNames = lernaModules.map(({ name }) => name);

  filePaths.forEach((file) => {
    filesChanged += changeScopeInFile(file, moduleNames, targetScope);
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
 * Read package.json for a module
 * @param module The module to read package.json from
 * @returns The parsed package.json content
 */
function readModulePackageJson(module: LernaModule): any {
  return JSON.parse(readFileSync(path.join(module.location, 'package.json'), { encoding: 'utf-8' }));
}

/**
 * Write package.json for a module
 * @param module The module to write package.json to
 * @param json The content to write
 */
function writeModulePackageJson(module: LernaModule, json: any): void {
  writeFileSync(path.join(module.location, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}

/**
 * Increment the version for a single module based on the preid.
 *
 * @param {String} preid - The prerelease identifier
 * @param {LernaModule} module - The module to update
 * @param {DistTags|undefined} tags - The dist tags for the module
 * @param {LernaModule[]} allModules - All modules for dependency updates
 * @returns {String|undefined} - The new version if set, undefined otherwise
 */
function incrementVersionsForModuleLocation(
  preid: string,
  module: LernaModule,
  tags: DistTags | undefined,
  allModules: LernaModule[]
): string | undefined {
  const json = readModulePackageJson(module);

  let prevTag: string | undefined = undefined;

  if (tags) {
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
    writeModulePackageJson(module, json);

    // since we're manually setting new versions, we must also reconcile all other lerna packages to use the 'next' version for this module
    allModules.forEach((otherModule) => {
      // skip it for the current version
      if (otherModule.location === module.location) {
        return;
      }

      // Use readModulePackageJson here instead of direct readFileSync
      const otherJson = readModulePackageJson(otherModule);

      // Check if this module depends on the one we're updating
      const otherJsonString = JSON.stringify(otherJson);
      if (otherJsonString.includes(json.name)) {
        setDependencyVersion(otherJson, json.name, next);
        writeModulePackageJson(otherModule, otherJson);
      }
    });

    return next;
  }
  return undefined;
}

/**
 * increment the version based on the preid.
 *
 * @param {String} preid - The prerelease identifier
 * @param {LernaModule[]} lernaModules - The modules to update
 */
async function incrementVersions(preid: string, lernaModules: LernaModule[]): Promise<void> {
  const distTags = await getDistTagsForModules(lernaModules);

  for (const m of lernaModules) {
    try {
      incrementVersionsForModuleLocation(preid, m, distTags.get(m), lernaModules);
    } catch (e) {
      // it's not necessarily a blocking error. Let lerna try and publish anyways
      console.warn(`Couldn't set next version for ${m.name} at ${m.location}`, e);
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
          type: 'string',
          description: 'Target scope for packages',
          default: '@bitgo-beta',
        })
        .option('root-dir', {
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
        // Get lerna modules directly
        const lernaModules = await getLernaModules();

        // Replace package scopes
        const filesChanged = replacePackageScopes(rootDir, lernaModules, targetScope);

        // Replace BitGo package scope
        replaceBitGoPackageScope(rootDir, targetScope);

        // Increment versions
        await incrementVersions(preid, lernaModules);

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
