import { readFileSync, writeFileSync } from 'fs';

export function updateModuleNames(input: string, lernaModules: string[], targetScope: string): string {
  lernaModules.forEach((moduleName) => {
    const newName = `${moduleName.replace('@bitgo/', `${targetScope}/`)}`;
    input = input.replace(new RegExp(moduleName, 'g'), newName);
  });
  return input;
}

export function changeScopeInFile(filePath: string, lernaModules: string[], targetScope: string): number {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  const newContent = updateModuleNames(oldContent, lernaModules, targetScope);
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    return 1;
  }
  return 0;
}
