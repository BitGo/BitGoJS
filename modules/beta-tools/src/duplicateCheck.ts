import { readFile } from 'fs/promises';
import path from 'path';

export const DEFAULT_DUPLICATE_CHECK_PACKAGES = ['@bitgo-beta/utxo-lib', '@bitgo/wasm-utxo'];

export interface DuplicateEntry {
  version: string;
  path: string;
}

export interface DuplicateReport {
  hasDuplicates: boolean;
  details: Map<string, DuplicateEntry[]>;
}

/**
 * Check for duplicate package versions in package-lock.json (npm v2/v3 format).
 * Returns a report indicating whether any duplicates were found.
 */
export async function checkDuplicates(
  packagesToCheck: string[],
  cwd: string = process.cwd()
): Promise<DuplicateReport> {
  const lockfilePath = path.resolve(cwd, 'package-lock.json');
  const packageLock = JSON.parse(await readFile(lockfilePath, 'utf8'));

  let hasDuplicates = false;
  const details = new Map<string, DuplicateEntry[]>();

  for (const packageName of packagesToCheck) {
    const locations: DuplicateEntry[] = [];

    // npm v2/v3 lockfile format uses "packages" key
    if (packageLock.packages) {
      for (const [pkgPath, pkgInfo] of Object.entries(packageLock.packages)) {
        if (pkgPath.endsWith(`node_modules/${packageName}`)) {
          const version = (pkgInfo as { version?: string }).version;
          if (version) {
            locations.push({ path: pkgPath, version });
          }
        }
      }
    }

    details.set(packageName, locations);

    const versions = new Set(locations.map((l) => l.version));
    if (versions.size > 1) {
      hasDuplicates = true;
      console.error(`Duplicate versions found for ${packageName}:`);
      for (const loc of locations) {
        console.error(`  ${loc.version} at ${loc.path}`);
      }
    } else if (versions.size === 1) {
      console.log(`${packageName}: single version ${[...versions][0]}`);
    } else {
      console.log(`${packageName}: not found in package-lock.json`);
    }
  }

  return { hasDuplicates, details };
}
