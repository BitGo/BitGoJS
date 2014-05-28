//
// Tests for Bitcoin Crypto Lib
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Crypto = require('../../src/bitcoin/crypto-js/index');
var assert = require('assert');

describe('Crypto', function() {
  describe('util', function() {
    it('rotl', function() {
      assert.equal(16711850, Crypto.util.rotl(2852192000, 8));
    });
    it('rotr', function() {
      assert.equal(11141375, Crypto.util.rotr(2852192000, 8));
    });
    it('endian', function() {
      assert.equal(4041261184|0, Crypto.util.endian(2160124144));
      assert.equal(2160124144|0, Crypto.util.endian(Crypto.util.endian(2160124144)));
    });
    it('randomBytes', function() {
      assert.equal(32, Crypto.util.randomBytes(32).length);
      assert.notEqual(Crypto.util.randomBytes(32).toString(), Crypto.util.randomBytes(32).toString());
    });
    it('stringToBytes', function() {
      assert.equal([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21].toString(), Crypto.charenc.Binary.stringToBytes("Hello, World!").toString());
      assert.equal([0x41, 0xE2, 0x89, 0xA2, 0xCE, 0x91, 0x2E].toString(), Crypto.charenc.UTF8.stringToBytes("\u0041\u2262\u0391\u002E").toString());
      assert.equal([0xED, 0x95, 0x9C, 0xEA, 0xB5, 0xAD, 0xEC, 0x96, 0xB4].toString(), Crypto.charenc.UTF8.stringToBytes("\uD55C\uAD6D\uC5B4").toString());
      assert.equal([0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC, 0xE8, 0xAA, 0x9E].toString(), Crypto.charenc.UTF8.stringToBytes("\u65E5\u672C\u8A9E").toString());
    });
    it('bytesToString', function() {
      assert.equal("Hello, World!", Crypto.charenc.Binary.bytesToString([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21]));
      assert.equal("\u0041\u2262\u0391\u002E", Crypto.charenc.UTF8.bytesToString([0x41, 0xE2, 0x89, 0xA2, 0xCE, 0x91, 0x2E]));
      assert.equal("\uD55C\uAD6D\uC5B4", Crypto.charenc.UTF8.bytesToString([0xED, 0x95, 0x9C, 0xEA, 0xB5, 0xAD, 0xEC, 0x96, 0xB4]));
      assert.equal("\u65E5\u672C\u8A9E", Crypto.charenc.UTF8.bytesToString([0xE6, 0x97, 0xA5, 0xE6, 0x9C, 0xAC, 0xE8, 0xAA, 0x9E]));
    });
    it('bytesToWords', function() {
      assert.equal([0x48656C6C, 0x6F2C2057, 0x6F726C64, 0x21000000].toString(), Crypto.util.bytesToWords([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21]).toString());
    });
    it('wordsToBytes', function() {
      assert.equal([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21, 0x00, 0x00, 0x00].toString(), Crypto.util.wordsToBytes([0x48656C6C, 0x6F2C2057, 0x6F726C64, 0x21000000]).toString());
    });
    it('bytesToHex', function() {
      assert.equal("48656c6c6f2c20576f726c6421", Crypto.util.bytesToHex([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21]));
    });
    it('hexToBytes', function() {
      assert.equal([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x2C, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21].toString(), Crypto.util.hexToBytes("48656c6c6f2c20576f726c6421"));
    });
    it('bytesToBase64', function() {
      assert.equal("FPucA9l+", Crypto.util.bytesToBase64([0x14, 0xFB, 0x9C, 0x03, 0xD9, 0x7E]));
      assert.equal("FPucA9k=", Crypto.util.bytesToBase64([0x14, 0xFB, 0x9C, 0x03, 0xD9]));
      assert.equal("FPucAw==", Crypto.util.bytesToBase64([0x14, 0xFB, 0x9C, 0x03]));
    });
    it('base64ToBytes', function() {
      assert.equal([0x14, 0xFB, 0x9C, 0x03, 0xD9, 0x7E].toString(), Crypto.util.base64ToBytes("FPucA9l+"));
      assert.equal([0x14, 0xFB, 0x9C, 0x03, 0xD9].toString(), Crypto.util.base64ToBytes("FPucA9k="));
      assert.equal([0x14, 0xFB, 0x9C, 0x03].toString(), Crypto.util.base64ToBytes("FPucAw=="));
    });
  });

  describe('SHA256', function() {
    it("hashes", function() {
      assert.equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", Crypto.SHA256(""));
      assert.equal("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", Crypto.SHA256("a"));
      assert.equal("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Crypto.SHA256("abc"));
      assert.equal("f7846f55cf23e14eebeab5b4e1550cad5b509e3348fbc4efa3a1413d393cb650", Crypto.SHA256("message digest"));
      assert.equal("71c480df93d6ae2f1efad1447c66c9525e316218cf51fc8d9ed832f2daf18b73", Crypto.SHA256("abcdefghijklmnopqrstuvwxyz"));
      assert.equal("db4bfcbd4da0cd85a60c3c37d3fbd8805c77f15fc6b1fdfe614ee0a7c8fdb4c0", Crypto.SHA256("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"));
      assert.equal("f371bc4a311f2b009eef952dd83ca80e2b60026c8e935592d0f9c308453c813e", Crypto.SHA256("12345678901234567890123456789012345678901234567890123456789012345678901234567890"));
      assert.equal([0xE3, 0xB0, 0xC4, 0x42, 0x98, 0xFC, 0x1C, 0x14, 0x9A, 0xFB, 0xF4, 0xC8, 0x99, 0x6F, 0xB9, 0x24, 0x27, 0xAE, 0x41, 0xE4, 0x64, 0x9B, 0x93, 0x4C, 0xA4, 0x95, 0x99, 0x1B, 0x78, 0x52, 0xB8, 0x55].toString(), Crypto.SHA256("", { asBytes: true }).toString());
      assert.equal("\xE3\xB0\xC4\x42\x98\xFC\x1C\x14\x9A\xFB\xF4\xC8\x99\x6F\xB9\x24\x27\xAE\x41\xE4\x64\x9B\x93\x4C\xA4\x95\x99\x1B\x78\x52\xB8\x55", Crypto.SHA256("", { asString: true }));
    });
  });
});


