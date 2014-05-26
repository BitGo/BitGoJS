//
// Tests for Bitcoin Base58
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');
var fixtures = require('./fixtures/bip32.json')

describe('BIP32', function() {
  it('constructor', function() {
    // Obviously bad.
    assert.throws(function() { new Bitcoin.BIP32('hello'); });

    // Too short
    assert.throws(function() { new Bitcoin.BIP32('xpub661MyMwAqRbcEYvujm4N44pyEHb6J9KoCZsCdmsaMgE1H4m6iwHy9iMAwNrHo3goUrv3mcxUi7ckjfoWBRFSQyms7h5JskU'); });

    // This one has a bad checksum
    assert.throws(function() { new Bitcoin.BIP32('xpub661MyMwAqRbcEYvujm4N44pyEHb6J9KoCZsCdmsaMgE1H4mj1sqG7GcyMSg6iwHy9iMAwNrHo3goUrv3mcxUi7ckjfoWBRFSQyms7h5JskV'); });

    // ok
    var bip32pub = new Bitcoin.BIP32('xpub661MyMwAqRbcF4SSkduDjZhbieYnby5KU31RFBSRg7JTfjdPmkoJ1r8uQQh3h34Hj6V5z62F5wbW6wiLZG5Wy6hVHNLoiaiS8zUvF98fYLy');
    var bip32prv = new Bitcoin.BIP32('xprv9s21ZrQH143K2aMyecNDNRksAciJCWMU6p5pSo2p7mmUnwJFEDV3U3pRZ85kgZEV1FQ4ENe8V4adnKbEmxxKfeHw2RaCt6EGM9YsroJtMRT');
    assert.equal(bip32prv.extended_public_key_string(), bip32pub.extended_public_key_string());
  });

  it('get public key', function() {
    var bip32 = new Bitcoin.BIP32();
    assert.throws(function() { bip32.extended_public_key_string(); });

    bip32.initFromSeed('aabbccdd');

    var pubkey = bip32.extended_public_key_string();
    assert.equal(pubkey.indexOf('xpub'), 0);

    var hexkey = bip32.extended_public_key_string('hex');
    assert.equal(hexkey.indexOf('0488b21e'), 0);  // The version of a pub key as per the specification

    assert.throws(function() { bip32.extended_public_key_string('ascii') });
  });

  it('get private key', function() {
    var bip32 = new Bitcoin.BIP32();
    assert.throws(function() { bip32.extended_private_key_string(); });

    bip32.initFromSeed('aabbccdd');

    var prvkey = bip32.extended_private_key_string();
    assert.equal(prvkey.indexOf('xprv'), 0);

    var hexkey = bip32.extended_private_key_string('hex');
    assert.equal(hexkey.indexOf('0488ade4'), 0);  // The version of a prv key as per the specification

    assert.throws(function() { bip32.extended_private_key_string('ascii') });
  });

  it('no private key from public key', function() {
    var bip32 = new Bitcoin.BIP32('xpub661MyMwAqRbcF4SSkduDjZhbieYnby5KU31RFBSRg7JTfjdPmkoJ1r8uQQh3h34Hj6V5z62F5wbW6wiLZG5Wy6hVHNLoiaiS8zUvF98fYLy');
    assert.throws(function() { bip32.extended_private_key_string(); });
  });

  it('seed creation', function() {
    fixtures.testKeychains.tests.forEach(function(f) {
      var keyChain = new Bitcoin.BIP32().initFromSeed(f.master);
      assert.equal(keyChain.extended_public_key_string(), f.vectors[0].xpub, 'seed for ' + f.id);
    });
  });

  it("has stable seeds", function () {
    // If our seeds ever change, our existing users will be in trouble!

    var keychain = fixtures.testKeychains.tests[0];   // arbitrarily chose keychain 0
    var vector = keychain.vectors[3];  // arbitrarily chose vector 3

    var masterKey = new Bitcoin.BIP32().initFromSeed(keychain.master);
    var derivedKey = masterKey.derive(vector.chain);

    assert.equal( derivedKey.eckey.getHexFormat(), 'CBCE0D719ECF7431D88E6A89FA1483E02E35092AF60C042B1DF2FF59FA424DCA', "private key is stable" );
    assert.equal( derivedKey.eckey.getPubKeyHex(), '0357BFE1E341D01C69FE5654309956CBEA516822FBA8A601743A012A7896EE8DC2', "public key is stable" );
  });

  it("key derivation", function () {
    fixtures.testKeychains.tests.forEach(function(f) {
      var masterKey = new Bitcoin.BIP32(f.vectors[0].xprv);
      for(var index = 0; index < f.vectors.length ; ++index) {
        var vector = f.vectors[index];

        var derivedKey = masterKey.derive(vector.chain);
        var xprv = derivedKey.extended_private_key_string("base58");
        var xpub = derivedKey.extended_public_key_string("base58");

        assert.equal(xprv, vector.xprv, f.id + ": depth " + index + ": xprv " + vector.chain);
        assert.equal(xpub, vector.xpub, f.id + ": depth " + index + ": xpub " + vector.chain);
      }
    });
  });

  it("pubkey derivation from hardened keys fails", function () {
    fixtures.testKeychains.tests.forEach(function(f) {
      var pubkey = new Bitcoin.BIP32(f.vectors[0].xpub);

      for(var index = 0; index < f.vectors.length ; ++index) {
        var vector = f.vectors[index];

        if (vector.chain.indexOf("'") > 0) {   // Cannot do private key derivation without private key
          // Prime vectors must throw an exception
          assert.throws(function() { pubkey.derive(vector.chain); });
        } else {
          var derivedKey = pubkey.derive(vector.chain);
          var xpub = derivedKey.extended_public_key_string("base58");
          assert.equal(xpub, vector.xpub, f.id + " :" + index + ": xpub " + vector.chain );
        }
      }
    });
  });

  it("child and parent xprv derivations are equal", function () {
    // Verify that we can derive both from the root and also from the child equivalently.

    var seed = '128912892389238923782389237812';
    var accountPath = 'm/50';

    var newRoot = new Bitcoin.BIP32().initFromSeed(seed);
    var newAcct = newRoot.derive(accountPath);
    newAcct = new Bitcoin.BIP32(newAcct.extended_private_key_string());

    for (var index = 0; index < 5; index++) {
      var rootDerivedAccount = newRoot.derive(accountPath + '/' + index);
      var childAcct = newAcct.derive_child(index);
      assert.equal(rootDerivedAccount.extended_private_key_string(), childAcct.extended_private_key_string(), "child " + index + " derivation ok");
      assert.equal(rootDerivedAccount.extended_public_key_string(), childAcct.extended_public_key_string(), "child " + index + " derivation ok");
    }
  });

  it("child and parent xpub derivations are equal", function () {
    // Verify that we can derive both from the root and also from the child equivalently.

    var seed = '128912892389238923782389237812';
    var accountPath = 'm/50\'';

    var newRoot = new Bitcoin.BIP32().initFromSeed(seed);
    var newAcct = newRoot.derive(accountPath);
    newAcct = new Bitcoin.BIP32(newAcct.extended_public_key_string());  // Use the public key here

    for (var index = 0; index < 5; index++) {
      var rootDerivedAccount = newRoot.derive(accountPath + '/' + index);
      var childAcct = newAcct.derive_child(index);
      assert.equal(rootDerivedAccount.extended_public_key_string(), childAcct.extended_public_key_string(), "child " + index + " derivation ok");
    }
  });

  it("bitmerchant large vector test", function () {
    Bitcoin.setNetwork('prod');  // This data is from the prod network.

    /* There are a lot of tests - not much point in running them all the time. */
    var tests = fixtures.bitmerchantTests.splice(0,2);

    function isPrime(path) {
      return path.indexOf("'") > 0;
    }

    tests.forEach(function(testcase) {
      var extendedPubKey = new Bitcoin.BIP32(testcase.public_key);
      assert.equal(Bitcoin.Util.bytesToHex(extendedPubKey.chain_code), testcase.chain_code, "public chain code ok");
      assert.equal(extendedPubKey.depth, testcase.depth, "public depth ok");

      var extendedPrivateKey = new Bitcoin.BIP32(testcase.private_key);
      assert.equal(Bitcoin.Util.bytesToHex(extendedPrivateKey.chain_code), testcase.chain_code, "private chain code ok");
      assert.equal(extendedPrivateKey.depth, testcase.depth, "private depth ok");

      testcase.children.forEach(function(childTestcase) {
        // Verify the private key derivation
        var childPrivateKey = extendedPrivateKey.derive(childTestcase.path);
        assert.equal(childPrivateKey.extended_private_key_string(), childTestcase.child.private_key, "derived private key ok");
        assert.equal(childPrivateKey.depth, childTestcase.child.depth, "derived depth ok");

        if (!isPrime(childTestcase.path)) {
          // Verify the pub key derivation
          var childPubKey = extendedPubKey.derive(childTestcase.path);
          assert.equal(childPubKey.extended_public_key_string(), childTestcase.child.public_key, "derived pub key ok");
          assert.equal(childPubKey.depth, childTestcase.child.depth, "derived depth ok");

          // Verify that the pub and private keys are the same key
          var wif = childPrivateKey.eckey.getWalletImportFormat();
          assert.equal(wif, childTestcase.child.wif, "derived wif ok");
          var pubKey = childPubKey.eckey.getPubKeyHex();
          assert.equal(childPrivateKey.eckey.getPubKeyHex(), pubKey, "public and private key derivations match");
        }
      });
    });
    Bitcoin.setNetwork('testnet');
  });

});
