/**
 * Usage:
 * # to prepare a stable release on the stable channel
 * npx tsx ./scripts/prepare-release.ts latest --scope @bitgo
 *
 * # to prepare a beta release in the beta organization
 * npx tsx ./scripts/prepare-release.ts beta --scope @bitgo-beta
 *
 * # to skip uninitialized modules, set the UNINITIALIZED_MODULES env var
 * # if modules are not initialized and are not skipped, they will fail
 * UNINITIALIZED_MODULES=@bitgo/sdk-coin-flrp npx tsx ./scripts/prepare-release.ts latest --scope @bitgo
 */

import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getLernaModules, validateReleaseTransformations } from './prepareRelease';
import { replacePackageScopes } from './prepareRelease/mutateScope';
import { incrementVersions } from './prepareRelease/incrementVersions';

export const uninitializedModules = process.env.UNINITIALIZED_MODULES
  ? process.env.UNINITIALIZED_MODULES.split(',')
  : [];

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
        await replacePackageScopes(rootDir, lernaModules, targetScope);
        // Increment versions
        await incrementVersions(preid, lernaModules, uninitializedModules);
        await validateReleaseTransformations(lernaModules, preid, targetScope);

        console.log(`Successfully re-targeted module scopes and versions.`);
        process.exit(0);
      } catch (error) {
        console.error('Error in prepare-release script:', error);
        process.exit(1);
      }
    }
  )
  .help()
  .alias('help', 'h')
  .parse();
