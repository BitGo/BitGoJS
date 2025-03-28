/**
 * This is a helper that creates a archive package with a new scope (similar to what `prepare-release.ts` does).
 *
 * The archive can be used with `npm install path/to/tgz` to test the package locally.
 */

import * as fs from 'fs';
import * as execa from 'execa';
import * as mpath from 'path';
import * as yargs from 'yargs';
import {
  walk,
  getLernaModules,
  changeScopeInFile,
  getDistTagsForModuleNames,
  updateModuleNames,
  setDependencyVersion,
  DistTags,
  LernaModule,
  getNewModuleName,
} from './prepareRelease';

/** The directory to pack the module into */
const scopedPackageDir = 'pack-scoped';

async function changeModuleScope(dir: string, params: { lernaModules: LernaModule[]; scope: string }) {
  console.log(`Changing scope of module at ${dir} to ${params.scope}`);
  walk(dir).forEach((file) => {
    changeScopeInFile(
      file,
      params.lernaModules.map((m) => m.name),
      params.scope
    );
  });
}

async function changeModuleVersions(
  dir: string,
  params: {
    moduleNames: string[];
    scope: string;
    distTagsByModuleName?: Map<string, DistTags>;
  }
) {
  const newModuleNames = params.moduleNames.map((m) => updateModuleNames(m, params.moduleNames, params.scope));
  const { distTagsByModuleName = await getDistTagsForModuleNames(newModuleNames) } = params;
  const packageJsonPath = mpath.join(dir, 'package.json');
  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
  newModuleNames.forEach((m) => {
    if (!distTagsByModuleName.has(m)) {
      console.warn(`No dist tags found for ${m}`);
      return;
    }
    const newVersion = distTagsByModuleName.get(m)?.beta;
    if (newVersion) {
      setDependencyVersion(packageJson, m, newVersion);
    }
  });
  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

async function getDistTagsFromPackageJson(
  newModuleNames: string[],
  packageJsonPath: string
): Promise<Map<string, DistTags>> {
  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
  return new Map<string, DistTags>(
    newModuleNames.map((m) => {
      const distTags = packageJson.dependencies[m];
      if (distTags) {
        return [m, { beta: distTags }];
      }
      return [m, { beta: '0.0.0' }];
    })
  );
}

async function getDistTagsForModuleNamesCached(
  dir: string,
  newModuleNames: string[],
  params: {
    scope: string;
    sourceFile?: string;
    cache?: string;
  }
): Promise<Map<string, DistTags>> {
  if (params.sourceFile) {
    if (params.sourceFile.endsWith('package.json')) {
      return getDistTagsFromPackageJson(newModuleNames, params.sourceFile);
    }
  }

  if (params.cache) {
    try {
      console.log(`Loading cached dist tags from ${params.cache}`);
      return new Map<string, DistTags>(JSON.parse(await fs.promises.readFile(params.cache, 'utf-8')));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`No cached dist tags found at ${params.cache}`);
        // ignore
      } else {
        throw e;
      }
    }
  }

  const distTagsByModuleName = await getDistTagsForModuleNames(newModuleNames);
  if (params.cache) {
    console.log(`Caching dist tags to ${params.cache}`);
    await fs.promises.writeFile(params.cache, JSON.stringify([...distTagsByModuleName.entries()], null, 2) + '\n');
  }
  return distTagsByModuleName;
}

/** Change the scope of a module and update its dependencies */
async function runChangeScope(
  dir: string,
  params: {
    lernaModules?: LernaModule[];
    scope: string;
    distTagsFrom?: string;
    cacheDistTags?: string;
  }
) {
  const { lernaModules = await getLernaModules() } = params;
  const moduleNames = lernaModules.map((m) => m.name);
  const newModuleNames = moduleNames.map((m) => updateModuleNames(m, moduleNames, params.scope));
  await changeModuleScope(dir, { ...params, lernaModules });
  await changeModuleVersions(dir, {
    ...params,
    moduleNames,
    distTagsByModuleName: await getDistTagsForModuleNamesCached(dir, newModuleNames, {
      scope: params.scope,
      sourceFile: params.distTagsFrom,
      cache: params.cacheDistTags,
    }),
  });
}

function getModuleByDir(lernaModules: LernaModule[], dir: string): LernaModule {
  for (const m of lernaModules) {
    if (mpath.relative(m.location, dir) === '') {
      return m;
    }
  }

  throw new Error(`Could not find module name for directory ${dir}`);
}

function getArchiveName(m: LernaModule) {
  // normalize package name: @bitgo-beta/express -> bitgo-beta-express
  const packageName = m.name.replace(/^@/, '').replace(/\//g, '-');
  return `${packageName}-v${m.version}.tgz`;
}

/** Pack the module and extract it to a directory */
async function packExtract(moduleDir: string, archiveName: string, packDir: string): Promise<void> {
  // Create the directory if it doesn't exist
  const packDirPath = mpath.join(moduleDir, packDir);
  try {
    await fs.promises.rm(mpath.join(packDirPath, 'package'), { recursive: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw e;
    }
  }
  await fs.promises.mkdir(packDirPath, { recursive: true });

  await execa('yarn', ['build'], { cwd: moduleDir });

  try {
    // Pack the module using yarn to temp file
    await execa('yarn', ['pack'], {
      cwd: moduleDir,
    });

    // Extract the archive
    await execa('tar', ['xzf', archiveName, '-C', packDir], {
      cwd: moduleDir,
    });

    console.log(`Packed and extracted module to ${packDir}`);
  } finally {
    // Clean up temp file
    await fs.promises.unlink(mpath.join(moduleDir, archiveName)).catch((e) => {
      console.error(`Failed to clean up file: ${e}`);
    });
  }
}

/** Pack the extracted package into a new archive */
async function packArchive(moduleDir: string, archiveName: string, packDir: string): Promise<void> {
  await execa('tar', ['czf', archiveName, '-C', packDir, 'package'], {
    cwd: moduleDir,
  });
}

const optScope = {
  describe: 'The new scope to set',
  type: 'string',
  default: '@bitgo-beta',
} as const;

yargs
  .command({
    command: 'pack-scoped <dir>',
    describe: [
      'Pack a module with a specific scope. ',
      `Creates a package archive with the scope set to the specified value. `,
    ].join(''),
    builder(yargs) {
      return yargs
        .positional('dir', {
          describe: 'Module directory',
          type: 'string',
          demandOption: true,
        })
        .options({
          scope: optScope,
          distTagsFrom: {
            describe: 'Path to a file to read dist tags from',
            type: 'string',
          },
        });
    },
    async handler({ dir, scope, distTagsFrom }) {
      const lernaModules = await getLernaModules();
      const module = getModuleByDir(lernaModules, dir);
      const archiveName = getArchiveName(module);
      await packExtract(dir, archiveName, scopedPackageDir);
      await runChangeScope(mpath.join(dir, scopedPackageDir, 'package'), {
        scope,
        lernaModules,
        distTagsFrom,
        cacheDistTags: mpath.join(dir, scopedPackageDir, '.distTags.cache.json'),
      });
      await packArchive(dir, archiveName, scopedPackageDir);
      console.log(`Packed ${getNewModuleName(module.name, scope)} to ${mpath.join(dir, archiveName)}.`);
      console.log(`Use 'npm install ${mpath.join(dir, archiveName)} --no-save' to test the package.`);
    },
  })
  .command({
    // Low-level command to the scope of a module for a directory without packing it. Useful for testing
    command: 'change-scope <dir>',
    describe: false,
    builder(yargs) {
      return yargs
        .positional('dir', {
          describe: 'Module directory',
          type: 'string',
          demandOption: true,
        })
        .option({
          scope: optScope,
        });
    },
    async handler({ dir, scope }) {
      await runChangeScope(dir, { scope });
    },
  })
  .help()
  .strict().argv;
