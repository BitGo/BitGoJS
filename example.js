var blake2b = require('./')

blake2b.ready(function () {
  var hash = blake2b()
    .update(new Buffer('hello'))
    .update(new Buffer(' '))
    .update(new Buffer('world'))
    .digest('hex')

  console.log('Blake2b hash of "hello world" is %s', hash)
})

