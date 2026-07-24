# @bitgo/beta-tools

CLI and library for bumping `@bitgo-beta/*` dependency versions in consumer projects.

## Problem

BitGoJS publishes beta packages under the `@bitgo-beta` scope with pinned (non-range) inter-module
dependency versions. Consumer repos must explicitly bump these versions. This tool replaces the
divergent bespoke scripts that existed in individual consumer repos.

## How version resolution works

Strategies are tried in order — the first available one wins:

1. **Manifest file (`--versions-file`):** Reads an explicit JSON map of package→version. Most
   deterministic — useful for CI pipelines that generate a manifest during publish.

2. **GitHub Actions API** (when `GITHUB_TOKEN` is set): Fetches the logs of the latest successful
   "Publish @bitgo-beta" workflow run and parses the verify-release output. This gives the complete
   version set (~106 packages) from a single CI run — race-free, no gaps.

3. **npm registry (default fallback):** Fetches `@bitgo-beta/bitgo` at the requested dist-tag. Its
   `dependencies` field contains pinned versions for ~92 packages from the same CI publish run.
   Packages not covered by the megapackage (typically 5-6 per consumer) fall back to individual
   dist-tag lookups — these are racy during active publishes.

## CLI usage

```bash
# Via npx
npx @bitgo-beta/beta-tools --tag beta

# Or install as devDependency
npm install -D @bitgo-beta/beta-tools
bump-bitgo-beta --tag beta
```

### Options

| Option | Default | Description |
|---|---|---|
| `--tag <tag>` | `beta` | Dist tag to resolve |
| `--versions-file <path>` | — | JSON manifest of package→version mappings |
| `--scope <scope>` | `@bitgo-beta` | Package scope to match in `package.json` |
| `--pm <npm\|yarn\|pnpm>` | auto-detected | Package manager to use |
| `--ignore <pkg...>` | `[]` | Packages to skip |
| `--only-utxo` | `false` | Only bump UTXO-related packages |
| `--ignore-utxo` | `true` (when `--only-utxo` not set) | Skip UTXO-related packages |
| `--utxo-patterns <patterns...>` | `utxo, unspents, abstract-lightning, babylonlabs-io-btc-staking-ts, sdk-coin-btc, sdk-coin-bch, sdk-coin-bsv, sdk-coin-btg, sdk-coin-dash, sdk-coin-doge, sdk-coin-ltc, sdk-coin-zec` | Patterns for UTXO package detection |
| `--check-duplicates` | `true` | Check lockfile for duplicate versions after install (npm only) |
| `--check-duplicate-packages <pkg...>` | `@bitgo-beta/utxo-lib, @bitgo/wasm-utxo` | Packages to check for duplicates |
| `--dry-run` | `false` | Show what would be installed without installing |

### Examples

```bash
# Bump all non-UTXO beta deps (default behavior)
bump-bitgo-beta

# Bump only UTXO packages
bump-bitgo-beta --only-utxo

# Bump everything, skip duplicate check
bump-bitgo-beta --ignore-utxo=false --check-duplicates=false

# Use a CI-generated manifest
bump-bitgo-beta --versions-file ./beta-versions.json

# Preview without installing
bump-bitgo-beta --dry-run
```

## Library API

```typescript
import {
  resolveVersions,
  filterDependencies,
  detectPackageManager,
  createPackageManager,
  checkDuplicates,
} from '@bitgo-beta/beta-tools';

const resolved = await resolveVersions({
  packages: ['@bitgo-beta/sdk-core', '@bitgo-beta/statics'],
  tag: 'beta',
  scope: '@bitgo-beta',
});

for (const [pkg, version] of resolved.versions) {
  console.log(`${pkg}@${version}`);
}
```

## Development

```bash
yarn build
yarn lint
yarn unit-test
```
