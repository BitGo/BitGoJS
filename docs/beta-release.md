# Beta Release Process (`@bitgo-beta/*`)

## Overview

BitGoJS publishes beta releases under the `@bitgo-beta` scope on npm. The `scripts/prepare-release.ts`
script transforms the entire monorepo — re-scoping all `@bitgo/*` packages to `@bitgo-beta/*`, computing
prerelease versions, and pinning all inter-module dependency versions. This enables publishing beta/alpha
releases without conflicting with stable releases.

## How `prepare-release.ts` Works

```
CLI: npx tsx scripts/prepare-release.ts [preid] --scope [scope] --root-dir [dir]
     Defaults: preid=beta, scope=@bitgo-beta, root-dir=<repo-root>
```

### Step 1: Scope Replacement

The script walks all `.ts`, `.tsx`, `.js`, `.json` files in `modules/` and `webpack/` (skipping
`node_modules/`), performing a global regex replacement of every `@bitgo/X` reference with
`@bitgo-beta/X`. This covers:

- `package.json` dependency entries
- TypeScript/JavaScript import statements
- Any other string references to `@bitgo/` scoped packages

**Special case**: The `modules/bitgo` package is the only one published without an `@bitgo/` prefix.
Its `package.json` name is explicitly set to `@bitgo-beta/bitgo`.

Implementation: `scripts/prepareRelease/changeScopeInFile.ts`

### Step 2: Version Computation

For each module, the script:

1. Fetches dist-tags from npm (`https://registry.npmjs.org/-/package/<name>/dist-tags`)
2. Determines the previous prerelease version:
   - If a beta tag exists and its base version >= latest, use the beta tag as base
   - If the beta tag's base version < latest, start a new prerelease from latest
   - If no beta tag exists, create one from latest
3. Computes the next version via `semver.inc(prevTag, 'prerelease', preid)`

Example: `8.2.1-beta.1009` → `8.2.1-beta.1010`

The dist-tag fetch can be cached via `BITGO_PREPARE_RELEASE_CACHE_DIST_TAGS` env var pointing to a
JSON file, avoiding repeated npm registry calls.

Implementation: `scripts/prepareRelease/distTags.ts`

### Step 3: Cross-Module Version Pinning

After each module's version is bumped, all other modules that depend on it have their dependency
version updated to the exact new version. This **removes semver ranges** (`^`, `~`), resulting in
pinned versions:

```
Before: "@bitgo/sdk-core": "^31.2.1"
After:  "@bitgo-beta/sdk-core": "8.2.1-beta.1010"
```

Implementation: `scripts/prepareRelease/changePackageJson.ts`

## Side Effects for Consumers

Because all dependency versions are pinned (no ranges), consumers of `@bitgo-beta/*` packages must
**explicitly bump** to new versions when they are published. The `@bitgo/beta-tools` package provides
a canonical CLI and library for this — see its README for usage.

Key behaviors to understand:

- Each `@bitgo-beta` package has its own **independent prerelease counter** (e.g.,
  `sdk-core@8.2.1-beta.788`, `statics@15.1.1-beta.791`). There is no shared suffix —
  what ties a release together is the CI publish run.
- The `beta` dist-tag on npm always points to the latest published prerelease for each package.
- Fetching dist-tags individually during a multi-package publish can yield inconsistent versions
  (a race condition): some packages may have the new version while others still show the old one.
  Use `--versions-file` with a CI-generated manifest to avoid this.

## Helper Modules (`scripts/prepareRelease/`)

| File | Purpose |
|------|---------|
| `changeScopeInFile.ts` | Regex replacement of `@bitgo/*` → target scope in file contents |
| `changePackageJson.ts` | Updates dependency versions in `package.json` objects |
| `distTags.ts` | Fetches/caches npm dist-tags for all modules |
| `getLernaModules.ts` | Runs `lerna list --json --all` to discover all modules |
| `walk.ts` | Recursively walks directories, filtering by file extension |
| `index.ts` | Barrel export |

## Known Limitations

- `setDependencyVersion` in `changePackageJson.ts` only updates `dependencies` and `devDependencies`.
  It does **not** update `peerDependencies` or `buildDependencies` (marked with a FIXME).
- Three packages are skipped during dist-tag fetch: `@bitgo-beta/express`, `@bitgo-beta/web-demo`,
  `@bitgo-beta/sdk-test` (not published to npm).

## Related Scripts

| Script | Purpose |
|--------|---------|
| `scripts/prepare-release.ts` | Main transformation script (this document) |
| `@bitgo/beta-tools` (`modules/beta-tools`) | Canonical tool for consumers to bump `@bitgo-beta/*` versions |
