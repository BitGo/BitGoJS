var blake2b = require('./index.js')

var output = new Uint8Array(32)
var input = Buffer.alloc(2048)

console.log('hash:', blake2b(output.length).update(input).digest('hex'))

blake2b.ready(function () {
  console.log('has wasm?', blake2b.WASM_LOADED)
  console.log('hash again:', blake2b(output.length).update(input).digest('hex'))
})
