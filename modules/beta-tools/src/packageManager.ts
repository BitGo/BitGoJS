import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export type PackageManagerType = 'npm' | 'yarn' | 'pnpm';

export interface PackageManager {
  type: PackageManagerType;
  installExact(packages: string[], dryRun?: boolean): void;
}

function npmManager(): PackageManager {
  return {
    type: 'npm',
    installExact(packages, dryRun) {
      const args = ['install', '--save-exact', ...packages];
      if (dryRun) {
        args.push('--dry-run');
      }
      console.log(`Executing: npm ${args.join(' ')}`);
      if (!dryRun) {
        execFileSync('npm', args, { stdio: 'inherit' });
      }
    },
  };
}

function yarnManager(): PackageManager {
  return {
    type: 'yarn',
    installExact(packages, dryRun) {
      const args = ['add', '--exact', ...packages];
      console.log(`Executing: yarn ${args.join(' ')}`);
      if (!dryRun) {
        execFileSync('yarn', args, { stdio: 'inherit' });
      }
    },
  };
}

function pnpmManager(): PackageManager {
  return {
    type: 'pnpm',
    installExact(packages, dryRun) {
      const args = ['add', '--save-exact', ...packages];
      console.log(`Executing: pnpm ${args.join(' ')}`);
      if (!dryRun) {
        execFileSync('pnpm', args, { stdio: 'inherit' });
      }
    },
  };
}

export function detectPackageManager(cwd: string = process.cwd()): PackageManagerType {
  if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(cwd, 'package-lock.json'))) return 'npm';
  throw new Error('Could not detect package manager: no pnpm-lock.yaml, yarn.lock, or package-lock.json found');
}

export function createPackageManager(type: PackageManagerType): PackageManager {
  switch (type) {
    case 'npm':
      return npmManager();
    case 'yarn':
      return yarnManager();
    case 'pnpm':
      return pnpmManager();
  }
}
