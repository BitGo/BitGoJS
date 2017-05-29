# `blake2b`

> Blake2b (64-bit version) in pure Javascript

## Usage

```js
var blake2b = require('blake2b')

var output = new Uint8Array(64)
var input = Buffer.from('hello world')

blake2b(output, input)
```

## API

### `blake2b(out, input, [key], [salt], [personal])`

## Install

```sh
npm install blake2b
```

## Test vectors

This repository includes test vectors with
`{outlen, out, input, key, salt, personal}` objects for testing conformance
against the spec and other implementations:

* Lines [2 - 257](test-vectors.json#L2-L257) are tests for hashing with no key, taken from [BLAKE2 test vectors](https://github.com/BLAKE2/BLAKE2/blob/5cbb39c9ef8007f0b63723e3aea06cd0887e36ad/testvectors/blake2-kat.json)
* Lines [258 - 513](test-vectors.json#L258-L513) are tests for hashing with keys, taken from [BLAKE2 test vectors](https://github.com/BLAKE2/BLAKE2/blob/5cbb39c9ef8007f0b63723e3aea06cd0887e36ad/testvectors/blake2-kat.json)
* Lines [514- 577](test-vectors.json#L514-L577) are tests for hashing with key, salt and personalisation, derived from the [libsodium tests](https://github.com/jedisct1/libsodium/blob/3a9c4c38f7dbe671d91dcfa267c919734b4923df/test/default/generichash3.c)

## License

[ISC](LICENSE.md)
