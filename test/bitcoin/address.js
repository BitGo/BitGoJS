//
// Tests for Bitcoin Address
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');

var Bitcoin = require('../../src/index');

describe('Address', function() {
  describe('Constuctor', function() {
    it('throws without argument', function() {
      assert.throws(function() { new Bitcoin.Address() });
    });

    it('throws invalid argument', function() {
      assert.throws(function() { new Bitcoin.Address('hello world') });
    });

    it('from ECKey', function() {
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
    });

    it('from array', function() {
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      var addr2 = new Bitcoin.Address(addr.hash);
      assert.deepEqual(addr.hash, addr2.hash);
    });

    it('from string', function() {
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      var addressString = addr.toString();
      var addr2 = new Bitcoin.Address(addressString);
      assert.deepEqual(addr.hash, addr2.hash);
    });

    it('from string checksum failure', function() {
      var addr = 'mtTfHKBR7MRTj68YST9w4dJhPqu5hMWFCN';
      assert.throws(function() { new Bitcoin.Address(addr); });
    });

    it('prod network', function() {
      Bitcoin.setNetwork('prod');
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      assert.equal(addr.version, 0x0);
    });

    it('test network', function() {
      Bitcoin.setNetwork('testnet');
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      assert.equal(addr.version, 0x6f);
    });
  });

  describe('Validate', function() {
    it('validate', function() {
      assert.equal(Bitcoin.Address.validate('hello world'), false);
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      assert.equal(Bitcoin.Address.validate(addr.toString()), true);
    });

    it('validate fails on prod network', function() {
      Bitcoin.setNetwork('testnet');
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      assert.equal(Bitcoin.Address.validate(addr.toString()), true);
      Bitcoin.setNetwork('prod');
      assert.equal(Bitcoin.Address.validate(addr.toString()), false);
    });

    it('validate fails on test network', function() {
      Bitcoin.setNetwork('prod');
      var eckey = new Bitcoin.ECKey();
      var addr = new Bitcoin.Address(eckey);
      assert.equal(Bitcoin.Address.validate(addr.toString()), true);
      Bitcoin.setNetwork('testnet');
      assert.equal(Bitcoin.Address.validate(addr.toString()), false);
    });
  });

  describe('Pub Key', function() {
    it('from pub key', function() {
      var eckey = new Bitcoin.ECKey();
      var pub = eckey.getPub();
      var addr = Bitcoin.Address.fromPubKey(pub);
    });
  });

  describe('MultiSig Address', function() {
    var keys = [];
    before(function() {
      for (var index = 0; index < 20; ++index) {
        keys.push(new Bitcoin.ECKey().getPub());
      }
    });

    it('keys not array', function() {
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(new Bitcoin.ECKey(), 2); });
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress([new Bitcoin.ECKey()], 1); });
    });

    it('too many keys', function() {
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(keys, 20); });
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(keys.splice(0, 3), 6); });
    });

    it('too few keys', function() {
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress([], 2); });
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(keys, -1); });
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(keys.splice(0, 3), 0); });
      assert.throws(function() { Bitcoin.Address.createMultiSigAddress(keys.splice(0, 3), -1); });
    });

    it('2 of 2', function() {
      var address = Bitcoin.Address.createMultiSigAddress(keys.splice(0, 2), 2);
      assert.equal(address.isP2SHAddress(), true);
      assert.equal(address.isPubKeyHashAddress(), false);
      var script = new Bitcoin.Script(address.redeemScript);
      assert.equal(script.getOutType(), 'Multisig');
      assert.equal(script.chunks.length, 5);
      assert.equal(script.chunks[0], Bitcoin.Opcode.map.OP_2);
      assert.equal(script.chunks[3], Bitcoin.Opcode.map.OP_2);
    });

    it('2 of 3', function() {
      var address = Bitcoin.Address.createMultiSigAddress(keys.splice(0, 3), 2);
      assert.equal(address.isP2SHAddress(), true);
      assert.equal(address.isPubKeyHashAddress(), false);
      var script = new Bitcoin.Script(address.redeemScript);
      assert.equal(script.getOutType(), 'Multisig');
      assert.equal(script.chunks.length, 6);
      assert.equal(script.chunks[0], Bitcoin.Opcode.map.OP_2);
      assert.equal(script.chunks[4], Bitcoin.Opcode.map.OP_3);
    });
  });
});


