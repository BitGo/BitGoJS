import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CanonicalAddressRequestParams,
  CanonicalAddressRequestBody,
  PostCanonicalAddress,
} from '../../../src/typedRoutes/api/v2/canonicalAddress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Canonical Address API Tests', function () {
  describe('Codec Validation Tests', function () {
    describe('CanonicalAddressRequestParams', function () {
      it('should validate valid params', function () {
        const validParams = {
          coin: 'bch',
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
      });

      it('should reject params with missing coin', function () {
        const invalidParams = {};

        assert.throws(() => {
          assertDecode(t.type(CanonicalAddressRequestParams), invalidParams);
        });
      });

      it('should validate testnet coins', function () {
        const validParams = {
          coin: 'tbch',
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestParams), validParams);
        assert.strictEqual(decoded.coin, 'tbch');
      });
    });

    describe('CanonicalAddressRequestBody', function () {
      it('should validate body with required address field', function () {
        const validBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.version, undefined);
        assert.strictEqual(decoded.scriptHashVersion, undefined);
      });

      it('should validate body with address and version', function () {
        const validBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58' as const,
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.version, 'base58');
      });

      it('should validate body with cashaddr version', function () {
        const validBody = {
          address: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
          version: 'cashaddr' as const,
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.version, 'cashaddr');
      });

      it('should validate body with deprecated scriptHashVersion', function () {
        const validBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          scriptHashVersion: 'base58' as const,
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.scriptHashVersion, 'base58');
      });

      it('should validate body with both version and scriptHashVersion', function () {
        const validBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'cashaddr' as const,
          scriptHashVersion: 'base58' as const,
        };

        const decoded = assertDecode(t.type(CanonicalAddressRequestBody), validBody);
        assert.strictEqual(decoded.version, 'cashaddr');
        assert.strictEqual(decoded.scriptHashVersion, 'base58');
      });

      it('should reject body with missing address', function () {
        const invalidBody = {
          version: 'base58',
        };

        assert.throws(() => {
          assertDecode(t.type(CanonicalAddressRequestBody), invalidBody);
        });
      });

      it('should reject body with invalid version value', function () {
        const invalidBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'invalid',
        };

        assert.throws(() => {
          assertDecode(t.type(CanonicalAddressRequestBody), invalidBody);
        });
      });

      it('should reject body with invalid scriptHashVersion value', function () {
        const invalidBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          scriptHashVersion: 'foo',
        };

        assert.throws(() => {
          assertDecode(t.type(CanonicalAddressRequestBody), invalidBody);
        });
      });

      it('should reject body with invalid address type', function () {
        assert.throws(() => assertDecode(t.type(CanonicalAddressRequestBody), { address: 123 }));
        assert.throws(() => assertDecode(t.type(CanonicalAddressRequestBody), { address: null }));
        assert.throws(() => assertDecode(t.type(CanonicalAddressRequestBody), { address: {} }));
      });

      it('should reject body with invalid version type', function () {
        assert.throws(() => assertDecode(t.type(CanonicalAddressRequestBody), { address: '1BpE...', version: 123 }));
        assert.throws(() => assertDecode(t.type(CanonicalAddressRequestBody), { address: '1BpE...', version: true }));
      });
    });

    describe('Response Validation', function () {
      it('should validate object response with address field', function () {
        const validResponse = {
          address: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
        };

        const responseCodec = t.type({ address: t.string });
        const decoded = assertDecode(responseCodec, validResponse);
        assert.strictEqual(decoded.address, validResponse.address);
        assert.strictEqual(typeof decoded.address, 'string');
      });

      it('should validate base58 address response', function () {
        const validResponse = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const responseCodec = t.type({ address: t.string });
        const decoded = assertDecode(responseCodec, validResponse);
        assert.strictEqual(decoded.address, validResponse.address);
      });

      it('should validate cashaddr with prefix response', function () {
        const validResponse = {
          address: 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
        };

        const responseCodec = t.type({ address: t.string });
        const decoded = assertDecode(responseCodec, validResponse);
        assert.strictEqual(decoded.address, validResponse.address);
      });

      it('should reject response missing address field', function () {
        const responseCodec = t.type({ address: t.string });
        assert.throws(() => assertDecode(responseCodec, {}));
        assert.throws(() => assertDecode(responseCodec, { addr: 'test' }));
      });

      it('should reject response with non-string address', function () {
        const responseCodec = t.type({ address: t.string });
        assert.throws(() => assertDecode(responseCodec, { address: 123 }));
        assert.throws(() => assertDecode(responseCodec, { address: null }));
        assert.throws(() => assertDecode(responseCodec, { address: {} }));
      });
    });

    describe('Route Definition', function () {
      it('should have correct path and method', function () {
        assert.strictEqual(PostCanonicalAddress.path, '/api/v2/{coin}/canonicaladdress');
        assert.strictEqual(PostCanonicalAddress.method, 'POST');
      });

      it('should have correct response types', function () {
        assert.ok(PostCanonicalAddress.response[200]);
        assert.ok(PostCanonicalAddress.response[400]);
      });
    });
  });

  describe('Integration Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    describe('Success Cases - Bitcoin Cash (BCH)', function () {
      it('should convert BCH base58 address to cashaddr format', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        // Response is a JSON string primitive, so use result.text
        assert.strictEqual(result.text, 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');

        sinon.assert.calledOnce(mockCoin.canonicalAddress);
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[0], requestBody.address);
        assert.strictEqual(callArgs[1], 'cashaddr');
      });

      it('should convert BCH cashaddr to base58 format', async function () {
        const requestBody = {
          address: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        // Response is a JSON string primitive, use result.text
        assert.strictEqual(result.text, '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu');

        sinon.assert.calledOnce(mockCoin.canonicalAddress);
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[0], requestBody.address);
        assert.strictEqual(callArgs[1], 'base58');
      });

      it('should use default base58 format when version not specified', async function () {
        const requestBody = {
          address: 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC');

        sinon.assert.calledOnce(mockCoin.canonicalAddress);
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[0], requestBody.address);
        assert.strictEqual(callArgs[1], undefined); // No version provided
      });

      it('should handle cashaddr without network prefix', async function () {
        const requestBody = {
          address: 'qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');
        // Verify prefix was added
        assert.ok(result.text.startsWith('bitcoincash:'));
      });

      it('should handle script recipient addresses', async function () {
        const requestBody = {
          address: 'scriptPubKey:76a914abc123',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('scriptPubKey:76a914abc123'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, 'scriptPubKey:76a914abc123');
      });

      it('should use scriptHashVersion as fallback when version not provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          scriptHashVersion: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');

        // Verify scriptHashVersion was used as fallback
        sinon.assert.calledOnce(mockCoin.canonicalAddress);
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[1], 'cashaddr'); // scriptHashVersion value
      });

      it('should prefer version over scriptHashVersion when both provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
          scriptHashVersion: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        // Verify version was used, not scriptHashVersion
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[1], 'base58'); // version value, not scriptHashVersion
      });
    });

    describe('Success Cases - Bitcoin SV (BSV)', function () {
      it('should convert BSV base58 address to cashaddr format', async function () {
        const requestBody = {
          address: '1ABC123def456',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bsv'),
          canonicalAddress: sinon.stub().returns('bitcoinsv:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bsv/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.ok(result.text.includes('bitcoinsv:') || result.text.length > 0);
      });

      it('should convert BSV cashaddr to base58 format', async function () {
        const requestBody = {
          address: 'bitcoinsv:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bsv'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bsv/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu');
      });
    });

    describe('Success Cases - Litecoin (LTC)', function () {
      it('should return LTC address unchanged with base58 version', async function () {
        const requestBody = {
          address: 'LTC1234567890abcdefghijk',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('LTC1234567890abcdefghijk'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, requestBody.address);
        // Verify LTC returns address unchanged
        assert.strictEqual(result.text, 'LTC1234567890abcdefghijk');
      });

      it('should return LTC address unchanged with cashaddr version (ignored)', async function () {
        const requestBody = {
          address: 'LTC1234567890abcdefghijk',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('LTC1234567890abcdefghijk'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        // LTC ignores version parameter
        assert.strictEqual(result.text, requestBody.address);
      });

      it('should return LTC address unchanged without version', async function () {
        const requestBody = {
          address: 'LTC1234567890abcdefghijk',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('LTC1234567890abcdefghijk'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, requestBody.address);
      });
    });

    describe('Success Cases - Testnet Coins', function () {
      it('should handle testnet BCH (TBCH)', async function () {
        const requestBody = {
          address: 'n3jYBjCzgGNydQwf83Hz6GBzGBhMkKfgL1',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bchtest:qremgr9dr9x5swv82k69qdjzrvdxgkaaesftdp5xla'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/tbch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.ok(result.text.startsWith('bchtest:'));
      });

      it('should handle testnet BSV (TBSV)', async function () {
        const requestBody = {
          address: '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bsv'),
          canonicalAddress: sinon.stub().returns('2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/tbsv/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X');
      });

      it('should handle testnet LTC (TLTC)', async function () {
        const requestBody = {
          address: 'mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/tltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.text, 'mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP');
      });
    });

    describe('Error Handling Tests', function () {
      it('should reject unsupported coin (BTC)', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('btc'), // Unsupported
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/btc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
        assert.ok(
          result.body.error.includes('only Litecoin/Bitcoin Cash/Bitcoin SV address canonicalization is supported')
        );
      });

      it('should reject unsupported coin (ETH)', async function () {
        const requestBody = {
          address: '0x1234567890abcdef',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('eth'), // Unsupported
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/eth/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should reject invalid version parameter', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'invalid',
        };

        // This should fail at codec validation level (400), not reach handler
        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Codec validation rejects invalid literal union values with 400
        assert.strictEqual(result.status, 400);
        // Codec validation errors return an array of error messages
        assert.ok(Array.isArray(result.body) || result.body.error);
      });

      it('should reject invalid address format', async function () {
        const requestBody = {
          address: 'invalid_address_123',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().throws(new Error('Invalid address format')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should reject missing address field', async function () {
        const requestBody = {
          version: 'base58',
        };

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail at codec validation level
        assert.ok(result.status >= 400);
      });

      it('should reject malformed cashaddr with mismatched data', async function () {
        const requestBody = {
          address: 'bitcoincash:yr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().throws(new Error('Invalid address encoding')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should reject address with improper prefix', async function () {
        const requestBody = {
          address: ':qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().throws(new Error('Invalid prefix')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Handler Logic Validation', function () {
      it('should call canonicalAddress with correct arguments', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        sinon.assert.calledOnce(mockCoin.canonicalAddress);
        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        // Verify exact arguments passed to canonicalAddress
        assert.strictEqual(callArgs.length, 2);
        assert.strictEqual(callArgs[0], '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'); // address
        assert.strictEqual(callArgs[1], 'cashaddr'); // version
      });

      it('should pass undefined version when not provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        assert.strictEqual(callArgs[1], undefined); // No version parameter
      });

      it('should validate coin family before calling canonicalAddress', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('btc'),
          canonicalAddress: sinon.stub().returns('should not be called'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/btc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should throw error before calling canonicalAddress
        sinon.assert.calledOnce(mockCoin.getFamily);
        sinon.assert.notCalled(mockCoin.canonicalAddress); // Should NOT be called
      });

      it('should call getFamily to validate coin support', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify coin family check is performed
        sinon.assert.calledOnce(mockCoin.getFamily);
      });
    });

    describe('Edge Cases', function () {
      it('should handle P2SH addresses (base58 starting with 3)', async function () {
        const requestBody = {
          address: '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.ok(result.text.startsWith('bitcoincash:p')); // P2SH cashaddr starts with 'p'
      });

      it('should handle P2PKH addresses (base58 starting with 1)', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.ok(result.text.startsWith('bitcoincash:q')); // P2PKH cashaddr starts with 'q'
      });

      it('should handle addresses with all uppercase (BCH accepts case-insensitive)', async function () {
        const requestBody = {
          address: 'BITCOINCASH:QPM2QSZNHKS23Z7629MMS6S4CWEF74VCWVY22GDX6A',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.ok(result.text); // String response
        assert.strictEqual(result.text, '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu');
      });
    });

    describe('Response Type Validation', function () {
      it('should always return string type for BCH', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        // String response is in result.text (JSON primitive)
        assert.ok(result.text);
        assert.strictEqual(typeof result.text, 'string');
        assert.ok(result.text.length > 0);
      });

      it('should always return string type for BSV', async function () {
        const requestBody = {
          address: '1ABC123',
          version: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bsv'),
          canonicalAddress: sinon.stub().returns('bitcoinsv:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bsv/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(typeof result.text, 'string');
        assert.strictEqual(result.text, 'bitcoinsv:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');
      });

      it('should always return string type for LTC', async function () {
        const requestBody = {
          address: 'LTC123456',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('LTC123456'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(typeof result.text, 'string');
        assert.strictEqual(result.text, 'LTC123456');
      });

      it('should return string as JSON primitive, not wrapped in object', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        // Response is JSON string primitive (not object)
        // String responses go to result.text, not result.body
        assert.strictEqual(result.text, '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu');
      });
    });

    describe('Parameter Fallback Logic', function () {
      it('should use version when both version and scriptHashVersion provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          version: 'base58',
          scriptHashVersion: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        // Handler uses: version || fallbackVersion
        // So version='base58' should be used, not scriptHashVersion='cashaddr'
        assert.strictEqual(callArgs[1], 'base58');
      });

      it('should use scriptHashVersion when version is not provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          scriptHashVersion: 'cashaddr',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        // Should use scriptHashVersion as fallback
        assert.strictEqual(callArgs[1], 'cashaddr');
      });

      it('should pass undefined when neither version nor scriptHashVersion provided', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        const callArgs = mockCoin.canonicalAddress.firstCall.args;
        // version || fallbackVersion where both are undefined → undefined
        assert.strictEqual(callArgs[1], undefined);
      });
    });

    describe('Coin Family Validation', function () {
      it('should accept bch family coin', async function () {
        const requestBody = {
          address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bch'),
          canonicalAddress: sinon.stub().returns('1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bch/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
      });

      it('should accept bsv family coin', async function () {
        const requestBody = {
          address: '1ABC123',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('bsv'),
          canonicalAddress: sinon.stub().returns('1ABC123'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/bsv/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
      });

      it('should accept ltc family coin', async function () {
        const requestBody = {
          address: 'LTC123',
        };

        const mockCoin = {
          getFamily: sinon.stub().returns('ltc'),
          canonicalAddress: sinon.stub().returns('LTC123'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ltc/canonicaladdress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
      });

      it('should reject non-supported family coins', async function () {
        const unsupportedCoins = ['btc', 'eth', 'algo', 'xlm', 'xrp', 'trx'];

        for (const coinFamily of unsupportedCoins) {
          const requestBody = {
            address: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
          };

          const mockCoin = {
            getFamily: sinon.stub().returns(coinFamily),
          };

          sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

          const result = await agent
            .post(`/api/v2/${coinFamily}/canonicaladdress`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send(requestBody);

          assert.ok(result.status >= 400);
          result.body.should.have.property('error');

          sinon.restore(); // Clean up for next iteration
        }
      });
    });
  });
});
