#!/usr/bin/env node

import { readFile } from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { checkDuplicates, DEFAULT_DUPLICATE_CHECK_PACKAGES } from './duplicateCheck';
import { DEFAULT_UTXO_PATTERNS, filterDependencies } from './filterDependencies';
import { createPackageManager, detectPackageManager } from './packageManager';
import { resolveVersions } from './resolveVersions';

async function getBitgoBetaDeps(scope: string, cwd: string): Promise<string[]> {
  const packageJsonPath = path.resolve(cwd, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  return Object.keys(packageJson.dependencies || {}).filter((pkg) => pkg.startsWith(`${scope}/`));
}

yargs(hideBin(process.argv))
  .command({
    command: '$0',
    describe: 'Bump @bitgo-beta dependencies to their latest tagged versions',
    builder: (y) =>
      y
        .option('tag', {
          type: 'string',
          description: 'Dist tag to use (e.g., beta, latest)',
          default: 'beta',
        })
        .option('versions-file', {
          type: 'string',
          description:
            'Path to JSON manifest of package->version mappings. ' +
            'Avoids the race condition of fetching dist-tags during a publish.',
        })
        .option('scope', {
          type: 'string',
          description: 'Package scope to match',
          default: '@bitgo-beta',
        })
        .option('pm', {
          type: 'string',
          choices: ['npm', 'yarn', 'pnpm'] as const,
          description: 'Package manager (auto-detected from lockfile if not specified)',
        })
        .option('ignore', {
          type: 'array',
          string: true,
          description: 'Packages to skip',
          default: [] as string[],
        })
        .option('only-utxo', {
          type: 'boolean',
          description: 'Only bump UTXO packages',
          default: false,
        })
        .option('ignore-utxo', {
          type: 'boolean',
          description: 'Skip UTXO packages (default when --only-utxo not set)',
        })
        .option('utxo-patterns', {
          type: 'array',
          string: true,
          description: 'Override UTXO detection patterns',
          default: DEFAULT_UTXO_PATTERNS,
        })
        .option('check-duplicates', {
          type: 'boolean',
          description: 'Check lockfile for duplicate versions after install',
          default: true,
        })
        .option('check-duplicate-packages', {
          type: 'array',
          string: true,
          description: 'Packages to check for duplicates',
          default: DEFAULT_DUPLICATE_CHECK_PACKAGES,
        })
        .option('dry-run', {
          type: 'boolean',
          description: 'Show what would be installed without installing',
          default: false,
        })
        .check((argv) => {
          if (argv.onlyUtxo && argv.ignoreUtxo) {
            throw new Error('Cannot use both --only-utxo and --ignore-utxo');
          }
          return true;
        }),
    async handler(argv) {
      const cwd = process.cwd();

      const allDeps = await getBitgoBetaDeps(argv.scope, cwd);
      if (allDeps.length === 0) {
        console.log(`No ${argv.scope} dependencies found in package.json`);
        return;
      }

      const deps = filterDependencies(allDeps, {
        ignore: argv.ignore,
        onlyUtxo: argv.onlyUtxo,
        ignoreUtxo: argv.ignoreUtxo ?? !argv.onlyUtxo,
        utxoPatterns: argv.utxoPatterns,
      });

      if (deps.length === 0) {
        console.log('No matching dependencies after filtering');
        return;
      }

      console.log(`Resolving versions for ${deps.length} packages...`);

      const resolved = await resolveVersions({
        packages: deps,
        tag: argv.tag,
        scope: argv.scope,
        manifestPath: argv.versionsFile,
        githubToken: process.env.GITHUB_TOKEN,
      });

      if (resolved.versions.size === 0) {
        console.log('No versions resolved');
        return;
      }

      const installSpecs = [...resolved.versions.entries()].map(([pkg, version]) => `${pkg}@${version}`);

      const pmType = argv.pm ?? detectPackageManager(cwd);
      const pm = createPackageManager(pmType);

      pm.installExact(installSpecs, argv.dryRun);

      if (!argv.dryRun) {
        console.log(`Successfully updated ${installSpecs.length} packages`);
      }

      if (argv.checkDuplicates && pmType === 'npm' && !argv.dryRun) {
        const report = await checkDuplicates(argv.checkDuplicatePackages, cwd);
        if (report.hasDuplicates) {
          console.error('\nDuplicate package versions detected!');
          process.exit(1);
        }
        console.log('\nNo duplicate package versions found.');
      }
    },
  })
  .help()
  .parse();
