# Change Log

All notable changes to this project will be documented in this file.

## 1.0.0

- Initial release. Vendored argon2 from hash-wasm v4.12.0 (MIT license).
- Provides argon2id, argon2i, argon2d, and argon2Verify functions.
- WASM binaries (~6.6KB argon2 + ~7.4KB blake2b) embedded as base64 in the JS bundle.
