/**
 * Upgrade Workspace Dependency Script
 *
 * This script automates upgrading a dependency across all workspace packages in the monorepo.
 * It discovers all packages that use the specified dependency via lerna, updates their package.json
 * files, and runs a single yarn install to minimize yarn.lock changes.
 *
 * Usage:
 *   yarn upgrade-dep -p @bitgo/wasm-utxo -v 1.3.0
 *   yarn upgrade-dep -p @bitgo/wasm-utxo              # Upgrades to latest version
 *   yarn upgrade-dep -p @bitgo/wasm-utxo -v 1.3.0 -d  # Dry run mode
 */
import execa from 'execa';
import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import { getLernaModules } from './prepareRelease/getLernaModules';

interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface PackageWithDep {
  packagePath: string;
  packageName: string;
  currentVersion: string;
  depType: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
}

async function findPackagesWithDependency(depName: string): Promise<PackageWithDep[]> {
  const modules = await getLernaModules();
  const packagesWithDep: PackageWithDep[] = [];

  for (const module of modules) {
    const packageJsonPath = path.join(module.location, 'package.json');
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson: PackageJson = JSON.parse(content);

      for (const depType of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const) {
        const deps = packageJson[depType];
        if (deps && deps[depName]) {
          packagesWithDep.push({
            packagePath: packageJsonPath,
            packageName: packageJson.name,
            currentVersion: deps[depName],
            depType,
          });
          break; // Only record once per package
        }
      }
    } catch (e) {
      // Skip if package.json doesn't exist or can't be read
      continue;
    }
  }

  return packagesWithDep;
}

async function getLatestVersion(packageName: string, versionPrefix?: string): Promise<string> {
  console.log(`Fetching latest version for ${packageName}...`);
  const { stdout } = await execa('npm', ['view', packageName, 'version']);
  const version = stdout.trim();
  if (versionPrefix) {
    return version.startsWith(versionPrefix) ? version : `${versionPrefix}${version}`;
  }
  return version;
}

async function updatePackageJson(
  packagePath: string,
  depName: string,
  newVersion: string,
  depType: string
): Promise<void> {
  const content = await fs.readFile(packagePath, 'utf-8');
  const packageJson: PackageJson = JSON.parse(content);

  if (packageJson[depType as keyof PackageJson]) {
    const deps = packageJson[depType as keyof PackageJson] as Record<string, string>;
    deps[depName] = newVersion;
  }

  await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
}

async function runYarnInstall(): Promise<void> {
  console.log('\nRunning yarn install to update lock file...');
  await execa('yarn', ['install'], {
    stdio: 'inherit',
  });
}

async function cmdUpgrade(opts: {
  package: string;
  version?: string;
  versionPrefix?: string;
  dryRun: boolean;
}): Promise<void> {
  const { package: depName, version: targetVersion, dryRun } = opts;

  console.log(`\n🔍 Searching for packages with dependency: ${depName}\n`);

  const packagesWithDep = await findPackagesWithDependency(depName);

  if (packagesWithDep.length === 0) {
    console.log(`❌ No packages found with dependency: ${depName}`);
    return;
  }

  console.log(`Found ${packagesWithDep.length} package(s) with ${depName}:\n`);
  for (const pkg of packagesWithDep) {
    console.log(`  • ${pkg.packageName} (${pkg.currentVersion})`);
  }

  let newVersion: string;
  if (targetVersion) {
    newVersion = targetVersion;
    console.log(`\n📦 Target version: ${newVersion}`);
  } else {
    newVersion = await getLatestVersion(depName, opts.versionPrefix ?? '');
    console.log(`\n📦 Latest version: ${newVersion}`);
  }

  if (dryRun) {
    console.log('\n🔍 Dry run - no changes will be made\n');
    console.log('Would update:');
    for (const pkg of packagesWithDep) {
      console.log(`  ${pkg.packageName}: ${pkg.currentVersion} → ${newVersion}`);
    }
    console.log('\nThen run: yarn install');
    return;
  }

  console.log('\n✏️  Updating package.json files...\n');
  for (const pkg of packagesWithDep) {
    console.log(`  Updating ${pkg.packageName}...`);
    await updatePackageJson(pkg.packagePath, depName, newVersion, pkg.depType);
  }

  console.log('\n✅ Updated all package.json files');

  await runYarnInstall();

  console.log('\n✅ Done!');
}

yargs
  .command({
    command: 'upgrade',
    describe: 'Upgrade a dependency across all workspace packages',
    builder(a) {
      return a.options({
        package: {
          type: 'string',
          demand: true,
          describe: 'Name of the package to upgrade, e.g. @bitgo/wasm-utxo',
          alias: 'p',
        },
        version: {
          type: 'string',
          describe: 'Target version (defaults to latest from npm registry)',
          alias: 'v',
        },
        versionPrefix: {
          type: 'string',
          describe: 'Version prefix to use when getting latest version',
          default: '^',
        },
        dryRun: {
          type: 'boolean',
          default: false,
          describe: 'Show what would be updated without making changes',
          alias: 'd',
        },
      });
    },
    async handler(a) {
      await cmdUpgrade(a);
    },
  })
  .help()
  .strict()
  .demandCommand().argv;
