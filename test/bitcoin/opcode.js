//
// Tests for Bitcoin Opcode
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');

describe('Opcode', function() {
  it("lookup", function() {
    assert.equal(Bitcoin.Opcode.map['OP_0'], 0);
    assert.equal(Bitcoin.Opcode.map['OP_1'], 81);
    assert.equal(Bitcoin.Opcode.map['OP_2'], 82);
    assert.equal(Bitcoin.Opcode.map['OP_3'], 83);
    assert.equal(Bitcoin.Opcode.map['OP_CHECKMULTISIG'], 174);
  });

  it("reverse lookup", function() {
    assert.equal(new Bitcoin.Opcode(0).toString(), 'OP_FALSE');
    assert.equal(new Bitcoin.Opcode(81).toString(), 'OP_TRUE');
    assert.equal(new Bitcoin.Opcode(82).toString(), 'OP_2');
    assert.equal(new Bitcoin.Opcode(83).toString(), 'OP_3');
    assert.equal(new Bitcoin.Opcode(174).toString(), 'OP_CHECKMULTISIG');
  });
});


