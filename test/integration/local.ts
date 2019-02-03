//
// Tests that don't require an internet connection.
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');
const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');

describe('Constructor', function() {
  it('arguments', function() {
    assert.throws(function() { new BitGoJS.BitGo('invalid'); }, /Must pass in parameters dictionary/);
    assert.throws(function() { new BitGoJS.BitGo({ useProduction: 'invalid' }); }, /invalid argument/);
    assert.throws(function() { new BitGoJS.BitGo({ clientId: 'invalid' }); }, /invalid argument/);
    assert.throws(function() { new BitGoJS.BitGo({ clientSecret: 'invalid' }); }, /invalid argument/);
    assert.throws(function() { new BitGoJS.BitGo({ env: 'invalid' }); }, /invalid environment/);
    assert.throws(function() { new BitGoJS.BitGo({ env: 'testnet', useProduction: true }); }, /cannot use useProduction/);
  });

  it('methods', function() {
    const bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    bitgo.should.have.property('version');
    bitgo.should.have.property('market');
    bitgo.should.have.property('authenticate');
    bitgo.should.have.property('logout');
    bitgo.should.have.property('me');
    bitgo.should.have.property('encrypt');
    bitgo.should.have.property('decrypt');
    bitgo.should.have.property('_validate');
  });
});

describe('BitGo environment', function() {
  let originalBitGoEnv;

  before(function() {
    // Save environment variable state, so that we can restore it after tests run.
    originalBitGoEnv = process.env.BITGO_ENV;
  });

  it('should set environment', function() {
    // Default to test when no env specified.
    let bitgo = new BitGoJS.BitGo();
    bitgo.env.should.equal('test');

    // env passed as param.
    bitgo = new BitGoJS.BitGo({ env: 'prod' });
    bitgo.env.should.equal('prod');

    // env passed as environment variable.
    process.env.BITGO_ENV = 'prod';
    bitgo = new BitGoJS.BitGo();
    bitgo.env.should.equal('prod');

    // Param overrides environment variable.
    bitgo = new BitGoJS.BitGo({ env: 'test' });
    bitgo.env.should.equal('test');

    delete process.env.BITGO_ENV;

    // useProduction param
    bitgo = new BitGoJS.BitGo({ useProduction: true });
    bitgo.env.should.equal('prod');
  });

  after(function() {
    if (originalBitGoEnv) {
      process.env.BITGO_ENV = originalBitGoEnv;
    } else {
      delete process.env.BITGO_ENV;
    }
  });
});
