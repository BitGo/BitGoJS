import * as execa from 'execa';
import * as fs from 'fs';

type ManagedModule = {
  name: string;
  location: string;
  version: string;
  private: boolean;
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

const walkDependencies = (
  packageName: string,
  setDeps: Set<ManagedModule>,
  graph: Record<string, string[]>,
  managedModules: ManagedModule[]
) => {
  const managedDeps = graph[packageName]
    .filter((dep) => graph[dep])
    .map((name) => managedModules.find((mod) => mod.name === name));
  managedDeps.forEach((module) => {
    if (module && !module.private && !setDeps.has(module)) {
      setDeps.add(module);
      walkDependencies(module.name, setDeps, graph, managedModules);
    }
  });
};

/**
 * Get information on the modules in this repo that are managed by lerna.
 * @param {Function} lerna
 * @returns {Promise<{path: *, name: *, deps: *, version: *}[]>}
 */
async function updateDockerFile(lerna) {
  const depGraph: Record<string, string[]> = JSON.parse(
    await lerna('list', ['--loglevel', 'silent', '--graph', '--all'])
  );
  const managedModules: ManagedModule[] = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--json', '--all']));

  const setDeps = new Set<ManagedModule>();
  walkDependencies('@bitgo/express', setDeps, depGraph, managedModules);
  let dockerContents = fs.readFileSync('Dockerfile', { encoding: 'utf-8' });
  let copyContent = ``;
  setDeps.forEach((module) => {
    const modPath = module.location.substring(module.location.indexOf('/modules/'));
    copyContent += `COPY --from=builder /tmp/bitgo${modPath} /var${modPath}/\n`;
  });

  copyContent += '\nRUN ';

  const setDepsLinkers = Array.from(setDeps)
    .map((module) => {
      const modPath = module.location.substring(module.location.indexOf('/modules/'));
      return `cd /var${modPath} && yarn link`;
    })
    .join(' && \\\n');
  copyContent += setDepsLinkers + '\n';

  const linkers = Array.from(setDeps)
    .map((dep) => `    yarn link ${dep.name}`)
    .join(' && \\\n');
  const linkContent = `RUN cd /var/bitgo-express && \\\n${linkers}\n`;

  // add metadata about the build to docker labels
  let labelContent = `LABEL created="${new Date().toUTCString()}"\n`; // add created timestamp;
  labelContent += `LABEL version=${require('../modules/express/package.json').version}\n`; // set current image version from express
  labelContent += `LABEL git_hash=${require('child_process').execSync(`git rev-parse HEAD`).toString().trim()}\n`; // set to latest git HEAD hash

  dockerContents = dockerContents
    .replace(/#COPY_START((.|\n)*)#COPY_END/, `#COPY_START\n${copyContent}#COPY_END`)
    .replace(/#LINK_START((.|\n)*)#LINK_END/, `#LINK_START\n${linkContent}#LINK_END`)
    .replace(/#LABEL_START((.|\n)*)#LABEL_END/, `#LABEL_START\n${labelContent}#LABEL_END`);

  fs.writeFileSync('Dockerfile', dockerContents);
}

const main = async () => {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);

  await updateDockerFile(lerna);
};

main();
