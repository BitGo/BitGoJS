<p align="center">
    <img alt="Babylon Logo" src="https://github.com/user-attachments/assets/dc74271e-90f1-44bd-9122-2b7438ab375c" width="100" />
    <h3 align="center">@babylonlabs-io/btc-staking-ts</h3>
    <p align="center">Babylon Bitcoin Staking Protocol</p>
    <p align="center"><strong>TypeScript</strong> library</p>
    <p align="center">
      <a href="https://www.npmjs.com/package/@babylonlabs-io/btc-staking-ts"><img src="https://badge.fury.io/js/btc-staking-ts.svg" alt="npm version" height="18"></a>
    </p>
</p>
<br/>

## 👨🏻‍💻 Installation

```console
npm i @babylonlabs-io/btc-staking-ts
```

## 📝 Commit Format & Automated Releases

This project uses [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/)
and [**semantic-release**](https://semantic-release.gitbook.io/) to automate
versioning, changelog generation, and npm publishing.
However, release branch will be cut wiht the syntax of `release/vY.X` whenever there is a major version bump.

### ✅ How It Works

1. All commits must follow the **Conventional Commits** format.
2. When changes are merged into the `main` branch:
   - `semantic-release` analyzes commit messages
   - Determines the appropriate semantic version bump (`major`, `minor`, `patch`)
   - Updates the `CHANGELOG.md`
   - Tags the release in Git
   - Publishes the new version to npm (if configured)

### 🧱 Commit Message Examples

```console
feat: add support for slashing script
fix: handle invalid staking tx gracefully
docs: update README with commit conventions
refactor!: remove deprecated method and cleanup types
```

> **Note:** For breaking changes, add a `!` after the type (
> e.g. `feat!:` or `refactor!:`) and include a description of the breaking
> change in the commit body.

### 🚀 Releasing

Just commit your changes using the proper format and merge to `main`.
The CI pipeline will handle versioning and releasing automatically — no manual
tagging or version bumps needed.

## 📢 Usage Guide

Details on the usage of the library can be found
on the [usage guide](./docs/usage.md).
