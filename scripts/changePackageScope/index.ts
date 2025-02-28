import * as execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';

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

export async function getLernaModules(): Promise<{
  lernaModules: string[];
  lernaModuleLocations: string[];
}> {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);
  const modules: Array<{ name: string; location: string }> = JSON.parse(
    await lerna('list', ['--loglevel', 'silent', '--json', '--all'])
  );
  const lernaModules = modules.map(({ name }) => name);
  const lernaModuleLocations = modules.map(({ location }) => location);
  return { lernaModules, lernaModuleLocations };
}

export function changeScopeInFile(filePath: string, lernaModules: string[], targetScope: string): number {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  let newContent = oldContent;
  lernaModules.forEach((moduleName) => {
    const newName = `${moduleName.replace('@bitgo/', `${targetScope}/`)}`;
    newContent = newContent.replace(new RegExp(moduleName, 'g'), newName);
  });
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    return 1;
  }
  return 0;
}
