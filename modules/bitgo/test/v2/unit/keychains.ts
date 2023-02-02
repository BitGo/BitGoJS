//
// Test for Keychains
//

import { CoinKind, coins, KeyCurve, CoinFamily, UnderlyingAsset } from '@bitgo/statics';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as should from 'should';
import * as sinon from 'sinon';

import { BlsUtils, common, ECDSAUtils, EDDSAUtils, KeychainsTriplet } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';

describe('V2 Keychains', function () {
  let bitgo;
  let basecoin;
  let keychains;
  let bgUrl;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.setValidate(false);
    basecoin = bitgo.coin('tltc');
    keychains = basecoin.keychains();

    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  describe('Add Keychain', function () {
    it('should add a keychain', async function () {
      const scope = nock(bgUrl)
        .post('/api/v2/tltc/key', function (body) {
          body.pub.should.equal('pub');
          body.derivedFromParentWithSeed.should.equal('derivedFromParentWithSeed');
          return true;
        })
        .reply(200, {});
      await keychains.add({ pub: 'pub', derivedFromParentWithSeed: 'derivedFromParentWithSeed' });
      scope.done();
    });
  });

  /**
   * This section's intention is to provide some key generation sanity checking. generateKeyPair is a general surface
   * for key generation but the keys are treated the same by BitGo down the line. Any SECP256K1 based coins key-pairs can
   * be re-used so need to be the same.
   **/
  describe('Key generation enforcement for SECP256K1', function () {
    // iterate over non-fiat crypto secp coins
    const coinFamilyValues = Object.keys(CoinFamily).map(n => n.toLowerCase());
    const cryptoSecpCoins = coins.filter(n => n.primaryKeyCurve === KeyCurve.Secp256k1
      && n.kind === CoinKind.CRYPTO
      && n.asset !== UnderlyingAsset.USD
      && n.asset !== UnderlyingAsset.AVAXP
      && n.asset !== UnderlyingAsset.DOGE
      && n.asset !== UnderlyingAsset.ATOM  // ToDo(BG-64363) remove flag after adding coin specific module
      && n.asset !== UnderlyingAsset.ETHW
      && coinFamilyValues.includes(n.name));

    const expectedXpub = 'xpub661MyMwAqRbcGpZf8mxNWhSPdWaLGvQzzage6vq2oQFzq8toVzmkjygYZ3HcZw6eCzAfn9ZdyGjKoKkcpKwackdgznVbiunpq7rkxDu7quS';
    const expectedXprv = 'xprv9s21ZrQH143K4LVC2kRN9ZVf5UjqsTh9dMm3JYRRF4j1xLZexTTWCBN4hmdZUHeT3vCJPL181ErVaY489ArBKSWaB7Du7vyVS6XC43WtK7A';

    const seed = Buffer.from('this is some random seed we will use', 'utf-8');

    cryptoSecpCoins.forEach((coin) => {
      it(`should create the same ${coin.name} key with the same seed`, function () {
        const currentCoin = bitgo.coin(coin.name);
        const keyPair = currentCoin.generateKeyPair(seed);

        should.exist(keyPair.pub);
        should.exist(keyPair.prv);

        keyPair.pub.should.equal(expectedXpub);
        keyPair.prv.should.equal(expectedXprv);
      });
    });
  });

  describe('Update Password', function () {

    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const otherPassword = 'otherPassword';

    describe('should fail', function () {
      let sandbox;
      beforeEach(function () {
        sandbox = sinon.createSandbox();
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('to update the password', async function () {
        await keychains.updatePassword({ newPassword: '5678' })
          .should.be.rejectedWith('Missing parameter: oldPassword');

        await keychains.updatePassword({ oldPassword: 1234, newPassword: '5678' })
          .should.be.rejectedWith('Expecting parameter string: oldPassword but found number');

        await keychains.updatePassword({ oldPassword: '1234' })
          .should.be.rejectedWith('Missing parameter: newPassword');

        await keychains.updatePassword({ oldPassword: '1234', newPassword: 5678 })
          .should.be.rejectedWith('Expecting parameter string: newPassword but found number');
      });

      it('to update the password for a single keychain', function () {
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

        (() => keychains.updateSingleKeychainPassword({
          oldPassword: '1234',
          newPassword: '5678',
          keychain: { encryptedPrv: 123 },
        }))
          .should.throw('expected keychain to be an object with an encryptedPrv property');

        const keychain = { encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: otherPassword }) };
        (() => keychains.updateSingleKeychainPassword({ oldPassword, newPassword, keychain }))
          .should.throw('password used to decrypt keychain private key is incorrect');
      });

      it('on any other error', async function () {
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
            ],
          });

        sandbox.stub(keychains, 'updateSingleKeychainPassword').throws('error', 'some random error');

        await keychains.updatePassword({ oldPassword, newPassword })
          .should.be.rejectedWith('some random error');
      });
    });

    describe('successful password update', function () {
      const validateKeys = function (keys, newPassword) {
        _.each(keys, function (encryptedPrv, pub) {
          pub.should.startWith('xpub');
          const decryptedPrv = bitgo.decrypt({ input: encryptedPrv, password: newPassword });
          decryptedPrv.should.startWith('xprv');
        });
      };

      it('receive only one page when listing keychains', async function () {
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
              {
                pub: 'xpub2',
                encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword }),
              },
            ],
          });

        const keys = await keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      });

      it('receive multiple pages when listing keychains', async function () {
        const prevId = 'prevId';
        nock(bgUrl)
          .get('/api/v2/tltc/key')
          .query(true)
          .reply(200, {
            nextBatchPrevId: prevId,
            keys: [
              {
                pub: 'xpub1',
                encryptedPrv: bitgo.encrypt({ input: 'xprv1', password: oldPassword }),
              },
              {
                pub: 'xpub2',
                encryptedPrv: bitgo.encrypt({ input: 'xprv2', password: otherPassword }),
              },
            ],
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
                encryptedPrv: bitgo.encrypt({ input: 'xprv3', password: oldPassword }),
              },
              {
                pub: 'xpub4',
                encryptedPrv: bitgo.encrypt({ input: 'xprv4', password: otherPassword }),
              },
            ],
          });

        const keys = await keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
        validateKeys(keys, newPassword);
      });

      it('single keychain password update', () => {
        const prv = 'xprvtest';
        const keychain = {
          xpub: 'xpub123',
          encryptedPrv: bitgo.encrypt({ input: prv, password: oldPassword }),
        };

        const newKeychain = keychains.updateSingleKeychainPassword({ keychain, oldPassword, newPassword });

        const decryptedPrv = bitgo.decrypt({ input: newKeychain.encryptedPrv, password: newPassword });
        decryptedPrv.should.equal(prv);
      });
    });

    describe('Create TSS Keychains', function() {
      const stubbedKeychainsTriplet = {
        userKeychain: {
          id: '1',
          pub: 'userPub',
        },
        backupKeychain: {
          id: '2',
          pub: 'userPub',
        },
        bitgoKeychain: {
          id: '3',
          pub: 'userPub',
        },
      };

      let sandbox;
      beforeEach(function () {
        sandbox = sinon.createSandbox();
      });

      afterEach(function () {
        sandbox.restore();
      });

      ['tsol', 'tdot', 'tnear'].forEach((coin) => {
        it('should create EDDSA TSS Keychains', async function () {
          sandbox.stub(EDDSAUtils.default.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
          const keychains = await bitgo.coin(coin).keychains().createMpc({
            multisigType: 'tss',
            passphrase: 'password',
            enterprise: 'enterprise',
            originalPasscodeEncryptionCode: 'originalPasscodeEncryptionCode',
          });
          keychains.should.deepEqual(stubbedKeychainsTriplet);
        });
      });

      ['tbsc'].forEach((coin) => {
        it('should create ECDSA TSS Keychains', async function () {
          sandbox.stub(ECDSAUtils.EcdsaUtils.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
          const keychains = await bitgo.coin(coin).keychains().createMpc({
            multisigType: 'tss',
            passphrase: 'password',
            enterprise: 'enterprise',
            originalPasscodeEncryptionCode: 'originalPasscodeEncryptionCode',
          });
          keychains.should.deepEqual(stubbedKeychainsTriplet);
        });
      });
    });

    describe('Create BLS-DKG Keychains', function() {
      it('should create BLS-DKG Keychains', async function () {
        const stubbedKeychainsTriplet: KeychainsTriplet = {
          userKeychain: {
            id: '1',
            pub: 'userPub',
            type: 'independent',
          },
          backupKeychain: {
            id: '2',
            pub: 'userPub',
            type: 'independent',
          },
          bitgoKeychain: {
            id: '3',
            pub: 'userPub',
            type: 'independent',
          },
        };
        sinon.stub(BlsUtils.prototype, 'createKeychains').resolves(stubbedKeychainsTriplet);
        const keychains = await bitgo.coin('eth2').keychains().createMpc({ multisigType: 'blsdkg', passphrase: 'password' });
        keychains.should.deepEqual(stubbedKeychainsTriplet);
      });
    });

    after(function afterUpdatePassword() {
      nock.pendingMocks().should.be.empty();
    });
  });
});
