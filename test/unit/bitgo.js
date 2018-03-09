//
// Tests for BitGo Object
//

const should = require('should');
const nock = require('nock');

const TestBitGo = require('../lib/test_bitgo');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../src/common');


describe('BitGo Prototype Methods', function() {

  before(function bitgoPrototypeMethodsBefore() {
    // disable net connect for this suite (all unit test suites should do this)
    nock.disableNetConnect();
  });

  describe('change password', function() {
    let bitgo;
    let bgUrl;

    before(co(function *coBeforeChangePassword() {
      nock('https://bitgo.fakeurl')
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants: {} });

      nock('https://bitgo.fakeurl')
      .post('/api/v1/user/login')
      .reply(200, {
        access_token: 'access_token',
        user: { username: 'update_pw_tester@bitgo.com' }
      });

      TestBitGo.prototype._constants = undefined;

      bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();
      bitgo.setValidate(false);

      yield bitgo.authenticateChangePWTestUser({ otp: bitgo.testUserOTP() });

      bgUrl = common.Environments[bitgo.getEnv()].uri;
    }));

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail to change the password', function changePWFail() {
      it('wrong arguments', co(function *coWrongArguments() {
        try {
          yield bitgo.changePassword({ newPassword: '5678' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Missing parameter: oldPassword');
        }

        try {
          yield bitgo.changePassword({ oldPassword: 1234, newPassword: '5678' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Expecting parameter string: oldPassword but found number');
        }

        try {
          yield bitgo.changePassword({ oldPassword: '1234' });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Missing parameter: newPassword');
        }

        try {
          yield bitgo.changePassword({ oldPassword: '1234', newPassword: 5678 });
          throw new Error();
        } catch (e) {
          e.message.should.equal('Expecting parameter string: newPassword but found number');
        }
      }));

      it('incorrect old password', co(function *coIncorrectOldPW() {
        nock(bgUrl)
        .post('/api/v1/user/verifypassword')
        .reply(200, { valid: false });
        try {
          yield bitgo.changePassword({ oldPassword, newPassword });
          throw new Error();
        } catch (e) {
          e.message.should.equal('the provided oldPassword is incorrect');
        }
      }));
    });

    it('successful password change', co(function *coChangePWSuccess() {
      nock(bgUrl)
      .post('/api/v1/user/verifypassword')
      .reply(200, { valid: true });

      nock(bgUrl)
      .post('/api/v1/user/encrypted')
      .reply(200, {
        version: 1,
        keychains: {
          xpub11: bitgo.encrypt({ input: 'xprv11', password: oldPassword }),
          xpub12: bitgo.encrypt({ input: 'xprv12', password: oldPassword }),
          xpub13: bitgo.encrypt({ input: 'xprv13', password: otherPassword }),
          xpub14: bitgo.encrypt({ input: 'xprv14', password: oldPassword })
        }
      });

      nock(bgUrl)
      .get('/api/v2/tbtc/key')
      .query(true)
      .reply(200, {
        keys: [
          {
            pub: 'xpub21',
            encryptedPrv: bitgo.encrypt({ input: 'xprv21', password: oldPassword })
          },
          {
            pub: 'xpub22',
            encryptedPrv: bitgo.encrypt({ input: 'xprv22', password: otherPassword })
          }
        ]
      });

      nock(bgUrl)
      .post('/api/v1/user/changepassword')
      .reply(200, {});

      yield bitgo.changePassword({ oldPassword, newPassword });
    }));

    after(function afterChangePassword() {
      nock.activeMocks().length.should.equal(0);
    });
  });

  describe('Token Definitions at Startup', function() {

    before(function tokenDefinitionsBefore() {
      nock('https://bitgo.fakeurl')
      .get('/api/v1/client/constants')
      .twice()
      .reply(200, {
        ttl: 3600,
        constants: {}
      });
      TestBitGo.prototype._constants = undefined;
    });

    it('Should return a non-empty list of tokens before the server responds', co(function *coTokenDefinitionsIt() {
      const bitgo = new TestBitGo({ env: 'mock' });
      bitgo.initializeTestVars();
      const tokens = bitgo.getConstants().eth.tokens;

      // currently two tokens are defined for non-production environments
      should.exist(tokens);
      tokens.length.should.equal(2);
    }));

    after(function tokenDefinitionsAfter() {
      nock.activeMocks().length.should.equal(0);
    });
  });

  after(function bitgoPrototypeMethodsAfter() {
    nock.enableNetConnect();
  });
});
