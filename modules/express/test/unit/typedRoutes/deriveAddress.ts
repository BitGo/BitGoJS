import * as assert from 'assert';
import * as t from 'io-ts';
import {
  DeriveAddressBody,
  DeriveAddressParams,
  DeriveAddressResponse,
  DeriveAddressKeychainCodec,
  PostDeriveAddress,
} from '../../../src/typedRoutes/api/v2/deriveAddress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('DeriveAddress codec tests', function () {
  const commonKeychain =
    '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e';

  describe('DeriveAddressKeychainCodec', function () {
    it('should validate a keychain with pub only (BIP32 multisig)', function () {
      const decoded = assertDecode(DeriveAddressKeychainCodec, { pub: 'xpub1...' });
      assert.strictEqual((decoded as { pub: string }).pub, 'xpub1...');
    });

    it('should validate a keychain with commonKeychain only (TSS/MPC)', function () {
      const decoded = assertDecode(DeriveAddressKeychainCodec, { commonKeychain });
      assert.strictEqual((decoded as { commonKeychain: string }).commonKeychain, commonKeychain);
    });

    it('should validate a keychain carrying both pub and commonKeychain (TSS keychains commonly do)', function () {
      const decoded = assertDecode(DeriveAddressKeychainCodec, { pub: 'user_pub', commonKeychain });
      assert.strictEqual((decoded as { pub: string }).pub, 'user_pub');
    });

    it('should reject a keychain with neither pub nor commonKeychain', function () {
      assert.throws(() => {
        assertDecode(DeriveAddressKeychainCodec, { ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d' });
      });
    });
  });

  describe('DeriveAddressParams', function () {
    it('should validate params with coin', function () {
      const decoded = assertDecode(t.type(DeriveAddressParams), { coin: 'btc' });
      assert.strictEqual(decoded.coin, 'btc');
    });

    it('should reject params with missing coin', function () {
      assert.throws(() => {
        assertDecode(t.type(DeriveAddressParams), {});
      });
    });
  });

  describe('DeriveAddressBody', function () {
    it('should validate body with the minimum required fields (keychains and index)', function () {
      const validBody = {
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        index: 42,
      };

      const decoded = assertDecode(t.type(DeriveAddressBody), validBody);
      assert.strictEqual(decoded.keychains.length, 3);
      assert.strictEqual(decoded.index, 42);
    });

    it('should validate a UTXO body with chain and format', function () {
      const validBody = {
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        index: 0,
        chain: 20,
        format: 'base58',
      };

      const decoded = assertDecode(t.type(DeriveAddressBody), validBody);
      assert.strictEqual(decoded.chain, 20);
      assert.strictEqual(decoded.format, 'base58');
    });

    it('should validate a TSS/MPC body with commonKeychain and SMC seed', function () {
      const validBody = {
        keychains: [{ commonKeychain }, { commonKeychain }, { commonKeychain }],
        index: 7,
        walletVersion: 6,
        derivedFromParentWithSeed: 'my-unique-smc-seed-123',
      };

      const decoded = assertDecode(t.type(DeriveAddressBody), validBody);
      assert.strictEqual(decoded.walletVersion, 6);
      assert.strictEqual(decoded.derivedFromParentWithSeed, 'my-unique-smc-seed-123');
    });

    it('should validate an EVM legacy-forwarder body with baseAddress and coinSpecific', function () {
      const validBody = {
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        index: 117,
        walletVersion: 5,
        baseAddress: '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11',
        coinSpecific: { forwarderVersion: 4, feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09' },
      };

      const decoded = assertDecode(t.type(DeriveAddressBody), validBody);
      assert.strictEqual(decoded.baseAddress, validBody.baseAddress);
      assert.strictEqual(decoded.coinSpecific?.forwarderVersion, 4);
      assert.strictEqual(decoded.coinSpecific?.feeAddress, validBody.coinSpecific.feeAddress);
    });

    it('should reject body with missing index', function () {
      assert.throws(() => {
        assertDecode(t.type(DeriveAddressBody), { keychains: [{ pub: 'xpub1...' }] });
      });
    });

    it('should reject body with missing keychains', function () {
      assert.throws(() => {
        assertDecode(t.type(DeriveAddressBody), { index: 0 });
      });
    });

    it('should reject body with a non-numeric index', function () {
      assert.throws(() => {
        assertDecode(t.type(DeriveAddressBody), { keychains: [{ pub: 'xpub1...' }], index: '0' });
      });
    });

    it('should reject body with non-array keychains', function () {
      assert.throws(() => {
        assertDecode(t.type(DeriveAddressBody), { keychains: 'not-an-array', index: 0 });
      });
    });
  });

  describe('DeriveAddressResponse', function () {
    it('should validate a 200 response with the minimum fields', function () {
      const decoded = assertDecode(DeriveAddressResponse[200], { address: 'bc1qxyz', index: 0 });
      assert.strictEqual(decoded.address, 'bc1qxyz');
      assert.strictEqual(decoded.index, 0);
    });

    it('should validate a 200 response with chain, coinSpecific and derivationPath', function () {
      const decoded = assertDecode(DeriveAddressResponse[200], {
        address: 'bc1qxyz',
        index: 42,
        chain: 20,
        coinSpecific: { witnessScript: '00...' },
        derivationPath: 'm/42',
      });
      assert.strictEqual(decoded.derivationPath, 'm/42');
    });

    it('should reject a 200 response missing the address', function () {
      assert.throws(() => {
        assertDecode(DeriveAddressResponse[200], { index: 0 });
      });
    });
  });

  describe('PostDeriveAddress route definition', function () {
    it('should have the correct path (no wallet id — operates on body only)', function () {
      assert.strictEqual(PostDeriveAddress.path, '/api/v2/{coin}/address/derive');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostDeriveAddress.method, 'POST');
    });

    it('should have the correct response types', function () {
      assert.ok(PostDeriveAddress.response[200]);
      assert.ok(PostDeriveAddress.response[400]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should derive a UTXO address from keychains + chain/index (no wallet lookup)', async function () {
      const requestBody = {
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        chain: 20,
        index: 42,
      };

      const deriveAddressStub = sinon.stub().resolves({
        address: 'bc1qderivedaddress',
        chain: 20,
        index: 42,
        derivationPath: 'm/42',
      });
      // Note: the handler calls coin.deriveAddress directly — there is no wallets().get,
      // so the mock coin intentionally exposes no wallets() method.
      const mockCoin = { deriveAddress: deriveAddressStub };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/btc/address/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, 'bc1qderivedaddress');
      assert.strictEqual(result.body.index, 42);

      sinon.assert.calledOnce(deriveAddressStub);
      const callArgs = deriveAddressStub.firstCall.args[0];
      assert.strictEqual(callArgs.index, 42);
      assert.strictEqual(callArgs.chain, 20);
    });

    it('should derive a TSS/MPC address and pass derivedFromParentWithSeed through', async function () {
      const requestBody = {
        keychains: [{ commonKeychain }, { commonKeychain }, { commonKeychain }],
        index: 1,
        derivedFromParentWithSeed: 'smc-seed-abc',
      };

      const deriveAddressStub = sinon.stub().resolves({
        address: '7YAesfwPk41VChUgr65bm8FEep7ymWqLSW5rpYB5zZPY',
        index: 1,
        derivationPath: 'm/999999/0/0/1',
      });
      const mockCoin = { deriveAddress: deriveAddressStub };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/sol/address/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.address, '7YAesfwPk41VChUgr65bm8FEep7ymWqLSW5rpYB5zZPY');

      sinon.assert.calledOnce(deriveAddressStub);
      const callArgs = deriveAddressStub.firstCall.args[0];
      assert.strictEqual(callArgs.derivedFromParentWithSeed, 'smc-seed-abc');
    });

    it('should return 400 for missing index', async function () {
      const result = await agent
        .post('/api/v2/btc/address/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send({ keychains: [{ pub: 'xpub1...' }] });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
    });

    it('should return 400 for missing keychains', async function () {
      const result = await agent
        .post('/api/v2/btc/address/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send({ index: 0 });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
    });

    it('should surface derivation errors (coin.deriveAddress throws)', async function () {
      const deriveAddressStub = sinon.stub().rejects(new Error('deriveAddress is not supported for this coin'));
      const mockCoin = { deriveAddress: deriveAddressStub };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/xrp/address/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send({ keychains: [{ commonKeychain }], index: 0 });

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
