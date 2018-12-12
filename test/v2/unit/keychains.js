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

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    it('should fail to update the password', co(function *coItFail() {
      yield keychains.updatePassword({ newPassword: '5678' })
      .should.be.rejectedWith('Missing parameter: oldPassword');

      yield keychains.updatePassword({ oldPassword: 1234, newPassword: '5678' })
      .should.be.rejectedWith('Expecting parameter string: oldPassword but found number');

      yield keychains.updatePassword({ oldPassword: '1234' })
      .should.be.rejectedWith('Missing parameter: newPassword');

      yield keychains.updatePassword({ oldPassword: '1234', newPassword: 5678 })
      .should.be.rejectedWith('Expecting parameter string: newPassword but found number');
    }));

    it('should fail to update the password for a single keychain', co(function *coItFail() {
      (() => keychains.updateSingleKeychainPassword({ newPassword: '5678' }))
      .should.throw('expected old password to be a string');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: 1234, newPassword: '5678' }))
      .should.throw('expected old password to be a string');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234' }))
      .should.throw('expected new password to be a string');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: 5678 }))
      .should.throw('expected new password to be a string');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: '5678' }))
      .should.throw('expected keychain to be an object with an encryptedPrv property');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: '5678', keychain: {} }))
      .should.throw('expected keychain to be an object with an encryptedPrv property');

      (() => keychains.updateSingleKeychainPassword({ oldPassword: '1234', newPassword: '5678', keychain: { encryptedPrv: 123 } }))
      .should.throw('expected keychain to be an object with an encryptedPrv property');
    }));

    describe('successful password update', function describeSuccess() {
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

      it('single keychain password update', () => {
        const prv = 'xprvtest';
        const keychain = {
          xpub: 'xpub123',
          encryptedPrv: bitgo.encrypt({ input: prv, password: oldPassword })
        };

        const newKeychain = keychains.updateSingleKeychainPassword({ keychain, oldPassword, newPassword });

        const decryptedPrv = bitgo.decrypt({ input: newKeychain.encryptedPrv, password: newPassword });
        decryptedPrv.should.equal(prv);
      });
    });

    after(function afterUpdatePassword() {
      nock.activeMocks().should.be.empty();
    });
  });
});
