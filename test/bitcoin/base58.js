//
// Tests for Bitcoin Base58
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');
var fixtures = require('./fixtures/base58.json')

describe('Base58', function() {
  describe('encode', function() {
    it('throws with wrong arguments', function() {
      assert.throws(function() { Bitcoin.Base58.encode() });
      assert.throws(function() { Bitcoin.Base58.encode('') });
      assert.throws(function() { Bitcoin.Base58.encode([]) });
      assert.throws(function() { Bitcoin.Base58.encode('this is a test') });
    });
  });

  describe('decode', function() {
    it('throws with wrong arguments', function() {
      assert.throws(function() { Bitcoin.Base58.decode([]) });
      assert.throws(function() { Bitcoin.Base58.decode('bad characters -') });
      assert.throws(function() { Bitcoin.Base58.decode('00') });
      assert.throws(function() { Bitcoin.Base58.decode('OO') });
      assert.throws(function() { Bitcoin.Base58.decode('II') });
      assert.throws(function() { Bitcoin.Base58.decode('ll') });
    });

    it('errors', function() {
      fixtures.invalid.forEach(function(f) {
        assert.throws(function() { Bitcoin.Base58.decode(f.string); });
      });
    });
  });

  describe('encodeFromString', function() {
    it('throws with wrong arguments', function() {
      assert.throws(function() { Bitcoin.Base58.encodeFromString() });
      assert.throws(function() { Bitcoin.Base58.encodeFromString([]) });
    });
  });

  describe('decodeToString', function() {
    it('throws with wrong arguments', function() {
      assert.throws(function() { Bitcoin.Base58.decodeToString() });
      assert.throws(function() { Bitcoin.Base58.decodeToString([]) });
      assert.throws(function() { Bitcoin.Base58.decode('bad characters -') });
      assert.throws(function() { Bitcoin.Base58.decode('00') });
      assert.throws(function() { Bitcoin.Base58.decode('OO') });
      assert.throws(function() { Bitcoin.Base58.decode('II') });
      assert.throws(function() { Bitcoin.Base58.decode('ll') });
    });
  });

  describe('encode/decode', function() {
    it('byte arrays', function() {
      fixtures.byteArrays.forEach(function(f) {
        var actual = Bitcoin.Base58.encode(f.data);
        var expected = f.result;
        assert.strictEqual(actual, expected);
        assert.deepEqual(Bitcoin.Base58.decode(actual), f.data);
      });
    });

    it('strings', function() {
      fixtures.strings.forEach(function(f) {
        var actual = Bitcoin.Base58.encodeFromString(f.string);
        var expected = f.result;
        assert.strictEqual(actual, expected);
        assert.deepEqual(Bitcoin.Base58.decodeToString(actual), f.string);
      });
    });
  });

});


