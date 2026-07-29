import * as assert from 'assert';
import 'should';
import 'should-http';
import { setupAgent } from '../../lib/testutil';

describe('Validation Error Messages', function () {
  const agent = setupAgent();
  const walletId = '68c02f96aa757d9212bd1a536f123456';
  const coin = 'tbtc';

  describe('error formatting', function () {
    it('should return readable error for missing required field', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({ amount: 1000000 });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error.includes('address'), 'Error should mention missing field');
    });

    it('should return readable error for invalid type', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({ address: 12345, amount: 1000000 });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error.includes('address'), 'Error should mention field name');
      assert.ok(result.body.error.includes('string'), 'Error should mention expected type');
    });

    it('should return readable error for nested object', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1000000000000000000',
          memo: { value: 'test' }, // missing required 'type' field
        });

      assert.strictEqual(result.status, 400);
      assert.ok(
        result.body.error.includes('memo') || result.body.error.includes('type'),
        'Error should mention nested field'
      );
    });

    it('should return readable error for array element', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({
          recipients: [{ address: 'addr1' }],
          walletPassphrase: 'test',
        });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error.includes('amount'), 'Error should mention array element field');
    });

    it('should return readable error for multiple missing fields', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({});

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error.includes('address'), 'Error should mention address');
      assert.ok(result.body.error.includes('amount'), 'Error should mention amount');
    });
  });

  describe('error format', function () {
    it('should not include raw type schema syntax', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({});

      assert.strictEqual(result.status, 400);
      assert.ok(!result.body.error.includes('Exact<'), 'Should not contain Exact<');
      assert.ok(!result.body.error.includes('Partial<'), 'Should not contain Partial<');
      assert.ok(!result.body.error.includes('httpRequest'), 'Should not contain httpRequest');
    });

    it('should return standard BitGo Express error format', async function () {
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token')
        .set('Content-Type', 'application/json')
        .send({});

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error, 'Response should have error property');
      assert.ok(result.body.message, 'Response should have message property');
      assert.strictEqual(result.body.name, 'ValidationError', 'name should be ValidationError');
      assert.ok(result.body.bitgoJsVersion, 'Response should have bitgoJsVersion');
      assert.ok(result.body.bitgoExpressVersion, 'Response should have bitgoExpressVersion');
      assert.strictEqual(result.body.error, result.body.message, 'error and message should match');
    });
  });
});
