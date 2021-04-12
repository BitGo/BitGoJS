# `blake2b`

[![Build Status](https://travis-ci.org/emilbayes/blake2b.svg?branch=master)](https://travis-ci.org/emilbayes/blake2b)

> Blake2b (64-bit version) in pure Javascript

This module is based on @dcposch
[implementation of BLAKE2b](https://github.com/dcposch/blakejs), with some changes:

* This module requires you to pass in a `out` buffer, saving an allocation
* This module allows you to set the `salt` and `personal` parameters
* This module exports constants for the parameters in libsodium style
* Uses a WASM version (where it is supported) for massive performance boosts

All credit goes to @dcposch for doing the hard work of porting the
implementation from C to Javascript.

## Usage

```js
var blake2b = require('blake2b')

var output = new Uint8Array(64)
var input = Buffer.from('hello world')

console.log('hash:', blake2b(output.length).update(input).digest('hex'))
```

## API

### `var hash = blake2b(outLength, [key], [salt], [personal], [noAssert = false])`

Create a new hash instance, optionally with `key`, `salt` and
`personal`. Bypass input assertions by setting `noAssert` to `true`.

All parameters must be `Uint8Array`, `Buffer` or another object with a compatible
API. All parameters must also fulfill the following constraints, or an
`AssertionError` will be thrown (unless `noAssert = true`):

* `outLength` must within the byte ranges defined by the constants below.
* `key` is optional, but must within the byte ranges defined by the constants
   below, if given. This value must be kept secret, and can be used to create
   prefix-MACs.
* `salt` is optional, but must be exactly `SALTBYTES`, if given. You can use
  this parameter as a kind of per user id, or local versioning scheme. This
  value is not required to be secret.
* `personal` is optional, but must be exactly `PERSONALBYTES`, if given. You can
  use this parameter as a kind of app id, or global versioning scheme. This
  value is not required to be secret.

### `var hash = hash.update(input)`

Update the hash with new `input`. Calling this method after `.digest` will throw
an error.

### `var out = hash.digest(out)`

Finalise the the hash and write the digest to `out`. `out` must be exactly equal
to `outLength` given in the `blake2b` method.

Optionally you can pass `hex` to get the hash as a hex string or no arguments
to have the hash return a new Uint8Array with the hash.

### Constants

* `blake2b.BYTES_MIN` Minimum length of `out`
* `blake2b.BYTES_MAX` Maximum length of `out`
* `blake2b.BYTES` Recommended default length of `out`
* `blake2b.KEYBYTES_MIN` Minimum length of `key`
* `blake2b.KEYBYTES_MAX` Maximum length of `key`
* `blake2b.KEYBYTES` Recommended default length of `key`
* `blake2b.SALTBYTES` Required length of `salt`
* `blake2b.PERSONALBYTES` Required length of `personal`

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

[ISC](LICENSE)
