# Upstream tracking

| Field | Value |
| --- | --- |
| Upstream package | `@realfi-co/realfi-partner-sdk` |
| Upstream version | `2.14.0` (`latest` / `preview` dist-tag) |
| Upstream commit | `1a8d3c0605f383e1180f8405075c08e14689ac47` |
| Built at | `2026-08-19T13:16:56.044Z` (from `dist/build-info.json`) |
| BitGo package | `@bitgo/realfi-partner-sdk` (`private: true` until first npm create + publish) |
| Ticket | [SI-1292](https://linear.app/bitgo/issue/SI-1292) |

CI notes:
- `engines.node` is `>=20` to match BitGoJS (upstream / `@cardano-sdk/core` want `>=22`; WP runtime is 22).
- Root `.yarnrc` sets `ignore-engines true` so Node 20 CI can install Cardano transitive deps.
- `private: true` skips `verify-npm-packages` until the package is created on npm; unset before first publish.
- `package.json` dependencies are trimmed to packages actually imported in `src/`/`dist/` (upstream lists extras for tests/emulator).

## Related dist-tags (at pin time)

| Tag | Version |
| --- | --- |
| latest / preview | 2.14.0 |
| mainnet | 2.13.0 |
| preprod | 2.12.3 |

## Why a fork

BitGo does not install third-party packages from GitHub Packages into Wallet Platform CI.
This module vendors a pinned RealFi SDK snapshot under `@bitgo/*` (Babylon-style) for npm beta / WP consumption.

## Rebase checklist

1. `npm view @realfi-co/realfi-partner-sdk dist-tags --registry=https://npm.pkg.github.com`
2. `npm pack @realfi-co/realfi-partner-sdk@<ver> --registry=https://npm.pkg.github.com`
3. Replace `src/` + `dist/` + upstream `CHANGELOG.md`; refresh this file + `package.json` version/deps.
4. Smoke: construct SDK for preprod, read vault rate, build a stake order tx.
5. PR → merge → publish `@bitgo-beta` → bump WP.

## Build note

This snapshot ships **prebuilt** `dist/` from upstream (Babel dual CJS/ESM). Full upstream
build tooling is not in the published tarball; porting a BitGo-native build is follow-up if
we need to patch source frequently.
