var test = require('tape')
var blake2b = require('.')
var vectors = require('./test-vectors.json')

test('vectors', function (assert) {
  vectors.forEach(function (v) {
    var out = new Uint8Array(v.outlen)
    var input = hexWrite(new Uint8Array(v.input.length / 2), v.input)
    var key = v.key.length === 0 ? null : hexWrite(new Uint8Array(v.key.length / 2), v.key)
    var salt = v.salt.length === 0 ? null : hexWrite(new Uint8Array(v.salt.length / 2), v.salt)
    var personal = v.personal.length === 0 ? null : hexWrite(new Uint8Array(v.personal.length / 2), v.personal)

    var expected = Buffer.from(hexWrite(new Uint8Array(v.out.length / 2), v.out))
    var actual = Buffer.from(blake2b(out, input, key, salt, personal, true))

    assert.deepEquals(actual, expected)
  })
  assert.end()
})

test('works with buffers', function (assert) {
  var vector = vectors.slice(-1)[0]

  var out = Buffer.allocUnsafe(vector.outlen)
  var input = Buffer.from(vector.input, 'hex')
  var key = Buffer.from(vector.key, 'hex')
  var salt = Buffer.from(vector.salt, 'hex')
  var personal = Buffer.from(vector.personal, 'hex')

  var expected = Buffer.from(vector.out, 'hex')
  var actual = blake2b(out, input, key, salt, personal)

  assert.deepEquals(actual, expected)
  assert.end()
})

function hexWrite (buf, string) {
  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  for (var i = 0; i < strLen / 2; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (Number.isNaN(parsed)) throw new Error('Invalid byte')
    buf[i] = parsed
  }
  return buf
}
