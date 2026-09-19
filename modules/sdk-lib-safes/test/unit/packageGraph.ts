import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN_PREFIXES = [
  '@bitgo/sdk-core',
  '@bitgo/sdk-api',
  '@bitgo/key-card',
  '@bitgo/account-lib',
  '@bitgo/bitgo',
  '@bitgo/sdk-coin-',
  '@bitgo/abstract-',
];

function packageRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

function collectTsFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTsFiles(full);
    }
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const re = /(?:\bfrom\b|\bimport\b|\brequire\b)\s*\(?\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

describe('package graph', function () {
  it('declares no forbidden dependency', function () {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot(), 'package.json'), 'utf8'));
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const name of Object.keys(pkg[field] ?? {})) {
        for (const prefix of FORBIDDEN_PREFIXES) {
          if (name.startsWith(prefix)) {
            throw new Error(`forbidden dependency ${name} in ${field}`);
          }
        }
      }
    }
  });

  it('imports no forbidden package in src', function () {
    for (const file of collectTsFiles(path.join(packageRoot(), 'src'))) {
      for (const specifier of importSpecifiers(fs.readFileSync(file, 'utf8'))) {
        for (const prefix of FORBIDDEN_PREFIXES) {
          if (specifier.startsWith(prefix)) {
            throw new Error(`${file} imports forbidden package ${specifier}`);
          }
        }
        if (specifier.startsWith('.') && specifier.split('/').some((s) => s === 'sdk-core' || s === 'key-card')) {
          throw new Error(`${file} imports forbidden relative path ${specifier}`);
        }
      }
    }
  });
});
