# Updating openssl.ts

1. Clone the following [repo](https://github.com/zahin-mohammad/openssl-wasm)
2. Use the `build.sh` script to generate the `openssl.wasm` and `openssl.js` file
3. Convert the `openssl.js` file to a valid `openssl.ts`
4. Add `openssl.ts` to this folder

Why do we do this? By importing a file, we guarantee its bundled with the SDK.
