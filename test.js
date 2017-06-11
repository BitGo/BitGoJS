var test = require('tape')
var blake2b = require('./')
var vectors = require('./test-vectors.json')

setup()
test('wait for ready', function (assert) {
  blake2b.ready(function () {
    assert.end()
  })
})
setup()

function setup () {
  test('vectors', function (assert) {
    vectors.forEach(function (v) {
      var out = new Uint8Array(v.outlen)
      var input = hexWrite(new Uint8Array(v.input.length / 2), v.input)
      var key = v.key.length === 0 ? null : hexWrite(new Uint8Array(v.key.length / 2), v.key)
      var salt = v.salt.length === 0 ? null : hexWrite(new Uint8Array(v.salt.length / 2), v.salt)
      var personal = v.personal.length === 0 ? null : hexWrite(new Uint8Array(v.personal.length / 2), v.personal)

      var expected = Buffer.from(hexWrite(new Uint8Array(v.out.length / 2), v.out))
      var actual = Buffer.from(blake2b(out.length, key, salt, personal, true).update(input).digest(out))

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
    var actual = blake2b(out.length, key, salt, personal).update(input).digest(out)

    assert.deepEquals(actual, expected)
    assert.end()
  })

  test('streaming', function (t) {
    var isntance = blake2b(blake2b.BYTES)
    var buf = new Buffer('Hej, Verden')

    for (var i = 0; i < 10; i++) isntance.update(buf)

    var out = Buffer.alloc(blake2b.BYTES)
    isntance.digest(out)

    t.same(out.toString('hex'), 'cbc20f347f5dfe37dc13231cbf7eaa4ec48e585ec055a96839b213f62bd8ce00', 'streaming hash')
    t.end()
  })

  test('streaming with key', function (t) {
    var key = Buffer.alloc(blake2b.KEYBYTES)
    key.fill('lo')

    var instance = blake2b(blake2b.BYTES, key)
    var buf = new Buffer('Hej, Verden')

    for (var i = 0; i < 10; i++) instance.update(buf)

    var out = Buffer.alloc(blake2b.BYTES)
    instance.digest(out)

    t.same(out.toString('hex'), '405f14acbeeb30396b8030f78e6a84bab0acf08cb1376aa200a500f669f675dc', 'streaming keyed hash')
    t.end()
  })

  test('streaming with hash length', function (t) {
    var isntance = blake2b(blake2b.BYTES_MIN)
    var buf = new Buffer('Hej, Verden')

    for (var i = 0; i < 10; i++) isntance.update(buf)

    var out = Buffer.alloc(blake2b.BYTES_MIN)
    isntance.digest(out)

    t.same(out.toString('hex'), 'decacdcc3c61948c79d9f8dee5b6aa99', 'streaming short hash')
    t.end()
  })

  test('streaming with key and hash length', function (t) {
    var key = Buffer.alloc(blake2b.KEYBYTES)
    key.fill('lo')

    var instance = blake2b(blake2b.BYTES_MIN, key)
    var buf = new Buffer('Hej, Verden')

    for (var i = 0; i < 10; i++) instance.update(buf)

    var out = Buffer.alloc(blake2b.BYTES_MIN)
    instance.digest(out)

    t.same(out.toString('hex'), 'fb43f0ab6872cbfd39ec4f8a1bc6fb37', 'streaming short keyed hash')
    t.end()
  })
}

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
