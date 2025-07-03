import * as fs from 'fs/promises';
import { execa } from 'execa';

import { GithubSource } from './VendorConfig';

export async function getCommitsFromRange(from: string, to: string): Promise<string[]> {
  try {
    const { stdout } = await execa('git', ['log', '--pretty=format:%H', `${from}..${to}`]);
    return stdout.split('\n').filter((commit) => commit.trim() !== '');
  } catch (error) {
    throw new Error(`Failed to get commits from range ${from} to ${to}: ${error}`);
  }
}

export async function getCommitsFromSpec(spec: string): Promise<string[]> {
  if (spec.includes('..')) {
    const [from, to, ...rest] = spec.split('..');
    if (rest.length > 0) {
      throw new Error(`Invalid commit range specifier: ${spec}`);
    }
    return getCommitsFromRange(from, to);
  }
  return [spec];
}

export function getPatchDir(cfg: { repo: string }): string {
  return `${__dirname}/${cfg.repo}/patches`;
}

export async function createPatchForCommit(cfg: GithubSource, commit: string, targetDir: string): Promise<void> {
  const patchDir = getPatchDir(cfg);
  console.log(`Creating patch for commit ${commit} in ${cfg.repo} at ${patchDir}`);
  await execa('git', ['format-patch', '-1', commit, '--output-directory', getPatchDir(cfg)], {
    cwd: targetDir,
    stdio: 'inherit',
  });
}

export async function applyPatch(cfg: GithubSource, patchFile: string, targetDir: string): Promise<void> {
  console.log(`Applying patch ${patchFile} to ${cfg.repo}`);
  await execa('git', ['apply', patchFile], {
    cwd: targetDir,
    stdio: 'inherit',
  });
}

export async function applyPatchesFromDir(cfg: GithubSource, targetDir: string): Promise<void> {
  const patchDir = getPatchDir(cfg);
  console.log(`Applying patches from ${patchDir} to ${cfg.repo}`);
  const patchFiles = await fs.readdir(patchDir);
  for (const patchFile of patchFiles) {
    if (patchFile.endsWith('.patch')) {
      await applyPatch(cfg, `${patchDir}/${patchFile}`, targetDir);
    }
  }
}
