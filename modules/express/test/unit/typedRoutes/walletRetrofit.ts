import * as assert from 'assert';
import * as t from 'io-ts';
import * as _ from 'lodash';
import {
  PostWalletRetrofit,
  WalletRetrofitBody,
  WalletRetrofitParams,
  WalletRetrofitResponse,
} from '../../../src/typedRoutes/api/v2/walletRetrofit';
import { assertDecode } from './common';

describe('Wallet retrofit codec tests', function () {
  const validBody = {
    otp: '123456',
    passphrase: 'correct horse battery staple',
    enterprise: '5b9a66e27125f52a837cf5a09b80c9d4',
    encryptedMaterial: {
      encryptedUserKey: '{"iv":"aGFs","v":2}',
      encryptedBackupKey: '{"iv":"c2Ft","v":2}',
      encryptedWalletPassphrase: '{"iv":"d2F0","v":2}',
    },
  };

  describe('WalletRetrofitParams', function () {
    it('should validate params with coin and wallet id', function () {
      const params = assertDecode(t.type(WalletRetrofitParams), { coin: 'tsol', id: '5c24d47f5eaec9d70ccbd5c1' });
      assert.strictEqual(params.coin, 'tsol');
      assert.strictEqual(params.id, '5c24d47f5eaec9d70ccbd5c1');
    });

    it('should reject params with missing coin', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitParams), { id: '5c24d47f5eaec9d70ccbd5c1' }));
    });

    it('should reject params with missing id', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitParams), { coin: 'tsol' }));
    });
  });

  describe('WalletRetrofitBody', function () {
    it('should validate body with all required fields', function () {
      const body = assertDecode(t.type(WalletRetrofitBody), validBody);
      assert.strictEqual(body.otp, validBody.otp);
      assert.strictEqual(body.passphrase, validBody.passphrase);
      assert.strictEqual(body.enterprise, validBody.enterprise);
      assert.deepStrictEqual(body.encryptedMaterial, validBody.encryptedMaterial);
    });

    it('should reject body with missing otp', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), _.omit(validBody, 'otp')));
    });

    it('should accept body with originalPasscodeEncryptionCode', function () {
      const body = {
        ...validBody,
        originalPasscodeEncryptionCode: '483921',
      };
      const decoded = assertDecode(t.type(WalletRetrofitBody), body);
      assert.strictEqual(decoded.originalPasscodeEncryptionCode, '483921');
    });

    it('should reject body with missing passphrase', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), _.omit(validBody, 'passphrase')));
    });

    it('should reject body with missing enterprise', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), _.omit(validBody, 'enterprise')));
    });

    it('should reject body with missing encryptedMaterial', function () {
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), _.omit(validBody, 'encryptedMaterial')));
    });

    it('should reject body with encryptedMaterial missing encryptedUserKey', function () {
      const encryptedMaterial = _.omit(validBody.encryptedMaterial, 'encryptedUserKey');
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), { ...validBody, encryptedMaterial }));
    });

    it('should reject body with encryptedMaterial missing encryptedBackupKey', function () {
      const encryptedMaterial = _.omit(validBody.encryptedMaterial, 'encryptedBackupKey');
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), { ...validBody, encryptedMaterial }));
    });

    it('should reject body with encryptedMaterial missing encryptedWalletPassphrase', function () {
      const encryptedMaterial = _.omit(validBody.encryptedMaterial, 'encryptedWalletPassphrase');
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), { ...validBody, encryptedMaterial }));
    });

    it('should reject body with non-string encryptedUserKey', function () {
      const body = {
        ...validBody,
        encryptedMaterial: { ...validBody.encryptedMaterial, encryptedUserKey: 123 },
      };
      assert.throws(() => assertDecode(t.type(WalletRetrofitBody), body));
    });
  });

  describe('PostWalletRetrofit route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletRetrofit.path, '/api/v2/{coin}/wallet/{id}/retrofit');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletRetrofit.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostWalletRetrofit.request);
    });

    it('should have the correct response types', function () {
      assert.ok(WalletRetrofitResponse[200]);
      assert.ok(WalletRetrofitResponse[400]);
    });
  });
});
