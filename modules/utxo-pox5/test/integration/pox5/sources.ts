import { lstat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { promisify } from 'node:util';

import type { Pox5LocalConfig } from './config';

const execFileAsync = promisify(execFile);

async function requireDirectory(name: string, value: string | undefined): Promise<string> {
  if (value === undefined) throw new Error(`Set ${name} to an absolute checkout path`);
  if (!isAbsolute(value)) throw new Error(`${name} must be an absolute path`);
  const stats = await lstat(value);
  if (!stats.isDirectory()) throw new Error(`${name} is not a directory: ${value}`);
  return value;
}

async function requireFile(name: string, value: string): Promise<void> {
  const stats = await lstat(value);
  if (!stats.isFile()) throw new Error(`${name} is not a file: ${value}`);
}

async function assertGitRevision(name: string, root: string, expected: string): Promise<void> {
  const result = await execFileAsync('git', ['-C', root, 'rev-parse', 'HEAD']);
  const actual = result.stdout.trim();
  if (actual !== expected) throw new Error(`${name} is at ${actual}; expected ${expected}`);
}

async function assertGitPatchHash(name: string, root: string, expected: string): Promise<void> {
  const result = await execFileAsync('git', ['-C', root, 'diff', '--binary']);
  const actual = createHash('sha256').update(result.stdout).digest('hex');
  if (actual !== expected) throw new Error(`${name} tracked patch is ${actual}; expected ${expected}`);
}

export async function validatePox5SourceRoots(config: Pox5LocalConfig): Promise<void> {
  const stacksJsRoot = await requireDirectory('STACKS_JS_ROOT', config.sources.stacksJsRoot);
  await assertGitRevision('STACKS_JS_ROOT', stacksJsRoot, config.stacksJs.commit);
  if (config.profile !== 'local') return;
  const stacksCoreRoot = await requireDirectory('STACKS_CORE_ROOT', config.sources.stacksCoreRoot);
  const stacksRegtestEnvRoot = await requireDirectory('STACKS_REGTEST_ENV_ROOT', config.sources.stacksRegtestEnvRoot);
  await assertGitRevision('STACKS_CORE_ROOT', stacksCoreRoot, config.stacksCore.commit);
  await assertGitPatchHash('STACKS_CORE_ROOT', stacksCoreRoot, config.stacksCore.patchSha256);
  await requireFile('stacks-regtest-env/docker-compose.yml', `${stacksRegtestEnvRoot}/docker-compose.yml`);
  await requireFile('stacks-core/pox-5.clar', `${stacksCoreRoot}/stackslib/src/chainstate/stacks/boot/pox-5.clar`);
}
