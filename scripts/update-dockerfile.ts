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
 * @param lernaPath {string} path to lerna binary
 * @returns {function(string, string[], Object.<string, string>): Promise<string>}
 */
function getLernaRunner(lernaPath) {
  return async (command, args = [], options = {}) => {
    const { stdout } = await execa(
      lernaPath,
      [command, ...args],
      options,
    );
    return stdout;
  };
}

const walkDependencies = (packageName: string, setDeps: Set<ManagedModule>, graph: Record<string, string[]>, managedModules: ManagedModule[]) => {
  const managedDeps = graph[packageName].filter((dep) => graph[dep]).map((name) => managedModules.find((mod) => mod.name === name));
  managedDeps.forEach((module) => {
    if (module && !module.private && !setDeps.has(module)) {
      setDeps.add(module);
      walkDependencies(module.name, setDeps, graph, managedModules);
    }
  });
};

/**
 * Get information on the modules in this repo that are managed by lerna.
 * @param lerna {function}
 * @returns {Promise<{path: *, name: *, deps: *, version: *}[]>}
 */
async function updateDockerFile(lerna) {
  const depGraph: Record<string, string[]> = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--graph', '--all']));
  const managedModules: ManagedModule[] = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--json', '--all']));


  const setDeps = new Set<ManagedModule>();
  walkDependencies('@bitgo/express', setDeps, depGraph, managedModules);
  let dockerContents = fs.readFileSync('Dockerfile', { encoding: 'utf-8' });
  let copyContent = ``;
  setDeps.forEach((module) => {
    const modPath = module.location.substring(module.location.indexOf('/modules/'));
    copyContent += `COPY --from=builder /tmp/bitgo${modPath} /var${modPath}/\n`;
    copyContent += `RUN cd /var${modPath} && yarn link\n`;
  });
  
  const linkers = Array.from(setDeps).map((dep) => `    yarn link ${dep.name}`).join(' && \\\n');
  const linkContent = `RUN cd /var/bitgo-express && \\\n${linkers}\n`;
  dockerContents = dockerContents
    .replace(/#COPY_START((.|\n)*)#COPY_END/, `#COPY_START\n${copyContent}#COPY_END`)
    .replace(/#LINK_START((.|\n)*)#LINK_END/, `#LINK_START\n${linkContent}#LINK_END`);
  

  fs.writeFileSync('Dockerfile', dockerContents);
}

const main = async () => {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);

  await updateDockerFile(lerna);
};

main();
