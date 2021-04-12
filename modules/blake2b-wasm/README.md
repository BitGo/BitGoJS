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
    .update(Buffer.from('hello')) // pass in a buffer or uint8array
    .update(Buffer.from(' '))
    .update(Buffer.from('world'))
    .digest('hex')

  console.log('Blake2b hash of "hello world" is %s', hash)
})
```

## API

#### `var hash = blake2b([digestLength], [key], [salt], [personal])`

Create a new hash instance. `digestLength` defaults to `32`.

#### `hash.update(data)`

Update the hash with a new piece of data. `data` should be a buffer or uint8array.

#### `var digest = hash.digest([enc])`

Digest the hash.

#### `var promise = blake2b.ready([cb])`

Wait for the WASM code to load. Returns the WebAssembly instance promise as well for convenience.
You have to call this at least once before instantiating the hash.

## Browser demo

There is a browser example included in [example.html](example.html) and [example.js](example.js).

## Contributing

The bulk of this module is implemented in WebAssembly in the [blake2b.wat](blake2b.wat) file.
The format of this file is S-Expressions that can be compiled to their binary WASM representation by doing

```
wat2wasm blake2b.wat -o blake2b.wasm
```

To build the thin Javascript wrapper for the WASM module use `wat2js`:

```
# also available as `npm run compile`
wat2js blake2b.wat -o blake2b.js
```

If you do not have `wat2wasm` installed follow the instructions here, https://github.com/WebAssembly/wabt

## License

MIT
