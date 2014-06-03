//
// Tests for Bitcoin Util
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Util = require('../../src/bitcoin/util');
var assert = require('assert');

describe('Util', function() {
  it("bytesToNum", function() {
    assert.equal(Util.bytesToNum([0]), 0);
    assert.equal(Util.bytesToNum([1]), 1);
    assert.equal(Util.bytesToNum([1, 0]), 1);
    assert.equal(Util.bytesToNum([1, 0, 0]), 1);
    assert.equal(Util.bytesToNum([1, 0, 0, 0]), 1);
    assert.equal(Util.bytesToNum([1, 0, 0, 0, 0]), 1);

    assert.equal(Util.bytesToNum([1, 1]), Math.pow(2, 8) + 1);
    assert.equal(Util.bytesToNum([1, 0, 1]), Math.pow(2, 16) + 1);
    assert.equal(Util.bytesToNum([1, 0, 0, 1]), Math.pow(2, 24) + 1);
    assert.equal(Util.bytesToNum([1, 0, 0, 0, 1]), Math.pow(2, 32) + 1);
  });

  it("numToBytes little endian", function() {
    assert.deepEqual(Util.numToBytes(0, 1, false), [0]);
    assert.deepEqual(Util.numToBytes(0, 2, false), [0, 0]);
    assert.deepEqual(Util.numToBytes(0, 4, false), [0, 0, 0, 0]);

    assert.deepEqual(Util.numToBytes(1, 1, false), [1]);
    assert.deepEqual(Util.numToBytes(1, 2, false), [1, 0]);
    assert.deepEqual(Util.numToBytes(1, 4, false), [1, 0, 0, 0]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 1, false), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 2, false), [1, 1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 4, false), [1, 1, 0, 0]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 1, false), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 2, false), [1, 0]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 4, false), [1, 0, 1, 0]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 1, false), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 2, false), [1, 0]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 4, false), [1, 0, 0, 1]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 1, false), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 2, false), [1, 0]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 4, false), [1, 0, 0, 0]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 63)), [0, 0, 0, 0, 0, 0, 0, 128]);
  });

  it("numToBytes big endian", function() {
    assert.deepEqual(Util.numToBytes(0, 1, true), [0]);
    assert.deepEqual(Util.numToBytes(0, 2, true), [0, 0]);
    assert.deepEqual(Util.numToBytes(0, 4, true), [0, 0, 0, 0]);

    assert.deepEqual(Util.numToBytes(1, 1, true), [1]);
    assert.deepEqual(Util.numToBytes(1, 2, true), [0, 1]);
    assert.deepEqual(Util.numToBytes(1, 4, true), [0, 0, 0, 1]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 1, true), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 2, true), [1, 1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 8) + 1, 4, true), [1, 0, 0, 1]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 1, true), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 2, true), [0, 1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 16) + 1, 4, true), [0, 1, 0, 1]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 1, true), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 2, true), [0, 1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 24) + 1, 4, true), [0, 0, 1, 1]);

    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 1, true), [1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 2, true), [0, 1]);
    assert.deepEqual(Util.numToBytes(Math.pow(2, 32) + 1, 4, true), [0, 0, 0, 1]);
  });

  it("numToVarInt little endian", function() {
    assert.deepEqual(Util.numToVarInt(0), [0]);
    assert.deepEqual(Util.numToVarInt(1), [1]);
    assert.deepEqual(Util.numToVarInt(253), [253, 253, 0]);
    assert.deepEqual(Util.numToVarInt(254), [253, 254, 0]);
    assert.deepEqual(Util.numToVarInt(255), [253, 255, 0]);
    assert.deepEqual(Util.numToVarInt(256), [253, 0, 1]);
    assert.deepEqual(Util.numToVarInt(0xffff), [253, 255, 255]);
    assert.deepEqual(Util.numToVarInt(0x10000), [254, 0, 0, 1, 0]);
    assert.deepEqual(Util.numToVarInt(0x10001), [254, 1, 0, 1, 0]);
    assert.deepEqual(Util.numToVarInt(0xffffffff), [254, 255, 255, 255, 255]);
    assert.deepEqual(Util.numToVarInt(0x100000000), [255, 0, 0, 0, 0, 1, 0, 0, 0]);
    assert.deepEqual(Util.numToVarInt(0x100000001), [255, 1, 0, 0, 0, 1, 0, 0, 0]);
  });

  it("numToVarInt big endian", function() {
    assert.deepEqual(Util.numToVarInt(0, true), [0]);
    assert.deepEqual(Util.numToVarInt(1, true), [1]);
    assert.deepEqual(Util.numToVarInt(253, true), [253, 0, 253]);
    assert.deepEqual(Util.numToVarInt(254, true), [253, 0, 254]);
    assert.deepEqual(Util.numToVarInt(255, true), [253, 0, 255]);
    assert.deepEqual(Util.numToVarInt(256, true), [253, 1, 0]);
    assert.deepEqual(Util.numToVarInt(0xffff, true), [253, 255, 255]);
    assert.deepEqual(Util.numToVarInt(0x10000, true), [254, 0, 1, 0, 0]);
    assert.deepEqual(Util.numToVarInt(0x10001, true), [254, 0, 1, 0, 1]);
    assert.deepEqual(Util.numToVarInt(0xffffffff, true), [254, 255, 255, 255, 255]);
    assert.deepEqual(Util.numToVarInt(0x100000000, true), [255, 0, 0, 0, 1, 0, 0, 0, 0]);
    assert.deepEqual(Util.numToVarInt(0x100000001, true), [255, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("bytesToHex", function() {
    assert.deepEqual(Util.bytesToHex([0, 1, 2, 3]), "00010203");
  });

  it("hexToBytes", function() {
    assert.deepEqual(Util.hexToBytes("00010203"), [0, 1, 2, 3]);
  });
});


