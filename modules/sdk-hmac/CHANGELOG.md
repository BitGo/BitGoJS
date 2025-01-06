# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 2.0.0 (2024-08-20)

### Features

- move opensslbytes to own package ([e23c562](https://github.com/BitGo/BitGoJS/commit/e23c5627957916055e68329541dd1eb775704ca5))

### BREAKING CHANGES

- clients using challenge
  generation & TSS Recovery functions must now
  install @bitgo/sdk-opensslbytes separately &
  provide the openSSLBytes WASM themselves.

Ticket: CE-4329
