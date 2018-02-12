//
// Tests for Keychains
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');

const TestBitGo = require('../lib/test_bitgo');

describe('Keychains', function() {
  let bitgo;
  let keychains;

  before(function(done) {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    keychains = bitgo.keychains();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      done();
    });
  });

  describe('Local', function() {
    it('isValid', function() {
      assert.throws(function() { keychains.isValid(''); });
      assert.throws(function() { keychains.isValid({}); });
      assert.equal(keychains.isValid({ key: 'hello world' }), false);
      assert.equal(keychains.isValid({ key: 'xpub123123' }), false);
      assert.equal(keychains.isValid({ key: 'xprv123123' }), false);

      assert.equal(keychains.isValid({ key: 'xpub661MyMwAqRbcH5xFjpBfCe74cj5tks4nxE8hSMepNfsMVsBkx8eT1m9mnR1tAMGdbbdsE8yMDcuZ3NgVJbTzCYDiu8rcc3sqLF6vzi9yfTB' }), true);
      assert.equal(keychains.isValid({ key: 'xprv9s21ZrQH143K2hrPzWSx6ZXUbcq6Skc22ZsACrjzx6wae8fV63x9gbixpv89ssBvcYLju8BSbjSVF1q2DM1BnFdhi65fgbYrS5WE9UzZaaw' }), true);
    });

    it('create', function() {
      // must use seed of at least 128 bits
      // standard test vector taken from bip32 spec
      const seed = new Buffer('000102030405060708090a0b0c0d0e0f', 'hex');
      assert.equal(keychains.create({ seed: seed }).xprv, 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi');

      // two keys created one after the other with no seed should have
      // non-equivalent xprivs, i.e. check that the RNG is actually working.
      assert.notEqual(keychains.create().xprv, keychains.create().xprv);
    });

    it('deriveLocal', function() {
      assert.throws(function() { keychains.deriveLocal(''); });
      assert.throws(function() { keychains.deriveLocal({}); });
      assert.throws(function() { keychains.deriveLocal({ path: 'm/0/1' }); });
      assert.throws(function() { keychains.deriveLocal({ path: 'm/0/1', xprv: 'xprv9xDfxS6Lqhq1CHyU5RouJbbBTjtv2GUwfQ5Xg14vWuj4YizffPA2G8HVyoNNyqTrfdN47QHJnP9bjwn7G9d6oAxDnbRyugouXmNeVZHfJ6P', xpub: 'xpub6BD2MwdEg5PJQn3wBTLufjXv1mjQRjCo2d18UPUY5FG3RXKpCvUGovbyq6oa1hWuvGb5P4F5mG3tKZYh7chDkQrdBTfKhH5iXPR5g4men9L' }); });

      const xprvDerivation = keychains.deriveLocal(
        {
          path: 'm/0/1',
          xprv: 'xprv9s21ZrQH143K2JF8RafpqtKiTbsbaxEeUaMnNHsm5o6wCW3z8ySyH4UxFVSfZ8n7ESu7fgir8imbZKLYVBxFPND1pniTZ81vKfd45EHKX73'
        }
      );
      assert.equal(xprvDerivation.xprv, 'xprv9xDfxS6Lqhq1CHyU5RouJbbBTjtv2GUwfQ5Xg14vWuj4YizffPA2G8HVyoNNyqTrfdN47QHJnP9bjwn7G9d6oAxDnbRyugouXmNeVZHfJ6P');
      assert.equal(xprvDerivation.xpub, 'xpub6BD2MwdEg5PJQn3wBTLufjXv1mjQRjCo2d18UPUY5FG3RXKpCvUGovbyq6oa1hWuvGb5P4F5mG3tKZYh7chDkQrdBTfKhH5iXPR5g4men9L');

      const xpubDerivation = keychains.deriveLocal(
        {
          path: 'm/0/1',
          xpub: 'xpub6BD2MwdEg5PJQn3wBTLufjXv1mjQRjCo2d18UPUY5FG3RXKpCvUGovbyq6oa1hWuvGb5P4F5mG3tKZYh7chDkQrdBTfKhH5iXPR5g4men9L'
        }
      );
      assert.equal(xpubDerivation.xpub, 'xpub6Ee6yTYU8n4jBALmLc7jn88vQkuEUEN4xEyre8Y8f4UeTE9Wv4kQoVBc2EBkDN4bHSf5TrHFEUFM6ZWboxrDXuthejjm61ukBSnM3sEYtM9');
      assert.equal(xpubDerivation.xprv, undefined);
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.list({}, 'invalid'); });
      assert.throws(function() { keychains.list('invalid'); });
      assert.throws(function() { keychains.list('invalid', function() {}); });
    });

    it('all', function(done) {
      keychains.list({}, function(err, keychains) {
        assert.equal(err, null);
        assert.equal(Array.isArray(keychains), true);
        done();
      });
    });
  });

  describe('Get', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
    });

    it('non existent keychain', function(done) {
      const newKey = keychains.create();
      const options = {
        xpub: newKey.xpub
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });
  });

  describe('Add', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.create('invalid'); });
      assert.throws(function() { keychains.add(); });
      assert.throws(function() { keychains.add('invalid'); });
      assert.throws(function() { keychains.add({}, 0); });
    });

    describe('public', function() {
      let extendedKey;

      before(function(done) {
        // Generate a new keychain
        extendedKey = keychains.create();

        bitgo.unlock({ otp: bitgo.testUserOTP() }, function(err) {
          assert.equal(err, null);
          done();
        });
      });

      it('add', function(done) {
        const options = {
          xpub: extendedKey.xpub
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          done();
        });
      });

      it('get', function(done) {
        const options = {
          xpub: extendedKey.xpub
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          done();
        });
      });
    });

    describe('private', function() {
      let extendedKey;

      before(function() {
        // Generate a new keychain
        extendedKey = keychains.create();
      });

      it('add', function(done) {
        const options = {
          xpub: extendedKey.xpub,
          encryptedXprv: 'xyzzy'
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });

      it('get', function(done) {
        const options = {
          xpub: extendedKey.xpub
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });
    });
  });

  describe('Create Backup', function() {
    it('arguments', function() {
      assert.throws(function() {
        keychains.createBackup('invalid');
      });
      assert.throws(function() {
        keychains.createBackup();
      });
      assert.throws(function() {
        keychains.createBackup({}, 0);
      });
    });

    describe('prederived key', function() {
      let generatedXPub;
      it('add', function() {
        const options = {
          provider: 'bitgo'
        };
        return keychains.createBackup(options)
        .then(function(keychain) {
          keychain.should.have.property('xpub');
          keychain.should.have.property('path');
          generatedXPub = keychain.xpub;
        });
      });

      it('get', function() {
        const options = {
          xpub: generatedXPub
        };
        return keychains.get(options)
        .then(function(keychain) {
          keychain.should.have.property('xpub');
          keychain.should.have.property('path');
          keychain.xpub.should.eql(generatedXPub);
        });
      });
    });
  });

  describe('Update', function() {
    let newKey;

    before(function() {
      newKey = keychains.create();
    });

    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
    });

    it('non existent keychain', function(done) {
      const options = {
        xpub: newKey.xpub
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });

    it('update ', function(done) {
      const options = {
        xpub: newKey.xpub
      };
      keychains.add(options, function(err, keychain) {
        assert.equal(err, null);
        assert.equal(keychain.xpub, newKey.xpub);
        assert.equal(keychain.path, 'm');

        options.label = 'new label';
        options.encryptedXprv = 'abracadabra';
        keychains.update(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, newKey.xpub);
          assert.equal(keychain.encryptedXprv, 'abracadabra');
          assert.equal(keychain.path, 'm');
          done();
        });
      });
    });

  });


});
