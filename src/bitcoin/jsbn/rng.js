//
// Use SJCL for our random source
//

var Crypto = require('../crypto-js/index');
var sjcl = require('../sjcl.min');

//
// SecureRandom
// An object for generating random data. Although this is a class,
// each instance of the class uses the same underlying entropy.  So
// callers can allocate a new SecureRandom() class repeatedly without
// needing to re-seed the RNG.
//
function SecureRandom() {
  // Install new handler for Crypto.util.randomBytes, which is not a secure random generator.
  Crypto.util.randomBytes = function(n) {
    var bytes = new Array(n);
    new SecureRandom().nextBytes(bytes);
    return bytes;
  };
}

SecureRandom.prototype.clientSideRandomInit = function() {
  sjcl.random.startCollectors();  // do this only once
}

SecureRandom.prototype.nextBytes = function(arrayToFillRandomly) {
  var length = arrayToFillRandomly.length
  var randomArray = sjcl.random.randomWords(length);
  for (var index = 0; index < length; ++index) {
    if (randomArray[index] < 0) {
      randomArray[index] = -randomArray[index];
    }
    arrayToFillRandomly[index] = randomArray[index] % 256;
  }
}

module.exports = SecureRandom;
