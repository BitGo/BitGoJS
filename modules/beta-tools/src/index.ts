export { getDistTags, getAllDistTags, getPackageVersion } from './registry';
export type { DistTags } from './registry';

export { parseVersionsFromLogs } from './github';

export { filterDependencies, isUtxoPackage, DEFAULT_UTXO_PATTERNS } from './filterDependencies';
export type { FilterOptions } from './filterDependencies';

export { resolveVersions } from './resolveVersions';
export type { ResolveOptions, ResolvedVersions } from './resolveVersions';

export { detectPackageManager, createPackageManager } from './packageManager';
export type { PackageManagerType, PackageManager } from './packageManager';

export { checkDuplicates, DEFAULT_DUPLICATE_CHECK_PACKAGES } from './duplicateCheck';
export type { DuplicateReport, DuplicateEntry } from './duplicateCheck';
