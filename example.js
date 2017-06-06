var blake2b = require('./index.js')

var output = new Uint8Array(64)
var input = Buffer.allocUnsafe(2048)

blake2b(output, input)

console.log(output)
