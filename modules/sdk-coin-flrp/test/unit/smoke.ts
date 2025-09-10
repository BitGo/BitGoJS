import 'mocha';

describe('sdk-coin-flrp smoke tests', function () {
  it('should load all main modules without errors', function () {
    // Test that main modules can be imported without throwing
    (() => require('../../src/flrp')).should.not.throw();
    (() => require('../../src/lib/utils')).should.not.throw();
    (() => require('../../src/lib/atomicTransactionBuilder')).should.not.throw();
    (() => require('../../src/lib/iface')).should.not.throw();
  });

  it('should have proper module exports', function () {
    const flrp = require('../../src/flrp');
    const utils = require('../../src/lib/utils');
    const atomicTxBuilder = require('../../src/lib/atomicTransactionBuilder');
    const iface = require('../../src/lib/iface');

    flrp.should.have.property('Flrp');
    utils.should.have.property('Utils');
    atomicTxBuilder.should.have.property('AtomicTransactionBuilder');
    iface.should.have.property('ADDRESS_SEPARATOR');
  });
});
