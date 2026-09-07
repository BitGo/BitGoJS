import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import type { Pox5LocalConfig } from './config';

const execFileAsync = promisify(execFile);

export async function runCompose(config: Pox5LocalConfig, args: readonly string[]): Promise<void> {
  const child = spawn(
    'docker',
    [
      'compose',
      '--project-name',
      config.composeProject,
      ...config.composeFiles.flatMap((file) => ['--file', file]),
      ...args,
    ],
    { cwd: process.cwd(), stdio: 'inherit' }
  );
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`docker compose exited with ${signal === null ? `code ${code}` : `signal ${signal}`}`));
    });
  });
}

export async function validateDockerTooling(config: Pox5LocalConfig): Promise<void> {
  await execFileAsync('docker', ['version', '--format', '{{.Server.Version}}']);
  await execFileAsync('docker', ['compose', 'version']);
  await execFileAsync('docker', ['buildx', 'version']);
  await execFileAsync(
    'docker',
    [
      'compose',
      '--project-name',
      config.composeProject,
      ...config.composeFiles.flatMap((file) => ['--file', file]),
      'config',
      '--quiet',
    ],
    { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
  );
}

export async function startCompose(config: Pox5LocalConfig): Promise<void> {
  if (config.profile !== 'local') {
    await runCompose(config, ['up', '--detach', config.bitcoin.composeService]);
    return;
  }
  await runCompose(config, ['pull', 'stacks-api']);
  await runCompose(config, [
    'build',
    'snapshot-init',
    'stacks-node',
    'stacks-signer-1',
    'stacks-signer-2',
    'stacks-signer-3',
  ]);
  await runCompose(config, ['--profile', 'snapshot-init', 'run', '--rm', 'snapshot-init']);
  await runCompose(config, ['up', '--detach']);
}

export async function stopCompose(config: Pox5LocalConfig, removeVolumes: boolean): Promise<void> {
  if (config.profile !== 'local') {
    await runCompose(config, ['rm', '--stop', '--force', '--volumes', config.bitcoin.composeService]);
    return;
  }
  await runCompose(config, ['down', '--remove-orphans', ...(removeVolumes ? ['--volumes'] : [])]);
}
