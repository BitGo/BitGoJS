import * as fs from 'fs/promises';

import { GithubSource } from '../VendorConfig';
import { applyPatchesFromDir } from '../git';

// we only want to vendor prod source code
// remove dev and test files
const removePaths = [
  '.eslintrc.json',
  '.github/',
  '.husky/',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc.json',
  'docs/',
  'tests/',
];

async function removeDevAndTestFiles(targetDir: string): Promise<void> {
  for (const path of removePaths) {
    console.log(`Removing dev/test file: ${path}`);
    const fullPath = `${targetDir}/${path}`;
    await fs.rm(fullPath, { recursive: true, force: true });
  }
}

export default async function hook(gitSource: GithubSource, targetDir: string): Promise<void> {
  if (!('tag' in gitSource)) {
    throw new Error('unsupported github source, expected tag');
  }
  if (gitSource.tag !== 'v1.0.3') {
    throw new Error(`unexpected tag ${gitSource.tag}, expected v1.0.3`);
  }

  await removeDevAndTestFiles(targetDir);
  await applyPatchesFromDir(gitSource, targetDir);
}
