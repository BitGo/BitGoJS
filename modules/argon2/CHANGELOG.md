# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.1.0 (2026-04-22)


### Bug Fixes

* **argon2:** add KAT vectors, provenance tracking, and type safety ([a4ea04f](https://github.com/BitGo/BitGoJS/commit/a4ea04f082f95ec970240ed5b4f827ee2572567c))


### Features

* **argon2:** vendor hash-wasm v4.12.0 as @bitgo/argon2 ([671b89c](https://github.com/BitGo/BitGoJS/commit/671b89ccf238d161038523d45c9b6578bf4e50b1))
* **sdk-api:** add decryptAsync with v1/v2 auto-detection ([eb01c19](https://github.com/BitGo/BitGoJS/commit/eb01c198373ff2bb112de91be5a9d75cb0409156))





# Change Log

All notable changes to this project will be documented in this file.

## 1.0.0

- Initial release. Vendored argon2 from hash-wasm v4.12.0 (MIT license).
- Provides argon2id, argon2i, argon2d, and argon2Verify functions.
- WASM binaries (~6.6KB argon2 + ~7.4KB blake2b) embedded as base64 in the JS bundle.
