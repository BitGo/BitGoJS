//
// Test for Keychains
//

import * as should from 'should';
import * as Promise from 'bluebird';
import * as nock from 'nock';
import * as common from '../../../src/common';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import {TestBitGo} from '../../lib/test_bitgo';
import {CoinKind, coins, KeyCurve, CoinFamily, UnderlyingAsset} from '@bitgo/statics';

const co = Promise.coroutine;

describe('V2 Keychains', function v2keychains() {
  let bitgo;
  let basecoin;
  let keychains;
  let bgUrl;

  before(function before() {
    bitgo = new TestBitGo({ env: 'mock' });
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

  /**
   * This section's intention is to provide some key generation sanity checking. generateKeyPair is a general surface
   * for key generation but the keys are treated the same by BitGo down the line. Any SECP256K1 based coins key-pairs can
   * be re-used so need to be the same.
   **/
  describe('Key generation enforcement for SECP256K1', function() {
    // iterate over non-fiat crypto secp coins
    const coinFamilyValues = Object.keys(CoinFamily).map(n => n.toLowerCase());
    const cryptoSecpCoins = coins.filter(n => n.primaryKeyCurve === KeyCurve.Secp256k1
      && n.kind === CoinKind.CRYPTO
      && n.asset !== UnderlyingAsset.USD
      && coinFamilyValues.includes(n.name));

    const expectedXpub = 'xpub661MyMwAqRbcGpZf8mxNWhSPdWaLGvQzzage6vq2oQFzq8toVzmkjygYZ3HcZw6eCzAfn9ZdyGjKoKkcpKwackdgznVbiunpq7rkxDu7quS';
    const expectedXprv = 'xprv9s21ZrQH143K4LVC2kRN9ZVf5UjqsTh9dMm3JYRRF4j1xLZexTTWCBN4hmdZUHeT3vCJPL181ErVaY489ArBKSWaB7Du7vyVS6XC43WtK7A';

    const seed = Buffer.from('this is some random seed we will use', 'utf-8');

    it('should create the same key with the same seed', function() {
      cryptoSecpCoins.forEach(function(coinName) {
        const currentCoin = bitgo.coin(coinName.name);
        const keyPair = currentCoin.generateKeyPair(seed);

        should.exist(keyPair.pub);
        should.exist(keyPair.prv);

        keyPair.pub.should.equal(expectedXpub);
        keyPair.prv.should.equal(expectedXprv);
      });
    });
  });

  describe('Update Password', function updatePassword() {

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail', function describeSuccess() {
      let sandbox;
      beforeEach(function () {
        sandbox = sinon.createSandbox();
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('to update the password', co(function* coItFail() {
        yield keychains.updatePassword({newPassword: '5678'})
        .should.be.rejectedWith('Missing parameter: oldPassword');

        yield keychains.updatePassword({oldPassword: 1234, newPassword: '5678'})
        .should.be.rejectedWith('Expecting parameter string: oldPassword but found number');

        yield keychains.updatePassword({oldPassword: '1234'})
        .should.be.rejectedWith('Missing parameter: newPassword');

        yield keychains.updatePassword({oldPassword: '1234', newPassword: 5678})
        .should.be.rejectedWith('Expecting parameter string: newPassword but found number');
      }));

      it('to update the password for a single keychain', co(function* coItFail() {
        (() => keychains.updateSingleKeychainPassword({newPassword: '5678'}))
        .should.throw('expected old password to be a string');

        (() => keychains.updateSingleKeychainPassword({oldPassword: 1234, newPassword: '5678'}))
        .should.throw('expected old password to be a string');

        (() => keychains.updateSingleKeychainPassword({oldPassword: '1234'}))
        .should.throw('expected new password to be a string');

        (() => keychains.updateSingleKeychainPassword({oldPassword: '1234', newPassword: 5678}))
        .should.throw('expected new password to be a string');

        (() => keychains.updateSingleKeychainPassword({oldPassword: '1234', newPassword: '5678'}))
        .should.throw('expected keychain to be an object with an encryptedPrv property');

        (() => keychains.updateSingleKeychainPassword({oldPassword: '1234', newPassword: '5678', keychain: {}}))
        .should.throw('expected keychain to be an object with an encryptedPrv property');

        (() => keychains.updateSingleKeychainPassword({
          oldPassword: '1234',
          newPassword: '5678',
          keychain: {encryptedPrv: 123}
        }))
        .should.throw('expected keychain to be an object with an encryptedPrv property');

        const keychain = {encryptedPrv: bitgo.encrypt({input: 'xprv1', password: otherPassword})};
        (() => keychains.updateSingleKeychainPassword({oldPassword, newPassword, keychain}))
        .should.throw('password used to decrypt keychain private key is incorrect');
      }));

      it('on any other error', co(function* coItFail() {
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({input: 'xprv1', password: oldPassword})
              }
            ]
          });

        sandbox.stub(keychains, 'updateSingleKeychainPassword').throws('error', 'some random error');

        yield keychains.updatePassword({oldPassword, newPassword})
        .should.be.rejectedWith('some random error');
      }));
    });

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
      nock.pendingMocks().should.be.empty();
    });
  });
});
