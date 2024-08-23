import * as assert from 'assert';
import { TestBitGo } from '@bitgo/sdk-test';
import * as nock from 'nock';

import { BitGo, common, GenerateLightningWalletOptions, Wallets } from '../../../../src';

describe('Lightning wallets', function () {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
  let wallets: Wallets;
  let bgUrl: string;

  before(function () {
    bitgo.initializeTestVars();

    const basecoin = bitgo.coin('tlnbtc');
    wallets = basecoin.wallets();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  after(function () {
    nock.cleanAll();
    nock.pendingMocks().length.should.equal(0);
  });

  describe('Generate lightning wallet', function () {
    it('should validate parameters', async function () {
      await wallets
        .generateWallet({
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.label, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.passphrase, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.enterprise, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 'ent123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value 'undefined' supplied to GenerateLightningWalletOptions.passcodeEncryptionCode, expected string."
        );

      await wallets
        .generateWallet({
          label: 123 as any,
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.label, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 123 as any,
          enterprise: 'ent123',
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.passphrase, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 123 as any,
          passcodeEncryptionCode: 'code123',
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.enterprise, expected string."
        );

      await wallets
        .generateWallet({
          label: 'my ln wallet',
          passphrase: 'pass123',
          enterprise: 'ent123',
          passcodeEncryptionCode: 123 as any,
        })
        .should.be.rejectedWith(
          "error(s) parsing generate lightning wallet request params: Invalid value '123' supplied to GenerateLightningWalletOptions.passcodeEncryptionCode, expected string."
        );
    });

    it('should generate wallet', async function () {
      const params: GenerateLightningWalletOptions = {
        label: 'my ln wallet',
        passphrase: 'pass123',
        enterprise: 'ent123',
        passcodeEncryptionCode: 'code123',
      };

      const validateKeyRequest = (body) => {
        const baseChecks =
          body.pub.startsWith('xpub') &&
          !!body.encryptedPrv &&
          body.keyType === 'independent' &&
          body.source === 'user';

        if (body.originalPasscodeEncryptionCode !== undefined) {
          return baseChecks && body.originalPasscodeEncryptionCode === 'code123' && body.coinSpecific === undefined;
        } else {
          const coinSpecific = body.coinSpecific && body.coinSpecific.tlnbtc;
          return baseChecks && !!coinSpecific && ['userAuth', 'nodeAuth'].includes(coinSpecific.purpose);
        }
      };

      const validateWalletRequest = (body) => {
        return (
          body.label === 'my ln wallet' &&
          body.m === 1 &&
          body.n === 1 &&
          body.type === 'hot' &&
          body.enterprise === 'ent123' &&
          Array.isArray(body.keys) &&
          body.keys.length === 1 &&
          body.keys[0] === 'keyId1' &&
          body.coinSpecific &&
          body.coinSpecific.tlnbtc &&
          Array.isArray(body.coinSpecific.tlnbtc.keys) &&
          body.coinSpecific.tlnbtc.keys.length === 2 &&
          body.coinSpecific.tlnbtc.keys.includes('keyId2') &&
          body.coinSpecific.tlnbtc.keys.includes('keyId3')
        );
      };

      nock(bgUrl)
        .post('/api/v2/tlnbtc/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId1' });
      nock(bgUrl)
        .post('/api/v2/tlnbtc/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId2' });
      nock(bgUrl)
        .post('/api/v2/tlnbtc/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId3' });

      nock(bgUrl)
        .post('/api/v2/tlnbtc/wallet', (body) => validateWalletRequest(body))
        .reply(200, { id: 'walletId' });

      const response = await wallets.generateWallet(params);

      assert.ok(response.wallet);
      assert.ok(response.encryptedWalletPassphrase);
      assert.equal(
        bitgo.decrypt({ input: response.encryptedWalletPassphrase, password: params.passcodeEncryptionCode }),
        params.passphrase
      );
    });
  });
});
