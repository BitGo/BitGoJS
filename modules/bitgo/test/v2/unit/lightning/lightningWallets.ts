import * as assert from 'assert';
import { TestBitGo } from '@bitgo/sdk-test';
import * as nock from 'nock';
import { BaseCoin, getLightningAuthKeychains, getLightningKeychain } from '@bitgo/sdk-core';

import { BitGo, common, GenerateLightningWalletOptions, Wallet, Wallets } from '../../../../src';

describe('Lightning wallets', function () {
  const coinName = 'tlnbtc';
  const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
  let basecoin: BaseCoin;
  let wallets: Wallets;
  let bgUrl: string;

  before(function () {
    bitgo.initializeTestVars();

    basecoin = bitgo.coin(coinName);
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
        .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId1' });
      nock(bgUrl)
        .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId2' });
      nock(bgUrl)
        .post('/api/v2/' + coinName + '/key', (body) => validateKeyRequest(body))
        .reply(200, { id: 'keyId3' });

      nock(bgUrl)
        .post('/api/v2/' + coinName + '/wallet', (body) => validateWalletRequest(body))
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

  describe('Get lightning key(s)', function () {
    const walletData = {
      id: 'fakeid',
      coin: coinName,
      keys: ['abc'],
      coinSpecific: { keys: ['def', 'ghi'] },
    };

    const userKeyData = {
      id: 'abc',
      pub: 'xpub1',
      encryptedPrv: 'encryptedPrv1',
      source: 'user',
    };

    const userAuthKeyData = {
      id: 'def',
      pub: 'xpub2',
      encryptedPrv: 'encryptedPrv2',
      source: 'user',
      coinSpecific: {
        tlnbtc: {
          purpose: 'userAuth',
        },
      },
    };

    const nodeAuthKeyData = {
      id: 'ghi',
      pub: 'xpub3',
      encryptedPrv: 'encryptedPrv3',
      source: 'user',
      coinSpecific: {
        tlnbtc: {
          purpose: 'nodeAuth',
        },
      },
    };

    it('should get lightning key', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      const keyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/abc')
        .reply(200, userKeyData);

      const key = await getLightningKeychain(wallet);
      assert.deepStrictEqual(key, userKeyData);
      keyNock.done();
    });

    it('should get lightning auth keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      const userAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, userAuthKeyData);
      const nodeAuthKeyNock = nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKeyData);

      const { userAuthKey, nodeAuthKey } = await getLightningAuthKeychains(wallet);
      assert.deepStrictEqual(userAuthKey, userAuthKeyData);
      assert.deepStrictEqual(nodeAuthKey, nodeAuthKeyData);
      userAuthKeyNock.done();
      nodeAuthKeyNock.done();
    });

    it('should fail to get lightning key for invalid coin', async function () {
      const wallet = new Wallet(bitgo, bitgo.coin('tltc'), walletData);
      await assert.rejects(
        async () => await getLightningKeychain(wallet),
        /Error: Invalid coin to get lightning Keychain: ltc/
      );
    });

    it('should fail to get lightning auth keys for invalid coin', async function () {
      const wallet = new Wallet(bitgo, bitgo.coin('tltc'), walletData);
      await assert.rejects(
        async () => await getLightningAuthKeychains(wallet),
        /Error: Invalid coin to get lightning auth keychains: ltc/
      );
    });

    it('should fail to get lightning key for invalid number of keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, { ...walletData, keys: [] });
      await assert.rejects(
        async () => await getLightningKeychain(wallet),
        /Error: Invalid number of key in lightning wallet: 0/
      );
    });

    it('should fail to get lightning auth keys for invalid number of keys', async function () {
      const wallet = new Wallet(bitgo, basecoin, { ...walletData, coinSpecific: { keys: ['def'] } });
      await assert.rejects(
        async () => await getLightningAuthKeychains(wallet),
        /Error: Invalid number of auth keys in lightning wallet: 1/
      );
    });

    it('should fail to get lightning key for invalid response', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/abc')
        .reply(200, { ...userKeyData, source: 'backup' });

      await assert.rejects(async () => await getLightningKeychain(wallet), /Error: Invalid user key/);
    });

    it('should fail to get lightning auth keys for invalid response', async function () {
      const wallet = new Wallet(bitgo, basecoin, walletData);

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/def')
        .reply(200, { ...userAuthKeyData, source: 'backup' });

      nock(bgUrl)
        .get('/api/v2/' + coinName + '/key/ghi')
        .reply(200, nodeAuthKeyData);

      await assert.rejects(
        async () => await getLightningAuthKeychains(wallet),
        /Error: Invalid lightning auth key: def/
      );
    });
  });
});
