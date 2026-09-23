//
// Test for Keychains
//

import 'should';
import nock = require('nock');

import { common } from '@bitgo/sdk-core';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../src/bitgo';

describe('Keychains', function v2keychains() {
  describe('Update Password', function updatePassword() {
    let bitgo;
    let keychains;
    let bgUrl;

    before(function beforeDescribe() {
      nock.pendingMocks().should.be.empty();

      bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      bitgo.initializeTestVars();
      bitgo.setValidate(false);
      keychains = bitgo.keychains();

      bgUrl = common.Environments[bitgo.getEnv()].uri;
    });

    it('should fail to update the password', async function () {
      await keychains.updatePassword({ newPassword: '5678' }).should.be.rejectedWith('Missing parameter: oldPassword');

      await keychains
        .updatePassword({ oldPassword: 1234, newPassword: '5678' })
        .should.be.rejectedWith('Expecting parameter string: oldPassword but found number');

      await keychains.updatePassword({ oldPassword: '1234' }).should.be.rejectedWith('Missing parameter: newPassword');

      await keychains
        .updatePassword({ oldPassword: '1234', newPassword: 5678 })
        .should.be.rejectedWith('Expecting parameter string: newPassword but found number');
    });

    it('successful password update', async function () {
      const oldPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const otherPassword = 'otherPassword';

      const encryptedXprv1 = await bitgo.encrypt({ input: 'xprv1', password: oldPassword });
      const encryptedXprv2 = await bitgo.encrypt({ input: 'xprv2', password: otherPassword });

      nock(bgUrl)
        .post('/api/v1/user/encrypted')
        .reply(200, {
          keychains: {
            xpub1: encryptedXprv1,
            xpub2: encryptedXprv2,
          },
          version: 1,
        });

      const result = await keychains.updatePassword({ oldPassword: oldPassword, newPassword: newPassword });
      for (const [xpub, encryptedXprv] of Object.entries(result.keychains as Record<string, string>)) {
        xpub.should.startWith('xpub');
        try {
          const decryptedPrv = await bitgo.decrypt({ input: encryptedXprv, password: newPassword });
          decryptedPrv.should.startWith('xprv');
        } catch (e) {
          // the decryption didn't work because of the wrong password, this is one of the keychains that didn't match
          // the old password
          e.message.should.equal('incorrect password');
        }
      }
      result.should.hasOwnProperty('version');
    });

    it('should emit progressCallback outcomes for updated and skipped keychains', async function () {
      const oldPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const otherPassword = 'otherPassword';

      const encryptedXprv1 = await bitgo.encrypt({ input: 'xprv1', password: oldPassword });
      const encryptedXprv2 = await bitgo.encrypt({ input: 'xprv2', password: otherPassword });

      nock(bgUrl)
        .post('/api/v1/user/encrypted')
        .reply(200, {
          keychains: {
            xpub1: encryptedXprv1,
            xpub2: encryptedXprv2,
          },
          version: 1,
        });

      const events: Array<{ status: string; currentKeychainId?: string }> = [];
      await keychains.updatePassword({
        oldPassword,
        newPassword,
        progressCallback: (progress) => events.push(progress),
      });

      events.should.have.length(2);
      events.should.containEql({ status: 'updated', currentKeychainId: 'xpub1' });
      events.should.containEql({ status: 'skipped', currentKeychainId: 'xpub2' });
    });

    it('should not let a throwing progressCallback affect the rotation result', async function () {
      const oldPassword = 'oldPassword';
      const newPassword = 'newPassword';

      const encryptedXprv1 = await bitgo.encrypt({ input: 'xprv1', password: oldPassword });

      nock(bgUrl)
        .post('/api/v1/user/encrypted')
        .reply(200, {
          keychains: {
            xpub1: encryptedXprv1,
          },
          version: 1,
        });

      const result = await keychains.updatePassword({
        oldPassword,
        newPassword,
        progressCallback: () => {
          throw new Error('observer boom');
        },
      });

      const decryptedPrv = await bitgo.decrypt({ input: result.keychains.xpub1, password: newPassword });
      decryptedPrv.should.equal('xprv1');
    });
  });

  after(function afterKeychains() {
    nock.pendingMocks().should.be.empty();
  });
});
