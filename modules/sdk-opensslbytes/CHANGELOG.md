# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-opensslbytes@2.0.0...@bitgo/sdk-opensslbytes@2.1.0) (2025-10-09)


### Bug Fixes

* run check-fmt on code files only ([9745196](https://github.com/BitGo/BitGoJS/commit/9745196b02b9678c740d290a4638ceb153a8fd75))


### Features

* configure learn to skip git operations ([ee3a622](https://github.com/BitGo/BitGoJS/commit/ee3a6220496476aa7f4545b5f4a9a3bf97d9bdb9))





# 2.0.0 (2024-08-20)

### Features

- move opensslbytes to own package ([e23c562](https://github.com/BitGo/BitGoJS/commit/e23c5627957916055e68329541dd1eb775704ca5))

### BREAKING CHANGES

- clients using challenge
  generation & TSS Recovery functions must now
  install @bitgo/sdk-opensslbytes separately &
  provide the openSSLBytes WASM themselves.

Ticket: CE-4329
