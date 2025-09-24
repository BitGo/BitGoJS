import { LernaModule } from './lernaModules';
import { walk } from './walk';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Update all package references from the original scopes to the new scope
 * @example updates @bitgo/sdk-coin-eth to @bitgo-beta/sdk-coin-eth
 * @param rootDir
 * @param lernaModules
 * @param targetScope
 */
export async function replacePackageScopes(
  rootDir: string,
  lernaModules: LernaModule[],
  targetScope: string
): Promise<void> {
  if (targetScope === '@bitgo') {
    // stable release should not change the scope
    console.log('No scope change needed for modules/* for stable release');
    return;
  }
  // replace all @bitgo packages & source code with alternate SCOPE
  const filePaths = [...walk(path.join(rootDir, 'modules')), ...walk(path.join(rootDir, 'webpack'))];
  // Note: the bitgo umbrella package is only imported by private modules that do not get published
  // We ignore its replacement to simplify the regex and avoid potential issues
  const moduleNames = lernaModules.map(({ name }) => name).filter((name) => name !== 'bitgo');

  filePaths.forEach((file) => {
    changeScopeInFile(file, moduleNames, targetScope);
  });

  const bitgoWorkingDir = path.join(rootDir, 'modules', 'bitgo');
  const bitgoModuleJson = JSON.parse(readFileSync(path.join(bitgoWorkingDir, 'package.json'), { encoding: 'utf-8' }));
  bitgoModuleJson.name = `${targetScope}/bitgo`;
  writeFileSync(path.join(bitgoWorkingDir, 'package.json'), JSON.stringify(bitgoModuleJson, null, 2) + '\n');
  return;
}

/**
 * Given the existing module name and the target scope, return the new module name
 * Note: ignores the bitgo umbrella package
 * @param moduleName
 * @param targetScope
 */
export function getNewModuleName(moduleName: string, targetScope: string): string {
  if (moduleName === 'bitgo') {
    // We handle the 'bitgo' umbrella package separately
    return moduleName;
  }
  return moduleName.replace('@bitgo/', `${targetScope}/`);
}

/**
 * Given an input string, replace all occurrences of the module names with the new scoped names
 * @param input - file content (all module file content)
 * @param moduleNames - list of original module names
 * @param targetScope - target scope to change original modual name with
 */
export function updateModuleNames(input: string, moduleNames: string[], targetScope: string): string {
  moduleNames.forEach((moduleName) => {
    input = input.replace(new RegExp(moduleName, 'g'), getNewModuleName(moduleName, targetScope));
  });
  return input;
}

/**
 * Given a file path, read the file content, replace all occurrences of the module names with the new scoped names
 * @param filePath
 * @param moduleNames
 * @param targetScope
 */
export function changeScopeInFile(filePath: string, moduleNames: string[], targetScope: string): number {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  const newContent = updateModuleNames(oldContent, moduleNames, targetScope);
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    return 1;
  }
  return 0;
}
