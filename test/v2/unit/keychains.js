//
// Test for Keychains
//

require('should');
const Promise = require('bluebird');
const co = Promise.coroutine;
const nock = require('nock');
const common = require('../../../src/common');
const _ = require('lodash');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Keychains', function v2keychains() {
  let bitgo;
  let basecoin;
  let keychains;
  let bgUrl;

  before(function before() {
    nock('https://bitgo.fakeurl')
    .get('/api/v1/client/constants')
    .twice()
    .reply(200, { ttl: 3600, constants: {} });

    TestV2BitGo.prototype._constants = undefined;

    bitgo = new TestV2BitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.setValidate(false);
    basecoin = bitgo.coin('tltc');
    keychains = basecoin.keychains();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  describe('Add Keychain', function addKeychain() {
    it('should add a keychain', co(function *addKeychain() {
      nock(bgUrl)
      .post('/api/v2/tltc/key', function(body) {
        body.pub.should.equal('pub');
        body.derivedFromParentWithSeed.should.equal('derivedFromParentWithSeed');
        return true;
      })
      .reply(200, {});
      yield keychains.add({ pub: 'pub', derivedFromParentWithSeed: 'derivedFromParentWithSeed' });
    }));
  });

  describe('Update Password', function updatePassword() {
    it('should fail to update the password', co(function *coItFail() {
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

    describe('successful password update', function describeSuccess() {
      const oldPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const otherPassword = 'otherPassword';

      const validateKeys = function(keys, newPassword) {
        _.each(keys, function(encryptedPrv, pub) {
          pub.should.startWith('xpub');
          const decryptedPrv = bitgo.decrypt({ input: encryptedPrv, password: newPassword });
          decryptedPrv.should.startWith('xprv');
        });
      };

      it('receive only one page when listing keychains', co(function *coOnePageIt() {
        nock(bgUrl)
        .get('/api/v2/tltc/key')
        .query(true)
        .reply(200, {
          keys: [
            {
              pub: 'xpub1',
              encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword })
            },
            {
              pub: 'xpub2',
              encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword })
            }
          ]
        });

        const keys = yield keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      }));

      it('receive multiple pages when listing keychains', co(function *coMultiplePageIt() {
        const prevId = 'prevId';
        nock(bgUrl)
        .get('/api/v2/tltc/key')
        .query(true)
        .reply(200, {
          nextBatchPrevId: prevId,
          keys: [
            {
              pub: 'xpub1',
              encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword })
            },
            {
              pub: 'xpub2',
              encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword })
            }
          ]
        });

        nock(bgUrl)
        .get('/api/v2/tltc/key')
        .query(function queryNextPageMatch(queryObject) {
          return queryObject.prevId === prevId;
        })
        .reply(200, {
          keys: [
            {
              pub: 'xpub3',
              encryptedPrv: bitgo.encrypt({ input: 'xprv3', password: oldPassword })
            },
            {
              pub: 'xpub4',
              encryptedPrv: bitgo.encrypt({ input: 'xprv4', password: otherPassword })
            }
          ]
        });

        const keys = yield keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      }));
    });

    after(function afterUpdatePassword() {
      nock.activeMocks().length.should.equal(0);
    });
  });
});
