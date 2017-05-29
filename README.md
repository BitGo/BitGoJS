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

## License

[ISC](LICENSE.md)
