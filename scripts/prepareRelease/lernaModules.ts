import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type LernaModule = {
  name: string;
  location: string;
  version: string;
  private?: boolean;
};

export type PackageJson = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  buildDependencies?: Record<string, string>;
}

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

/**
 * Removes private modules with no dependent modules (ex. express, web-demo)
 * This should be used before any packageJson or lerna module mutations
 * @param lernaModules
 */
export async function removePrivateModulesWithNoDependents(lernaModules: LernaModule[]): Promise<void> {
  const pacakgeAllModulePackageJsons = lernaModules.map((m) => readModulePackageJson(m));
  const privateModules = lernaModules.filter((m) => m.private);
  const privateModulesToRemove: LernaModule[] = [];
  // For all private modules, find the ones where the module is not a dependency for any other module
  // For example, express and web-demo are private modules that have no dependents
  // sdk-test is a private module, but has dependents
  for (const m of privateModules) {
    const moduleHasNoDependents = pacakgeAllModulePackageJsons.every((packageJson) => {
      const moduleInDependencies = packageJson.dependencies && packageJson.dependencies[m.name];
      const moduleInDevDependencies = packageJson.devDependencies && packageJson.devDependencies[m.name];
      const moduleInPeerDependencies = packageJson.peerDependencies && packageJson.peerDependencies[m.name];
      const moduleInBuildDependencies = packageJson.buildDependencies && packageJson.buildDependencies[m.name];
      return (
        !moduleInBuildDependencies && !moduleInDependencies && !moduleInDevDependencies && !moduleInPeerDependencies
      );
    });
    if (moduleHasNoDependents) {
      privateModulesToRemove.push(m);
    }
  }
  for (const m of privateModulesToRemove) {
    console.log(`Removing private module ${m.name}`);
    await execa('rm', ['-rfd', m.location]);
  }
}
/**
 * Get all lerna modules in the monorepo
 */
export async function getLernaModules(): Promise<LernaModule[]> {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], {
    cwd: process.cwd(),
  });
  const lerna = getLernaRunner(lernaBinary);
  return JSON.parse(await lerna('list', ['--loglevel', 'silent', '--json', '--all']));
}

/**
 * Read package.json for a module
 * @param lernaModule The module to read package.json from
 * @returns The parsed package.json content
 */
export function readModulePackageJson(lernaModule: Pick<LernaModule, 'location'>): PackageJson {
  return JSON.parse(
    readFileSync(path.join(lernaModule.location, 'package.json'), {
      encoding: 'utf-8',
    })
  );
}

/**
 * Write package.json for a module
 * @param lernaModule The module to write package.json to
 * @param json The content to write
 */
export function writeModulePackageJson(lernaModule: LernaModule, json: any): void {
  writeFileSync(path.join(lernaModule.location, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}

/**
 * Updates the version for a package in a package.json object if it exists in any of the dependency fields.
 * @param packageJson
 * @param dependencyName
 * @param version
 */
export function setDependencyVersion(
  packageJson: PackageJson,
  dependencyName: string,
  version: string
): void {
  if (packageJson.dependencies && packageJson.dependencies[dependencyName]) {
    packageJson.dependencies[dependencyName] = version;
  }
  if (packageJson.devDependencies && packageJson.devDependencies[dependencyName]) {
    packageJson.devDependencies[dependencyName] = version;
  }
  if (packageJson.peerDependencies && packageJson.peerDependencies[dependencyName]) {
    packageJson.peerDependencies[dependencyName] = version;
  }
  if (packageJson.buildDependencies && packageJson.buildDependencies[dependencyName]) {
    packageJson.buildDependencies[dependencyName] = version;
  }
}
