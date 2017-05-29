var blake2b = require('./index.js')

var output = new Uint8Array(64)
var input = Buffer.from('hello world')

blake2b(output, input)

console.log(output)
