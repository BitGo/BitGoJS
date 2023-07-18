#!/usr/bin/env node

// Check versions of in-repo packages to make sure they match with the package.json version.
// This is to prevent inadvertent updates of dependency versions for packages which are symlinked
// by lerna. The dependency versions of these packages should only ever be updated in the release branch.

const execa = require('execa');
const path = require('path');

/**
 * Create a function which can run lerna commands
 * @param lernaPath {string} path to lerna binary
 * @returns {function(string, string[], Object.<string, string>): Promise<string>}
 */
function getLernaRunner(lernaPath) {
  return async (command, args = [], options = {}) => {
    const { stdout } = await execa(lernaPath, [command, ...args], options);
    return stdout;
  };
}

/**
 * Get information on the modules in this repo that are managed by lerna.
 * @param lerna {function}
 * @returns {Promise<{path: *, name: *, deps: *, version: *}[]>}
 */
async function getLernaManagedModules(lerna) {
  const depGraph = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--graph', '--all']));
  const managedModules = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--json', '--all']));
  const managedModuleNames = managedModules.map(({ name }) => name);
  return Object.entries(depGraph).map(([name, deps]) => {
    const mod = managedModules.find((mod) => mod.name === name);
    return {
      name,
      deps: deps.filter((d) => managedModuleNames.includes(d)),
      path: mod.location,
      version: mod.version,
    };
  });
}

/**
 * Build a dictionary from package name to the expected version of that package.
 * @param modules
 * @returns {Object.<string, string>}
 */
function getExpectedVersions(modules) {
  return Object.values(modules).reduce((acc, mod) => {
    return Object.assign(acc, { [mod.name]: mod.version });
  }, {});
}

/**
 * For the module at `modPath`, get the version of the dependency `depName`.
 * If the version is prefixed with a carat or tilde, it will be stripped.
 * @param modPath {string}
 * @param depName {string}
 * @returns {string | undefined}
 */
function getDependencyVersion(modPath, depName) {
  const packageJsonPath = path.join(modPath, 'package.json');
  const {
    dependencies = {},
    devDependencies = {},
    optionalDependencies = {},
    peerDependencies = {},
  } = require(packageJsonPath);

  const deps = { ...dependencies, ...devDependencies, ...optionalDependencies, ...peerDependencies };
  if (deps[depName]) {
    const matches = deps[depName].match(/^([^~])?(.*)$/);
    return matches[matches.length - 1];
  }
}

async function main() {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);

  const modules = await getLernaManagedModules(lerna);
  const expectedVersions = getExpectedVersions(modules);

  let exitCode = 0;

  for (const mod of modules) {
    for (const dep of mod.deps) {
      const depVersion = getDependencyVersion(mod.path, dep);
      if (depVersion && depVersion !== expectedVersions[dep]) {
        console.log(
          `error: expected lerna-managed module ${mod.name} to depend on package ${dep} using version ${expectedVersions[dep]}, but found version ${depVersion} instead`
        );
        exitCode = 1;
      }
    }
  }

  return exitCode;
}

main()
  .then(process.exit)
  .catch((e) => console.error(e));
