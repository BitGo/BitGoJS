import * as path from 'path';
import { readdirSync, statSync } from 'fs';

export const walk = (dir: string): string[] => {
  let results: string[] = [];
  const ignoredFolders = [/node_modules/];
  const list = readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) {
      if (!ignoredFolders.some((folder) => folder.test(file))) {
        results = [...results, ...walk(file)];
      }
    } else if (['.ts', '.tsx', '.js', '.json'].includes(path.extname(file))) {
      // Is a file
      results.push(file);
    }
  });
  return results;
};
