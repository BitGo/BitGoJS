import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type LernaModule = {
  name: string;
  location: string;
  version: string;
  private?: boolean;
};

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
export function readModulePackageJson(lernaModule: Pick<LernaModule, 'location'>): any {
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
  packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    buildDependencies?: Record<string, string>;
  },
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
