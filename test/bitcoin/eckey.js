//
// Tests for Bitcoin ECKey
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');

describe('ECKey', function() {
  it("Prod network", function() {
    Bitcoin.setNetwork('prod');
    var addrString = '18J3WnE5t3xn6xYeugHwXC4MBbPB9irWem';
    var privKeyString = '5J7MRWpRSPFSDvC4A6pnp58F1nJGri9cQuAtwr6f393958RqKD6';

    var eckey = new Bitcoin.ECKey();
    assert.ok(eckey, "create");

    eckey = new Bitcoin.ECKey(privKeyString);
    assert.ok(eckey, "decode from private key string");
    assert.equal(eckey.getBitcoinAddress().toString(), addrString, "getBitcoinAddress");
  });

  it("Test network", function() {
    Bitcoin.setNetwork('testnet');
    var addrString = 'mjcwLf1Kt7m3k941Qb2m5m2JXRwuE5op1F';
    var privKeyString = '93ETBJspobVrHcX5jedm3G7mhpvwyqGk4CjkorjMhUGDVm2bYqw';

    var eckey = new Bitcoin.ECKey();
    assert.ok(eckey, "create");

    eckey = new Bitcoin.ECKey(privKeyString);
    assert.ok(eckey, "decode from private key string");
    assert.equal(eckey.getBitcoinAddress().toString(), addrString, "getBitcoinAddress");
  });

  it("Chaining", function() {
    var eckey = new Bitcoin.ECKey();
    assert.ok(eckey, "created");
    var priv = eckey.priv;

    var random = new Bitcoin.SecureRandom();

    var chainCode = new Array(32);
    random.nextBytes(chainCode);

    var newkey = Bitcoin.ECKey.createECKeyFromChain(priv.toByteArrayUnsigned(), chainCode);
    assert.ok(newkey, "created chain from private key");
    assert.notDeepEqual(newkey.getPub(), eckey.getPub(), 'chained public key is not equal to original public key');

    var hash = new Array(32);
    random.nextBytes(hash);

    // Verify the generated keys are different and can't sign for each other.
    var signature1 = eckey.sign(hash);
    var signature2 = newkey.sign(hash);
    assert.equal(true, eckey.verify(hash, signature1), 'key1 can verify a its own sig');
    assert.notEqual(true, eckey.verify(hash, signature2), 'key1 cannot verify key2\'s sig');
    assert.equal(true, newkey.verify(hash, signature2), 'key2 can verify its own sig');
    assert.notEqual(true, newkey.verify(hash, signature1), 'key2 cannot verify key1\'s sig');

    // Now, can we derive the same public key by chaining just the public key
    var pubkeyChain = Bitcoin.ECKey.createPubKeyFromChain(eckey.getPub(), chainCode);
    assert.ok(pubkeyChain, 'created chain from pubkey');
    assert.deepEqual(pubkeyChain, newkey.getPub(), 'chained public key derived from parent\'s public key matches that dervived from parent\'s private key');
    assert.notDeepEqual(pubkeyChain, eckey.getPub(), 'chained public key derived from parent\'s public key does not match parent');
  });
});


