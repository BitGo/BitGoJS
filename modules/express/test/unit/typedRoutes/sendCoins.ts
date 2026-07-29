import * as assert from 'assert';
import { SendCoinsRequestParams, SendCoinsRequestBody } from '../../../src/typedRoutes/api/v2/sendCoins';
import { SendManyResponse } from '../../../src/typedRoutes/api/v2/sendmany';
import { assertDecode } from './common';
import * as t from 'io-ts';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('SendCoins V2 codec tests', function () {
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
      valueString: '1000000',
      state: 'confirmed',
      history: [],
      ...overrides,
    };
  }

  // Helper to assert response structure
  function assertSendCoinsResponse(response: any) {
    assert.ok(!Array.isArray(response), 'Expected single transaction response, got array');
    return response;
  }

  describe('sendCoins v2', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    const mockSendResponse = {
      status: 'accepted',
      tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully send to single recipient with address and amount', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet with send method
      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.status, mockSendResponse.status);
      assert.strictEqual(result.body.tx, mockSendResponse.tx);
      assert.strictEqual(result.body.txid, mockSendResponse.txid);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendCoinsResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSendResponse.status);
      assert.strictEqual(decodedResponse.tx, mockSendResponse.tx);
      assert.strictEqual(decodedResponse.txid, mockSendResponse.txid);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsGetStub.calledOnce, true);
      assert.strictEqual(mockWallet.send.calledOnce, true);
    });

    it('should successfully send with amount as string', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: '1000000',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendCoinsResponse(decodedResponse);

      // Verify that send was called with string amount
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.amount, '1000000');
    });

    it('should successfully send with fee parameters', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
        maxFeeRate: 100000,
        minConfirms: 2,
      };

      // Create mock wallet with send method
      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendCoinsResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSendResponse.status);

      // Verify that send was called with the correct parameters
      assert.strictEqual(mockWallet.send.calledOnce, true);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.feeRate, 50000);
      assert.strictEqual(callArgs.maxFeeRate, 100000);
      assert.strictEqual(callArgs.minConfirms, 2);
    });

    it('should successfully send with unspents array and UTXO parameters', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 2000000,
        walletPassphrase: 'test_passphrase_12345',
        unspents: ['abc123:0', 'def456:1'],
        minValue: 10000,
        maxValue: 5000000,
      };

      // Create mock wallet
      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendCoinsResponse(decodedResponse);

      // Verify unspents array was passed correctly
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.deepStrictEqual(callArgs.unspents, ['abc123:0', 'def456:1']);
      assert.strictEqual(callArgs.minValue, 10000);
      assert.strictEqual(callArgs.maxValue, 5000000);
    });

    it('should successfully send with token transfer (tokenName)', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '1000000000000000000',
        walletPassphrase: 'test_passphrase_12345',
        tokenName: 'terc',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.tokenName, 'terc');
    });

    it('should successfully send with data field (Ethereum)', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: 0,
        walletPassphrase: 'test_passphrase_12345',
        data: '0xa9059cbb000000000000000000000000',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.data, '0xa9059cbb000000000000000000000000');
    });

    it('should successfully send with EIP-1559 parameters (Ethereum)', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '1000000000000000000',
        walletPassphrase: 'test_passphrase_12345',
        eip1559: {
          maxPriorityFeePerGas: 2000000000,
          maxFeePerGas: 100000000000,
        },
        gasLimit: 21000,
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.ok(callArgs.eip1559);
      assert.strictEqual(callArgs.eip1559.maxPriorityFeePerGas, 2000000000);
      assert.strictEqual(callArgs.eip1559.maxFeePerGas, 100000000000);
      assert.strictEqual(callArgs.gasLimit, 21000);
    });

    it('should normalize empty eip1559 object to undefined for server-side auto-estimation', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '1000000000000000000',
        walletPassphrase: 'test_passphrase_12345',
        eip1559: {},
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify empty eip1559 is normalized to undefined for server-side auto-estimation
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.eip1559, undefined);
    });

    it('should reject partial eip1559 object with 400 error', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '1000000000000000000',
        walletPassphrase: 'test_passphrase_12345',
        eip1559: {
          maxFeePerGas: 100000000000,
          // maxPriorityFeePerGas intentionally missing
        },
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Partial eip1559 should be rejected with 400 error
      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error.includes('eip1559 missing maxPriorityFeePerGas'));
    });

    it('should successfully send with memo (XRP/Stellar)', async function () {
      const requestBody = {
        address: 'GDSAMPLE123456789',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
        memo: {
          value: 'payment reference 123',
          type: 'text',
        },
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.ok(callArgs.memo);
      assert.strictEqual(callArgs.memo.value, 'payment reference 123');
      assert.strictEqual(callArgs.memo.type, 'text');
    });

    it('should handle pending approval response (202)', async function () {
      const mockPendingApprovalResponse = {
        status: 'pendingApproval',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        pendingApproval: 'pending-approval-id-123',
      };

      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet that returns pending approval
      const mockWallet = {
        send: sinon.stub().resolves(mockPendingApprovalResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify we get a 202 status for pending approval
      assert.strictEqual(result.status, 202);
      result.body.should.have.property('status');
      result.body.should.have.property('pendingApproval');
      assert.strictEqual(result.body.status, 'pendingApproval');
    });

    it('should handle TSS wallet response', async function () {
      const mockTssResponse = {
        status: 'signed',
        txRequest: {
          txRequestId: 'tx-request-123',
          walletId: walletId,
          walletType: 'hot',
          version: 1,
          state: 'signed',
          date: new Date().toISOString(),
          createdDate: new Date().toISOString(),
          userId: 'user-123',
          initiatedBy: 'user-123',
          updatedBy: 'user-123',
          intents: [],
          intent: {},
          policiesChecked: true,
          unsignedTxs: [],
          latest: true,
        },
        transfer: createMockTransfer({
          id: 'transfer-123',
          state: 'signed',
        }),
        txid: 'txid-123',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock TSS wallet
      const mockWallet = {
        send: sinon.stub().resolves(mockTssResponse),
        _wallet: { multisigType: 'tss', multisigTypeVersion: 'MPCv2' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('txRequest');
      assert.strictEqual(result.body.status, 'signed');

      // Decode and verify TSS response structure
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle error response (400)', async function () {
      const requestBody = {
        address: 'invalid-address',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet that throws an error
      const mockWallet = {
        send: sinon.stub().rejects(new Error('Invalid recipient address')),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify we get a 400 status for error
      assert.strictEqual(result.status, 400);
      result.body.should.have.property('error');
    });

    it('should reject request with missing address', async function () {
      const requestBody = {
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should return 400 for missing required field
      assert.strictEqual(result.status, 400);
    });

    it('should reject request with missing amount', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        walletPassphrase: 'test_passphrase_12345',
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should return 400 for missing required field
      assert.strictEqual(result.status, 400);
    });

    it('should successfully send with instant parameter', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
        instant: true,
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.instant, true);
    });

    it('should successfully send with custodian transaction ID', async function () {
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '1000000000000000000',
        walletPassphrase: 'test_passphrase_12345',
        custodianTransactionId: 'custodian-tx-123',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.custodianTransactionId, 'custodian-tx-123');
    });

    it('should successfully send with message parameter', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        walletPassphrase: 'test_passphrase_12345',
        message: 'Payment for invoice #12345',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.strictEqual(callArgs.message, 'Payment for invoice #12345');
    });

    it('should successfully send with prv instead of walletPassphrase', async function () {
      const requestBody = {
        address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        amount: 1000000,
        prv: 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
      };

      const mockWallet = {
        send: sinon.stub().resolves(mockSendResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendcoins`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.send.firstCall.args[0];
      assert.ok(callArgs.prv);
    });
  });

  describe('Codec Validation', function () {
    describe('SendCoinsRequestParams', function () {
      it('should validate params with required coin and id', function () {
        const validParams = {
          coin: 'tbtc',
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        const decoded = assertDecode(t.type(SendCoinsRequestParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
        assert.strictEqual(decoded.id, validParams.id);
      });

      it('should reject params with missing coin', function () {
        const invalidParams = {
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestParams), invalidParams);
        });
      });

      it('should reject params with missing id', function () {
        const invalidParams = {
          coin: 'tbtc',
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestParams), invalidParams);
        });
      });

      it('should reject params with non-string coin', function () {
        const invalidParams = {
          coin: 123,
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestParams), invalidParams);
        });
      });

      it('should reject params with non-string id', function () {
        const invalidParams = {
          coin: 'tbtc',
          id: 123,
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestParams), invalidParams);
        });
      });
    });

    describe('SendCoinsRequestBody', function () {
      it('should validate body with basic address and amount', function () {
        const validBody = {
          address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
          amount: 1000000,
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.amount, validBody.amount);
      });

      it('should validate body with amount as string', function () {
        const validBody = {
          address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
          amount: '1000000',
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.strictEqual(decoded.address, validBody.address);
        assert.strictEqual(decoded.amount, '1000000');
      });

      it('should validate body with optional parameters', function () {
        const validBody = {
          address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
          amount: 1000000,
          walletPassphrase: 'test_passphrase',
          feeRate: 50000,
          minConfirms: 2,
          instant: true,
          message: 'test message',
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.strictEqual(decoded.walletPassphrase, 'test_passphrase');
        assert.strictEqual(decoded.feeRate, 50000);
        assert.strictEqual(decoded.minConfirms, 2);
        assert.strictEqual(decoded.instant, true);
        assert.strictEqual(decoded.message, 'test message');
      });

      it('should validate body with eip1559 params', function () {
        const validBody = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1000000000000000000',
          eip1559: {
            maxPriorityFeePerGas: 2000000000,
            maxFeePerGas: 100000000000,
          },
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.ok(decoded.eip1559);
        assert.ok('maxPriorityFeePerGas' in decoded.eip1559);
        assert.ok('maxFeePerGas' in decoded.eip1559);
        assert.strictEqual(decoded.eip1559.maxPriorityFeePerGas, 2000000000);
        assert.strictEqual(decoded.eip1559.maxFeePerGas, 100000000000);
      });

      it('should allow empty eip1559 object for backward compatibility', function () {
        const validBody = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1000000000000000000',
          eip1559: {},
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.ok(decoded.eip1559);
        assert.deepStrictEqual(decoded.eip1559, {});
      });

      it('should pass schema validation for partial eip1559 (controller rejects)', function () {
        const partialBody = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1000000000000000000',
          eip1559: {
            maxFeePerGas: 100000000000,
          },
        };

        // Partial objects pass schema validation; controller validates and rejects
        const decoded = assertDecode(t.type(SendCoinsRequestBody), partialBody);
        assert.ok(decoded.eip1559);
        assert.strictEqual(decoded.eip1559.maxFeePerGas, 100000000000);
      });

      it('should validate body with memo', function () {
        const validBody = {
          address: 'GDSAMPLE',
          amount: 1000000,
          memo: {
            value: 'payment reference 123',
            type: 'text',
          },
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.ok(decoded.memo);
        assert.strictEqual(decoded.memo.value, 'payment reference 123');
        assert.strictEqual(decoded.memo.type, 'text');
      });

      it('should validate body with tokenName', function () {
        const validBody = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: '1000000000000000000',
          tokenName: 'terc',
        };

        const decoded = assertDecode(t.type(SendCoinsRequestBody), validBody);
        assert.strictEqual(decoded.tokenName, 'terc');
      });

      it('should reject body with missing address', function () {
        const invalidBody = {
          amount: 1000000,
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestBody), invalidBody);
        });
      });

      it('should reject body with missing amount', function () {
        const invalidBody = {
          address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestBody), invalidBody);
        });
      });

      it('should reject body with non-string address', function () {
        const invalidBody = {
          address: 123,
          amount: 1000000,
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestBody), invalidBody);
        });
      });

      it('should reject body with invalid amount type (not number or string)', function () {
        const invalidBody = {
          address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
          amount: { value: 1000000 },
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestBody), invalidBody);
        });
      });

      it('should reject body with incomplete memo params', function () {
        const invalidBody = {
          address: 'GDSAMPLE',
          amount: 1000000,
          memo: {
            value: 'payment reference 123',
            // Missing type
          },
        };

        assert.throws(() => {
          assertDecode(t.type(SendCoinsRequestBody), invalidBody);
        });
      });
    });

    describe('SendCoinsResponse (reuses SendManyResponse)', function () {
      it('should validate response with status and tx', function () {
        const validResponse = {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f',
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.strictEqual(decoded.status, 'accepted');
        assert.strictEqual(decoded.tx, validResponse.tx);
      });

      it('should validate response with txid', function () {
        const validResponse = {
          status: 'accepted',
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.strictEqual(decoded.txid, validResponse.txid);
      });

      it('should validate response with transfer', function () {
        const validResponse = {
          status: 'accepted',
          transfer: createMockTransfer(),
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.ok(decoded.transfer);
        assert.strictEqual(decoded.transfer.coin, 'tbtc');
      });

      it('should validate response with txRequest (TSS)', function () {
        const validResponse = {
          status: 'signed',
          txRequest: {
            txRequestId: 'tx-request-123',
            walletId: 'wallet-456',
            walletType: 'hot',
            version: 1,
            state: 'signed',
            date: new Date().toISOString(),
            createdDate: new Date().toISOString(),
            userId: 'user-123',
            initiatedBy: 'user-123',
            updatedBy: 'user-123',
            intents: [],
            intent: {},
            policiesChecked: true,
            unsignedTxs: [],
            latest: true,
          },
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.ok(decoded.txRequest);
        assert.strictEqual(decoded.txRequest.txRequestId, 'tx-request-123');
      });

      it('should validate response with pendingApproval', function () {
        const validResponse = {
          status: 'pendingApproval',
          pendingApproval: {
            id: 'pending-123',
            coin: 'tbtc',
            state: 'pending',
          },
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.ok(decoded.pendingApproval);
      });
    });
  });
});
