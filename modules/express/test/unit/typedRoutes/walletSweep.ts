import * as assert from 'assert';
import { SendManyResponse } from '../../../src/typedRoutes/api/v2/sendmany';
import { WalletSweepParams, WalletSweepBody } from '../../../src/typedRoutes/api/v2/walletSweep';
import { assertDecode } from './common';
import * as t from 'io-ts';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Wallet Sweep V2 codec tests', function () {
  // Helper to create a valid Transfer object for testing
  function createMockTransfer(overrides: any = {}): any {
    return {
      coin: 'tbtc',
      id: 'transfer-123',
      wallet: 'wallet-456',
      txid: 'txid-789',
      height: 700000,
      date: new Date().toISOString(),
      confirmations: 6,
      type: 'send',
      valueString: '10000000',
      state: 'confirmed',
      history: [{ action: 'created', date: new Date().toISOString() }],
      ...overrides,
    };
  }

  // Helper to assert response structure
  function assertSweepResponse(response: any) {
    assert.ok(!Array.isArray(response), 'Expected single transaction response, got array');
    return response;
  }

  describe('walletSweep v2', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    const mockSweepResponse = {
      status: 'signed',
      tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180969800000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully sweep wallet funds to destination address', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet with sweep method
      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      // Stub the wallets().get() chain
      const walletsGetStub = sinon.stub().resolves(mockWallet);

      // Create mock coin object
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      // For V2, bitgo.coin() is called with the coin parameter
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      result.body.should.have.property('txid');
      assert.strictEqual(result.body.status, mockSweepResponse.status);
      assert.strictEqual(result.body.tx, mockSweepResponse.tx);
      assert.strictEqual(result.body.txid, mockSweepResponse.txid);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSweepResponse.status);
      assert.strictEqual(decodedResponse.tx, mockSweepResponse.tx);
      assert.strictEqual(decodedResponse.txid, mockSweepResponse.txid);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsGetStub.calledOnce, true);
      assert.strictEqual(mockWallet.sweep.calledOnce, true);

      // Verify the sweep was called with correct parameters
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.walletPassphrase, requestBody.walletPassphrase);
    });

    it('should successfully sweep with UTXO fee parameters', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
        maxFeeRate: 100000,
        feeTxConfirmTarget: 3,
      };

      // Create mock wallet with sweep method
      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      // Stub the wallets().get() chain
      const walletsGetStub = sinon.stub().resolves(mockWallet);

      // Create mock coin object
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSweepResponse.status);

      // Verify that sweep was called with the correct UTXO fee parameters
      assert.strictEqual(mockWallet.sweep.calledOnce, true);
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.feeRate, 50000);
      assert.strictEqual(callArgs.maxFeeRate, 100000);
      assert.strictEqual(callArgs.feeTxConfirmTarget, 3);
    });

    it('should successfully sweep with allowPartialSweep option', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        xprv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
        allowPartialSweep: true,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify allowPartialSweep and xprv were passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.xprv, requestBody.xprv);
      assert.strictEqual(callArgs.allowPartialSweep, true);
    });

    it('should successfully sweep with txFormat parameter', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        txFormat: 'psbt' as const,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify txFormat was passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.txFormat, 'psbt');
    });

    it('should successfully sweep with OTP for 2FA', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        otp: '0000000',
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify OTP was passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.otp, '0000000');
    });

    it('should handle sweep response with transfer details', async function () {
      const transfer = createMockTransfer({
        id: 'transfer-sweep-123',
        type: 'send',
        value: 10000000,
        valueString: '10000000',
        fee: 5000,
        feeString: '5000',
      });

      const mockSweepResponseWithTransfer = {
        status: 'signed',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180969800000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        transfer: transfer,
      };

      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponseWithTransfer),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify transfer object is present and valid
      assert.ok(decodedResponse.transfer, 'Response should include transfer object');
      assert.strictEqual(decodedResponse.transfer.id, 'transfer-sweep-123');
      assert.strictEqual(decodedResponse.transfer.type, 'send');
      assert.strictEqual(decodedResponse.transfer.valueString, '10000000');
    });

    it('should handle sweep response with transfers array (main + fee transfer)', async function () {
      const mainTransfer = createMockTransfer({
        id: 'transfer-main-123',
        type: 'send',
        value: 10000000,
        valueString: '10000000',
        fee: 5000,
        feeString: '5000',
      });

      const feeTransfer = createMockTransfer({
        id: 'transfer-fee-456',
        type: 'fee',
        value: 0,
        valueString: '0',
        fee: 5000,
        feeString: '5000',
      });

      const mockSweepResponseWithTransfers = {
        status: 'signed',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180969800000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        transfer: mainTransfer,
        transfers: [mainTransfer, feeTransfer],
      };

      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponseWithTransfers),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify transfers array is present
      assert.ok(decodedResponse.transfers, 'Response should include transfers array');
      assert.strictEqual(Array.isArray(decodedResponse.transfers), true, 'transfers should be an array');
      assert.strictEqual(decodedResponse.transfers.length, 2, 'transfers should contain main + fee transfer');

      // Verify main transfer
      assert.strictEqual(decodedResponse.transfers[0].id, 'transfer-main-123');
      assert.strictEqual(decodedResponse.transfers[0].type, 'send');

      // Verify fee transfer
      assert.strictEqual(decodedResponse.transfers[1].id, 'transfer-fee-456');
      assert.strictEqual(decodedResponse.transfers[1].type, 'fee');
    });

    it('should sweep with all UTXO parameters combined', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
        maxFeeRate: 100000,
        feeTxConfirmTarget: 3,
        allowPartialSweep: true,
        txFormat: 'psbt-lite' as const,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify all UTXO parameters were passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.feeRate, 50000);
      assert.strictEqual(callArgs.maxFeeRate, 100000);
      assert.strictEqual(callArgs.feeTxConfirmTarget, 3);
      assert.strictEqual(callArgs.allowPartialSweep, true);
      assert.strictEqual(callArgs.txFormat, 'psbt-lite');
    });

    it('should handle error response (500)', async function () {
      const requestBody = {
        address: 'invalid-address',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().rejects(new Error('Invalid address')),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/{walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Handler has no try-catch, so errors return 500
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should use xprv as alternative to walletPassphrase', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        xprv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
        feeRate: 25000,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify xprv was passed instead of walletPassphrase
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.xprv, requestBody.xprv);
      assert.strictEqual(callArgs.walletPassphrase, undefined);
      assert.strictEqual(callArgs.feeRate, 25000);
    });

    it('should validate txFormat accepts legacy format', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        txFormat: 'legacy' as const,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify txFormat was passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.txFormat, 'legacy');
    });

    it('should validate txFormat accepts psbt-lite format', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        txFormat: 'psbt-lite' as const,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(mockSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify txFormat was passed correctly
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.txFormat, 'psbt-lite');
    });
  });

  describe('Request Validation', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    afterEach(function () {
      sinon.restore();
    });

    it('should require address field', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase_12345',
        // Missing address field
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should fail validation
      assert.strictEqual(result.status, 400);
    });

    it('should accept address as string', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().resolves({ status: 'signed', txid: 'abc123', tx: '0100' }),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(typeof callArgs.address, 'string');
    });

    it('should accept feeRate as number', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves({ status: 'signed', txid: 'abc123', tx: '0100' }),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(typeof callArgs.feeRate, 'number');
      assert.strictEqual(callArgs.feeRate, 50000);
    });

    it('should accept allowPartialSweep as boolean', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        allowPartialSweep: true,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves({ status: 'signed', txid: 'abc123', tx: '0100' }),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(typeof callArgs.allowPartialSweep, 'boolean');
      assert.strictEqual(callArgs.allowPartialSweep, true);
    });

    it('should reject invalid txFormat value', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        txFormat: 'invalid-format',
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should fail validation due to invalid txFormat
      assert.strictEqual(result.status, 400);
    });
  });

  describe('Response Codec Validation', function () {
    it('should decode valid sweep response', function () {
      const validResponse = {
        status: 'signed',
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180969800000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertDecode(SendManyResponse, validResponse);
      assert.strictEqual(decoded.status, 'signed');
      assert.strictEqual(decoded.txid, validResponse.txid);
      assert.strictEqual(decoded.tx, validResponse.tx);
    });

    it('should decode response with transfer object', function () {
      const validResponse = {
        status: 'signed',
        txid: 'abcdef1234567890',
        tx: '0100000001',
        transfer: {
          coin: 'tbtc',
          id: 'transfer-123',
          wallet: 'wallet-456',
          txid: 'txid-789',
          height: 700000,
          date: new Date().toISOString(),
          confirmations: 6,
          type: 'send',
          valueString: '10000000',
          state: 'confirmed',
          history: [{ action: 'created', date: new Date().toISOString() }],
        },
      };

      const decoded = assertDecode(SendManyResponse, validResponse);
      assert.ok(decoded.transfer);
      assert.strictEqual(decoded.transfer.id, 'transfer-123');
    });

    it('should decode response with transfers array', function () {
      const mainTransfer = {
        coin: 'tbtc',
        id: 'transfer-main',
        wallet: 'wallet-456',
        txid: 'txid-789',
        height: 700000,
        date: new Date().toISOString(),
        confirmations: 6,
        type: 'send',
        valueString: '10000000',
        state: 'confirmed',
        history: [{ action: 'created', date: new Date().toISOString() }],
      };

      const feeTransfer = {
        coin: 'tbtc',
        id: 'transfer-fee',
        wallet: 'wallet-456',
        txid: 'txid-789',
        height: 700000,
        date: new Date().toISOString(),
        confirmations: 6,
        type: 'fee',
        valueString: '0',
        state: 'confirmed',
        history: [{ action: 'created', date: new Date().toISOString() }],
      };

      const validResponse = {
        status: 'signed',
        txid: 'abcdef1234567890',
        tx: '0100000001',
        transfer: mainTransfer,
        transfers: [mainTransfer, feeTransfer],
      };

      const decoded = assertDecode(SendManyResponse, validResponse);
      assert.ok(decoded.transfers);
      assert.strictEqual(Array.isArray(decoded.transfers), true);
      assert.strictEqual(decoded.transfers.length, 2);
    });

    it('should decode minimal response', function () {
      const minimalResponse = {
        status: 'signed',
      };

      const decoded = assertDecode(SendManyResponse, minimalResponse);
      assert.strictEqual(decoded.status, 'signed');
    });

    it('should decode response with txRequest (TSS wallet)', function () {
      const tssResponse = {
        txRequest: {
          txRequestId: 'txReq123',
          walletId: 'wallet456',
          version: 1,
          state: 'signed',
          date: new Date().toISOString(),
          createdDate: new Date().toISOString(),
          userId: 'user123',
          initiatedBy: 'user123',
          updatedBy: 'user123',
          intents: [],
          latest: true,
          unsignedTxs: [],
        },
      };

      const decoded = assertDecode(SendManyResponse, tssResponse);
      assert.ok(decoded.txRequest);
    });

    it('should decode response with pendingApproval', function () {
      const pendingResponse = {
        pendingApproval: {
          id: 'pa123',
          state: 'pending',
        },
      };

      const decoded = assertDecode(SendManyResponse, pendingResponse);
      assert.ok(decoded.pendingApproval);
    });
  });

  describe('Request Body Codec Validation', function () {
    it('should encode and decode valid request body', function () {
      const validBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
        maxFeeRate: 100000,
        feeTxConfirmTarget: 3,
        allowPartialSweep: true,
        txFormat: 'psbt' as const,
        otp: '0000000',
      };

      const bodyCodec = t.type(WalletSweepBody);
      const decoded = assertDecode(bodyCodec, validBody);

      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
      assert.strictEqual(decoded.maxFeeRate, validBody.maxFeeRate);
      assert.strictEqual(decoded.feeTxConfirmTarget, validBody.feeTxConfirmTarget);
      assert.strictEqual(decoded.allowPartialSweep, validBody.allowPartialSweep);
      assert.strictEqual(decoded.txFormat, validBody.txFormat);
      assert.strictEqual(decoded.otp, validBody.otp);
    });

    it('should decode minimal request body with only address', function () {
      const minimalBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
      };

      const bodyCodec = t.type(WalletSweepBody);
      const decoded = assertDecode(bodyCodec, minimalBody);

      assert.strictEqual(decoded.address, minimalBody.address);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.otp, undefined);
    });

    it('should decode request body with xprv instead of walletPassphrase', function () {
      const bodyWithXprv = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        xprv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
      };

      const bodyCodec = t.type(WalletSweepBody);
      const decoded = assertDecode(bodyCodec, bodyWithXprv);

      assert.strictEqual(decoded.address, bodyWithXprv.address);
      assert.strictEqual(decoded.xprv, bodyWithXprv.xprv);
      assert.strictEqual(decoded.walletPassphrase, undefined);
    });
  });

  describe('Request Params Codec Validation', function () {
    it('should encode and decode valid request params', function () {
      const validParams = {
        coin: 'tbtc',
        id: '68c02f96aa757d9212bd1a536f123456',
      };

      const paramsCodec = t.type(WalletSweepParams);
      const decoded = assertDecode(paramsCodec, validParams);

      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should validate coin parameter is string', function () {
      const validParams = {
        coin: 'eth',
        id: '68c02f96aa757d9212bd1a536f123456',
      };

      const paramsCodec = t.type(WalletSweepParams);
      const decoded = assertDecode(paramsCodec, validParams);

      assert.strictEqual(typeof decoded.coin, 'string');
      assert.strictEqual(decoded.coin, 'eth');
    });

    it('should validate id parameter is string', function () {
      const validParams = {
        coin: 'tbtc',
        id: 'abcd1234',
      };

      const paramsCodec = t.type(WalletSweepParams);
      const decoded = assertDecode(paramsCodec, validParams);

      assert.strictEqual(typeof decoded.id, 'string');
      assert.strictEqual(decoded.id, 'abcd1234');
    });
  });

  describe('Handler Logic Tests', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    afterEach(function () {
      sinon.restore();
    });

    it('should call wallet.sweep with correct params', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves({ status: 'signed', txid: 'abc123', tx: '0100' }),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify wallet.sweep was called
      assert.strictEqual(mockWallet.sweep.calledOnce, true);

      // Verify correct parameters were passed
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.deepStrictEqual(callArgs, requestBody);
    });

    it('should handle sweep error and return 500', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().rejects(new Error('Insufficient funds')),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Handler has no try-catch, so errors return 500
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');

      // Verify wallet.sweep was called
      assert.strictEqual(mockWallet.sweep.calledOnce, true);
    });

    it('should return 200 for successful sweep', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sweep: sinon.stub().resolves({
          status: 'signed',
          txid: 'abcdef1234567890',
          tx: '0100000001',
        }),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Handler always returns 200 for success (no 202 logic)
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.status, 'signed');
    });

    it('should handle wallet.get() error', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
      };

      const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));

      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Handler has no try-catch, so errors return 500
      assert.strictEqual(result.status, 500);
    });
  });

  describe('Complete Request/Response Flow', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    afterEach(function () {
      sinon.restore();
    });

    it('should handle complete sweep flow with all parameters', async function () {
      const requestBody = {
        address: '2N5mbsEex9Kct2xTMvosgTGFkcBCdvFgF6h',
        walletPassphrase: 'test_passphrase_12345',
        otp: '0000000',
        feeRate: 50000,
        maxFeeRate: 100000,
        feeTxConfirmTarget: 3,
        allowPartialSweep: true,
        txFormat: 'psbt' as const,
      };

      const transfer = createMockTransfer({
        id: 'sweep-transfer-123',
        value: 10000000,
        valueString: '10000000',
        fee: 5000,
        feeString: '5000',
      });

      const completeSweepResponse = {
        status: 'signed',
        txid: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180969800000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        transfer: transfer,
      };

      const mockWallet = {
        sweep: sinon.stub().resolves(completeSweepResponse),
        _wallet: { multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sweep`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSweepResponse(decodedResponse);

      // Verify response structure
      assert.strictEqual(decodedResponse.status, 'signed');
      assert.strictEqual(decodedResponse.txid, completeSweepResponse.txid);
      assert.strictEqual(decodedResponse.tx, completeSweepResponse.tx);
      assert.ok(decodedResponse.transfer);
      assert.strictEqual(decodedResponse.transfer.id, 'sweep-transfer-123');

      // Verify all parameters were passed to wallet.sweep
      const callArgs = mockWallet.sweep.firstCall.args[0];
      assert.strictEqual(callArgs.address, requestBody.address);
      assert.strictEqual(callArgs.walletPassphrase, requestBody.walletPassphrase);
      assert.strictEqual(callArgs.otp, requestBody.otp);
      assert.strictEqual(callArgs.feeRate, requestBody.feeRate);
      assert.strictEqual(callArgs.maxFeeRate, requestBody.maxFeeRate);
      assert.strictEqual(callArgs.feeTxConfirmTarget, requestBody.feeTxConfirmTarget);
      assert.strictEqual(callArgs.allowPartialSweep, requestBody.allowPartialSweep);
      assert.strictEqual(callArgs.txFormat, requestBody.txFormat);
    });
  });
});
