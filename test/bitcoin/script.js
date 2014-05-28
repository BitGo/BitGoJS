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

    it('works for a string', function() {
      assert.ok(new Bitcoin.Script('20d40e63ba05d60fab09f88786a86b2130b09dee3abb88d187ff256fa0f2229f0a'));
    })

    it('works for a script', function() {
      var script = new Bitcoin.Script('20d40e63ba05d60fab09f88786a86b2130b09dee3abb88d187ff256fa0f2229f0a');
      assert.ok(new Bitcoin.Script(script));
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

  it("create output script sanity checks", function() {
    var key = new Bitcoin.ECKey();
    var address = new Bitcoin.Address(key);

    assert.throws(function() { Bitcoin.Script.createOutputScript(address.toString()); });
    address.version = 0x999;
    assert.throws(function() { Bitcoin.Script.createOutputScript(address); });
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

  describe('extractAddresses', function() {
    before(function() {
      Bitcoin.setNetwork('prod');
    });
    it('invalid arguments', function() {
      var script = new Bitcoin.Script('410408ce279174b34c077c7b2043e3f3d45a588b85ef4ca466740f848ead7fb498f0a795c982552fdfa41616a7c0333a269d62108588e260fd5a48ac8e4dbf49e2bcac');
      var addresses;
      assert.throws(function() { script.extractAddresses(addresses); });
    });

    it('address', function() {
      // From blockchain: https://blockchain.info/tx/0edfa7207a98f9992e0fd25650b96a5183e0f895b6628373e205253771b6c06c
      var script = new Bitcoin.Script('76a9142c8e90cf5c79f6be389749e2dfd17cf3dc19a5a088ac');
      var addresses = [];
      assert.equal(script.extractAddresses(addresses), 1);
      assert.equal(addresses[0].toString(), '154bX5SU9kGFza7UXzf2RzsixxQJ8sWME2');
      assert.equal(new Bitcoin.Address(script.simpleOutHash()).toString(), '154bX5SU9kGFza7UXzf2RzsixxQJ8sWME2');
    });

    it('pubkey', function() {
      // From blockchain: https://blockchain.info/tx/20251a76e64e920e58291a30d4b212939aae976baca40e70818ceaa596fb9d37
      var script = new Bitcoin.Script('410408ce279174b34c077c7b2043e3f3d45a588b85ef4ca466740f848ead7fb498f0a795c982552fdfa41616a7c0333a269d62108588e260fd5a48ac8e4dbf49e2bcac');
      var addresses = [];
      assert.equal(script.extractAddresses(addresses), 1);
      assert.equal(addresses[0].toString(), '1GkQmKAmHtNfnD3LHhTkewJxKHVSta4m2a');
      assert.equal(new Bitcoin.Address(script.simpleOutHash()).toString(), '1GkQmKAmHtNfnD3LHhTkewJxKHVSta4m2a');
    });

    it('p2sh', function() {
      // From blockchain: https://blockchain.info/rawtx/837dea37ddc8b1e3ce646f1a656e79bbd8cc7f558ac56a169626d649ebe2a3ba
      var script = new Bitcoin.Script('a914f815b036d9bbbce5e9f2a00abd1bf3dc91e9551087');
      var addresses = [];
      assert.equal(script.extractAddresses(addresses), 1);
      assert.equal(addresses[0].toString(), '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC');
      assert.equal(new Bitcoin.Address(script.simpleOutHash(), 5).toString(), '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC');
    });

    it('multisig', function() {
      // From blockchain: https://blockchain.info/tx/3f8bfbc08334de3c3c86b0cdbd7184cd3d8b8f0bb900464fa0d928a00c97ebb9
      var script = new Bitcoin.Script('5121037953dbf08030f67352134992643d033417eaa6fcfb770c038f364ff40d7615882100e37b502529c1d879255683e2e585dfed81637c220890f0ad02007c3d812c89eb52ae');
      var addresses = [];
      assert.equal(script.extractAddresses(addresses), 2);
      assert.equal(addresses[0].toString(), '13MH4zmU4UT4Ct6BhoRFGjigC8gN9a9FNn');
      assert.equal(addresses[1].toString(), '14bXcQ7hacofs3oVMs86DWy5rGPuyNukHA');
      assert.throws(function() { script.simpleOutHash() });
    });

    it('error', function() {
      // From blockchain: https://blockchain.info/tx/41836560e2439f440514af96ca394a38bad6f3d9d0d11dba667c886b16e504ec
      var script = new Bitcoin.Script('20d40e63ba05d60fab09f88786a86b2130b09dee3abb88d187ff256fa0f2229f0a');
      var addresses = [];
      assert.throws(function() { script.extractAddresses(addresses) });
    });
  });
});


