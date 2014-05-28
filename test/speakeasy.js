var assert = require('assert');

var speakeasy = require('./lib/speakeasy');

// These tests use the information from RFC 4226's Appendix D: Test Values.
// http://tools.ietf.org/html/rfc4226#appendix-D

describe('2-FA', function() {
  describe('HOTP', function() {
    it('key = \'12345678901234567890\' at counter 3', function() {
      assert.equal(speakeasy.hotp({key: '12345678901234567890', counter: 3}), '969429');
    }),

    it('key = \'12345678901234567890\' at counter 7', function() {
      assert.equal(speakeasy.hotp({key: '12345678901234567890', counter: 7}), '162583');
    }),

    it('key = \'12345678901234567890\' at counter 4 and length = 8', function() {
      assert.equal(speakeasy.hotp({key: '12345678901234567890', counter: 4, length: 8}), '40338314');
    }),

    it('key = \'3132333435363738393031323334353637383930\' as hex at counter 4', function() {
      assert.equal(speakeasy.hotp({key: '3132333435363738393031323334353637383930', encoding: 'hex', counter: 4}), '338314');
    }),

    it('key = \'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ\' as base32 at counter 4', function() {
      assert.equal(speakeasy.hotp({key: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', encoding: 'base32', counter: 4}), '338314');
    })
  });

  describe('TOTP', function() {
    it('key = \'12345678901234567890\' at time = 59', function() {
      assert.equal(speakeasy.totp({key: '12345678901234567890', time: 59}), '287082');
    }),

    it('key = \'12345678901234567890\' at time = 1111111109', function() {
      assert.equal(speakeasy.totp({key: '12345678901234567890', time: 1111111109}), '081804');
    }),

    it('key = \'12345678901234567890\' at time = 1111111109 and length = 8', function() {
      assert.equal(speakeasy.totp({key: '12345678901234567890', time: 1111111109, length: 8}), '07081804');
    }),

    it('key = \'3132333435363738393031323334353637383930\' as hexadecimal at time = 1111111109', function() {
      assert.equal(speakeasy.totp({key: '3132333435363738393031323334353637383930', encoding: 'hex', time: 1111111109}), '081804');
    }),

    it('key = \'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ\' as base32 at time = 1111111109', function() {
      assert.equal(speakeasy.totp({key: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', encoding: 'base32', time: 1111111109}), '081804');
    }),

    it('key = \'12345678901234567890\' at time = 1111111109 with step = 60', function() {
      assert.equal(speakeasy.totp({key: '12345678901234567890', time: 1111111109, step: 60}), '360094');
    }),

    it('key = \'12345678901234567890\' at time = 1111111109 with initial time  = 1111111100', function() {
      assert.equal(speakeasy.totp({key: '12345678901234567890', time: 1111111109, initial_time: 1111111100}), '755224');
    })
  });

});
