var assert = require('assert');
var should = require('should');

var common = require('../../../src/common');
var TestV2BitGo = require('../../lib/test_bitgo');

describe('XRP:', function() {
  var bitgo;
  var basecoin;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      basecoin = bitgo.coin('txrp');
    })
  });

  it('Should verify addresses', function() {
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1893500718') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?r=a') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967296') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x123') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0x0') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=0') === true);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=-1') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=1.5') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=b') === false);
    assert(basecoin.isValidAddress('r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=a54b') === false);
    assert(basecoin.isValidAddress('xrp://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?dt=4294967295') === false);
    assert(basecoin.isValidAddress('http://r2udSsspYjWSoUZxzxLzV6RxGcbygngJ8?a=b&dt=4294967295') === false);
  });
});
