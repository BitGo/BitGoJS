var HDNode = require('bitcoinjs-lib/src/hdnode');

module.exports = HDNode;

/**
 * Derive a new bip32 node object from a path, where a path takes the form of
 * m/4/3/2'/6, where a prime represents hardened. The "m" can also be ommitted,
 * so /4/3/2'/6 is also a valid path.
 */
HDNode.prototype.deriveFromPath = function(path) {
  if (path[0] === 'm') {
    path = path.slice(1, path.length);
  }
  if (path[0] !== '/') {
    throw new Error('invalid path');
  }
  path = path.slice(1, path.length);
  var split = path.split('/');

  var hdnode = this;
  for (var i = 0; i < split.length; i++) {
    var el = split[i];
    var hardened = false;

    if (el[el.length - 1] === "'") {
      hardened = true;
      el.length = el.length - 1; //remove the prime
    }

    var index = parseInt(el);

    if (isNaN(index)) {
      throw new Error('invalid path');
    }

    if (hardened) {
      hdnode = hdnode.deriveHardened(index);
    } else {
      hdnode = hdnode.derive(index);
    }
  }
  
  return hdnode;
};
