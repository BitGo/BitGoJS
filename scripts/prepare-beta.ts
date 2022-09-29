import * as execa from 'execa';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import * as path from 'path';

let lernaModules: string[] = [];
let TARGET_SCOPE = '@bitgo-beta';
let filesChanged = 0;

/**
 * Create a function which can run lerna commands
 * @param {String} lernaPath - path to lerna binary
 * @returns {function(string, string[], Object.<string, string>): Promise<string>}
 */
function getLernaRunner(lernaPath: string) {
  return async (command: string, args: string[] = [], options = {}) => {
    const { stdout } = await execa(
      lernaPath,
      [command, ...args],
      options,
    );
    return stdout;
  };
}

const getLernaModules = async (): Promise<void> => {
  const { stdout: lernaBinary } = await execa('yarn', ['bin', 'lerna'], { cwd: process.cwd() });

  const lerna = getLernaRunner(lernaBinary);
  const modules: Array<{name: string}> = JSON.parse(await lerna('list', ['--loglevel', 'silent', '--json', '--all']));
  lernaModules = modules.map(({ name }) => name);
};

const walk = (dir: string): string[] => {
  let results: string[] = [];
  const ignoredFolders = [/modules\/bitgo\/example/, /node_modules/];
  const list = readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) {
      if (!ignoredFolders.some((folder) => folder.test(file))) {
        results = [
          ...results,
          ...walk(file),
        ];
      }
    } else if (['.ts', '.tsx', '.js', '.json'].includes(path.extname(file))) {
      // Is a file
      results.push(file);
    }
  });
  return results;
};

const changeScopeInFile = (filePath:string): void => {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  let newContent = oldContent;
  lernaModules.forEach((moduleName) => {
    const newName = `${moduleName.replace('@bitgo/', `${TARGET_SCOPE}/`)}`;
    newContent = newContent.replace(new RegExp(moduleName, 'g'), newName);
  });
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    ++filesChanged;
  }
};

const replacePackageScopes = () => {
  // replace all @bitgo packages & source code with alternate SCOPE 
  const filePaths = [
    ...walk(path.join(__dirname, '../', 'modules')),
    ...walk(path.join(__dirname, '../', 'webpack')),
  ];
  filePaths.forEach((file) => changeScopeInFile(file));
};

// modules/bitgo is the only package we publish without an `@bitgo` prefix, so
// we must manually set one
const replaceBitGoPackageScope = () => {
  const cwd = path.join(__dirname, '../', 'modules', 'bitgo');
  const json = JSON.parse(readFileSync(path.join(cwd, 'package.json'), { encoding: 'utf-8' }));
  json.name = `${TARGET_SCOPE}/bitgo`;
  writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify(json, null, 2) + '\n'
  );
};

const getArgs = () => {
  const args = process.argv.slice(2) || [];
  const scopeArg = args.find((arg) => arg.startsWith('scope='));
  if (scopeArg) {
    const split = scopeArg.split('=');
    TARGET_SCOPE = split[1] || TARGET_SCOPE;
  }
  console.log(`Preparing to re-target to ${TARGET_SCOPE}`);
};

const main = async () => {
  getArgs();
  await getLernaModules();
  replacePackageScopes();
  replaceBitGoPackageScope();
  if (filesChanged) {
    console.log(`Successfully re-targeted ${filesChanged} files.`);
    process.exit(0);
  } else {
    console.error('No files were changed, something must have gone wrong.');
    process.exit(1);
  }
};

main();
