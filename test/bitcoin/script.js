//
// Tests for Bitcoin Script
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var assert = require('assert');
var Address = require('../../src/bitcoin/address.js');
var fixtures = require('./fixtures/script.json');

describe('Script', function() {
  describe('constructor', function() {
    it('works for a byte array', function() {
      assert.ok(new Bitcoin.Script([]));
    })

    it('works when nothing is passed in', function() {
      assert.ok(new Bitcoin.Script());
    })

    it('throws an error when input is not an array', function() {
      assert.throws(function(){ new Bitcoin.Script({}) });
    })
  });

  describe('fromHex/toHex', function() {
    fixtures.valid.forEach(function(f) {
      it('decodes/encodes ' + f.description, function() {
        var bytes = Bitcoin.Util.hexToBytes(f.hex);
        var script = new Bitcoin.Script(bytes);
        var hex = Bitcoin.Util.bytesToHex(script.buffer);
        assert.equal(hex, f.hex);
      })
    })
  })

  describe('getInType', function() {
    fixtures.valid.forEach(function(f) {
      if (!f.isScriptPub) {
        it('supports ' + f.description, function() {
          var script = new Bitcoin.Script(Bitcoin.Util.hexToBytes(f.hex));
          assert.equal(script.getInType(), f.type);
        })
      }
    })
  })

  describe('getOutType', function() {
    fixtures.valid.forEach(function(f) {
      if (f.isScriptPub) {
        it('supports ' + f.description, function() {
          var script = new Bitcoin.Script(Bitcoin.Util.hexToBytes(f.hex));
          assert.equal(script.getOutType(), f.type)
        })
      }
    })
  })

  it("build a script", function() {
    var script = new Bitcoin.Script();
    assert.ok(script, "create");
    assert.equal(undefined, script.writeOp(Bitcoin.Opcode.OP_0), "writeOp");
    assert.equal(undefined, script.writeBytes('hello world'), "writeBytes");
    assert.equal('Strange', script.getOutType(), "getOutputType");
  });

  it("pay to pubkey hash", function() {
    var key = new Bitcoin.ECKey();
    var address = new Bitcoin.Address(key);

    var script = Bitcoin.Script.createOutputScript(address);
    assert.ok(script, "createOutputScript");
    assert.equal(script.chunks.length, 5);

    assert.equal('Address', script.getOutType(), "Output Script Type");

    var addresses = [];
    script.extractAddresses(addresses);
    assert.equal(1, addresses.length, "extract addresses count");
    assert.equal(address.toString(), addresses[0].toString(), "extract addresses")
  });

  it("pay to script hash", function() {
    var keys = [];
    for (var index = 0; index < 3; ++index) {
      keys.push(new Bitcoin.ECKey().getPub());
    }
    var multiSigAddress = Bitcoin.Address.createMultiSigAddress(keys, 2);
    var script = Bitcoin.Script.createOutputScript(multiSigAddress);
    assert.ok(script, "createOutputScript");
    assert.equal(script.chunks.length, 3);

    assert.equal('P2SH', script.getOutType(), "Output Script Type");

    var addresses = [];
    script.extractAddresses(addresses);
    assert.equal(1, addresses.length, "extract addresses count");
    assert.equal(multiSigAddress.toString(), addresses[0].toString(), "extract addresses");
  });

  it("M-of-3 multisig script pubkey", function() {
    var keys = [];
    for (var index = 0; index < 3; ++index) {
      keys.push(new Bitcoin.ECKey().getPub());
    }
    var multiSigAddress = Bitcoin.Address.createMultiSigAddress(keys, 2);
    assert.ok(multiSigAddress, 'created address');
    var redeemScript = multiSigAddress.redeemScript;
    assert.ok(redeemScript, 'got redeem script');

    var hex = Bitcoin.Util.bytesToHex(redeemScript);
    assert.ok(hex, 'converted to hex');
    var bytes = Bitcoin.Util.hexToBytes(hex);
    assert.ok(bytes, 'converted back to bytes');
    var script = new Bitcoin.Script(bytes);
    assert.ok(script, 'created script');

    var addresses = [];
    var count = script.extractMultiSigPubKeys(addresses);
    assert.equal(count, 3, 'found right number of addresses');
    assert.deepEqual(addresses[0], keys[0], 'key #0 is ok');
    assert.deepEqual(addresses[1], keys[1], 'key #1 is ok');
    assert.deepEqual(addresses[2], keys[2], 'key #2 is ok');
  });

  it("verify 2-of-3 redeemScript hash", function() {
    var pubKeys = [
      Bitcoin.Util.hexToBytes('02ea1297665dd733d444f31ec2581020004892cdaaf3dd6c0107c615afb839785f'),
      Bitcoin.Util.hexToBytes('02fab2dea1458990793f56f42e4a47dbf35a12a351f26fa5d7e0cc7447eaafa21f'),
      Bitcoin.Util.hexToBytes('036c6802ce7e8113723dd92cdb852e492ebb157a871ca532c3cb9ed08248ff0e19')
    ];

    var redeemScript = Bitcoin.Script.createMultiSigScript(2, pubKeys)
    var hash160 = Bitcoin.Util.sha256ripe160(redeemScript.buffer)
    var multisigAddress = new Bitcoin.Address(hash160, 5);   // 5 is P2SH version
    assert.equal(multisigAddress.toString(), '32vYjxBb7pHJJyXgNk8UoK3BdRDxBzny2v')
  });

});


