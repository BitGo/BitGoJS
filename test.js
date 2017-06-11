var tape = require('tape')
var blake2b = require('./')
var vectors = require('blake2b/test-vectors.json')

blake2b.ready(function () {
  tape('hello world', function (t) {
    var hash = blake2b()
      .update(Buffer.from('hello'))
      .update(Buffer.from(' '))
      .update(Buffer.from('world'))
      .digest('hex')

    t.same(hash, '256c83b297114d201b30179f3f0ef0cace9783622da5974326b436178aeef610')
    t.end()
  })

  tape('hello world', function (t) {
    var hash = blake2b(64)
      .update(Buffer.from('hello'))
      .update(Buffer.from(' '))
      .update(Buffer.from('world'))
      .digest('hex')

    t.same(hash, '021ced8799296ceca557832ab941a50b4a11f83478cf141f51f933f653ab9fbcc05a037cddbed06e309bf334942c4e58cdf1a46e237911ccd7fcf9787cbc7fd0')
    t.end()
  })

  tape('both at the same time', function (t) {
    var a = blake2b()
    var b = blake2b(64)

    var hash = a
      .update(Buffer.from('hello'))
      .update(Buffer.from(' '))
      .update(Buffer.from('world'))
      .digest('hex')

    t.same(hash, '256c83b297114d201b30179f3f0ef0cace9783622da5974326b436178aeef610')

    var hash = b
      .update(Buffer.from('hello'))
      .update(Buffer.from(' '))
      .update(Buffer.from('world'))
      .digest('hex')

    t.same(hash, '021ced8799296ceca557832ab941a50b4a11f83478cf141f51f933f653ab9fbcc05a037cddbed06e309bf334942c4e58cdf1a46e237911ccd7fcf9787cbc7fd0')
    t.end()
  })

  vectors.forEach(function (vector, i) {
    tape('test-vectors.json #' + i, function (t) {
      var key = vector.key && Buffer.from(vector.key, 'hex')
      var salt = vector.salt && Buffer.from(vector.salt, 'hex')
      var personal = vector.personal && Buffer.from(vector.personal, 'hex')

      var hash = blake2b(vector.outlen, key, salt, personal, true)
        .update(Buffer.from(vector.input, 'hex'))
        .digest('hex')

      t.same(hash, vector.out)
      t.end()
    })
  })
})
