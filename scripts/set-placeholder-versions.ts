#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';

const PLACEHOLDER_VERSION = '0.0.0-semantic-release-managed';
const MODULES_DIR = path.join(__dirname, '..', 'modules');

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function getInternalPackageNames(): Set<string> {
  const packageNames = new Set<string>();
  const moduleDirs = fs.readdirSync(MODULES_DIR);

  for (const dir of moduleDirs) {
    const packageJsonPath = path.join(MODULES_DIR, dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
      packageNames.add(packageJson.name);
    }
  }

  return packageNames;
}

function updateDependencies(
  deps: Record<string, string> | undefined,
  internalPackages: Set<string>
): Record<string, string> | undefined {
  if (!deps) return undefined;

  const updated: Record<string, string> = {};
  for (const [name, version] of Object.entries(deps)) {
    if (internalPackages.has(name)) {
      updated[name] = PLACEHOLDER_VERSION;
    } else {
      updated[name] = version;
    }
  }
  return updated;
}

function processPackageJson(packageJsonPath: string, internalPackages: Set<string>): void {
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content) as PackageJson;

  packageJson.version = PLACEHOLDER_VERSION;

  packageJson.dependencies = updateDependencies(packageJson.dependencies, internalPackages);
  packageJson.devDependencies = updateDependencies(packageJson.devDependencies, internalPackages);
  packageJson.optionalDependencies = updateDependencies(packageJson.optionalDependencies, internalPackages);
  packageJson.peerDependencies = updateDependencies(packageJson.peerDependencies, internalPackages);

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function main(): void {
  const internalPackages = getInternalPackageNames();
  console.log(`Found ${internalPackages.size} internal packages`);

  const moduleDirs = fs.readdirSync(MODULES_DIR);
  let processedCount = 0;

  for (const dir of moduleDirs) {
    const packageJsonPath = path.join(MODULES_DIR, dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      processPackageJson(packageJsonPath, internalPackages);
      console.log(`Processed: ${dir}`);
      processedCount++;
    }
  }

  console.log(`\nDone! Processed ${processedCount} packages.`);
  console.log(`All versions set to: ${PLACEHOLDER_VERSION}`);
}

main();
