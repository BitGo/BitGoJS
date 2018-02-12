//
// Test for Keychains
//

require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Keychains', function() {
  describe('Update Password', function() {
    let bitgo;
    let basecoin;
    let keychains;

    before(co(function *() {
      bitgo = new TestV2BitGo({ env: 'test' });
      bitgo.initializeTestVars();
      basecoin = bitgo.coin('tltc');
      keychains = basecoin.keychains();
    }));

    it('should fail to update the password', co(function *() {
      try {
        yield keychains.updatePassword({ newPassword: '5678' });
        throw new Error();
      } catch (e) {
        e.message.should.equal('Missing parameter: oldPassword');
      }

      try {
        yield keychains.updatePassword({ oldPassword: 1234, newPassword: '5678' });
        throw new Error();
      } catch (e) {
        e.message.should.equal('Expecting parameter string: oldPassword but found number');
      }

      try {
        yield keychains.updatePassword({ oldPassword: '1234' });
        throw new Error();
      } catch (e) {
        e.message.should.equal('Missing parameter: newPassword');
      }

      try {
        yield keychains.updatePassword({ oldPassword: '1234', newPassword: 5678 });
        throw new Error();
      } catch (e) {
        e.message.should.equal('Expecting parameter string: newPassword but found number');
      }
    }));
  });
});
