//
// Tests for BitGo Object
//

require('should');
const nock = require('nock');

const TestBitGo = require('../lib/test_bitgo');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../src/common');

describe('BitGo', function describeBitGo() {
  let bitgo;
  let bgUrl;

  before(co(function *coBeforeBitGo() {
    nock('https://bitgo.fakeurl')
    .get('/api/v1/client/constants')
    .reply(200, { ttl: 3600, constants: {} });

    nock('https://bitgo.fakeurl')
    .post('/api/v1/user/login')
    .reply(200, {
      access_token: 'access_token',
      user: { username: 'update_pw_tester@bitgo.com' }
    });

    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.setValidate(false);

    yield bitgo.authenticateChangePWTestUser({ otp: bitgo.testUserOTP() });

    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  describe('change password', function describeChangePW() {

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
  });

  after(function afterBitGo() {
    nock.activeMocks().length.should.equal(0);
  });
});
