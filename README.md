# blake2b-wasm

Blake2b implemented in WASM

```
npm install blake2b-wasm
```

Works in browsers that support WASM and Node.js 8+.

## Usage

``` js
var blake2b = require('blake2b-wasm')

if (!blake2b.SUPPORTED) {
  console.log('WebAssembly not supported by your runtime')
}

blake2b.ready(function (err) {
  if (err) throw err

  var hash = blake2b()
    .update(new Buffer('hello')) // pass in a buffer or uint8array
    .update(new Buffer(' '))
    .update(new Buffer('world'))
    .digest('hex')

  console.log('Blake2b hash of "hello world" is %s', hash)
})
```

## API

#### `var hash = blake2b()`

Create a new hash instance

#### `hash.update(data)`

Update the hash with a new piece of data. `data` should be a buffer or uint8array.

#### `var digest = hash.digest([enc])`

Digest the hash.

## Browser demo

There is a browser example included in [example.html](example.html) and [example.js](example.js).

## Contributing

The bulk of this module is implemented in WebAssembly in the [blake2b.wat](blake2b.wat) file.
The format of this file is S-Expressions that can be compiled to their binary WASM representation by doing

```
# also available as `npm run compile`
wast2wasm blake2b.wat -o blake2b.wasm
```

If you do not have `wast2wasm` installed follow the instructions here, https://github.com/WebAssembly/wabt

## License

MIT
