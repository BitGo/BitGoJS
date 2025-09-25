import { readFileSync, writeFileSync } from 'fs';

export function getNewModuleName(moduleName: string, targetScope: string): string {
  return moduleName.replace('@bitgo/', `${targetScope}/`);
}

export function updateModuleNames(input: string, moduleNames: string[], targetScope: string): string {
  moduleNames.forEach((moduleName) => {
    input = input.replace(new RegExp(moduleName, 'g'), getNewModuleName(moduleName, targetScope));
  });
  return input;
}

export function changeScopeInFile(filePath: string, moduleNames: string[], targetScope: string): number {
  const oldContent = readFileSync(filePath, { encoding: 'utf8' });
  const newContent = updateModuleNames(oldContent, moduleNames, targetScope);
  if (newContent !== oldContent) {
    writeFileSync(filePath, newContent, { encoding: 'utf-8' });
    return 1;
  }
  return 0;
}
