//
// Tests for SJCL
// This library is heavily tested externally.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');
var sjcl = require('../../src/bitcoin/sjcl.min');

describe('SJCL', function() {
  it("encrypt/decrypt", function() {
    var password = 'xyzzy';
    var xprv = new Bitcoin.BIP32().initFromSeed('abcdef').extended_private_key_string();
    var encryptOptions = { iter: 10000, ks: 256 };
    var encryptedXprv = sjcl.encrypt(password, xprv, encryptOptions);
    assert.equal(typeof(encryptedXprv), 'string');
    assert.equal(sjcl.decrypt(password, encryptedXprv), xprv);
  });

  it("sha256 HMAC", function() {
    var tv = {
      key:  "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
      data: "4869205468657265",
      mac:  "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"
    };

    var data = sjcl.codec.hex.toBits(tv.data);
    var mac = new sjcl.misc.hmac(sjcl.codec.hex.toBits(tv.key));
    var out = sjcl.codec.hex.fromBits(mac.mac(data));
    assert.equal(out.substr(0, tv.mac.length), tv.mac);

    out = sjcl.codec.hex.fromBits(mac.mac(data));
    assert.equal(out.substr(0, tv.mac.length), tv.mac);
  });

  it("sha256", function() {
    var tv = ["pyMq5mdbgnqjfpzXaY2Txn6J",
              "da551383debbfa99e375df817777712a22ef5dad271513e4504b43fd85dc562d"];
    var out = sjcl.hash.sha256.hash(tv[0]);
    assert.equal(sjcl.codec.hex.fromBits(out), tv[1]);
  });
});


