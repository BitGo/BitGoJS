import * as assert from 'assert';
import { SendManyResponse, SendManyRequestParams, SendManyRequestBody } from '../../../src/typedRoutes/api/v2/sendmany';
import { assertDecode } from './common';
import * as t from 'io-ts';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('SendMany V2 codec tests', function () {
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
  function assertSendManyResponse(response: any) {
    assert.ok(!Array.isArray(response), 'Expected single transaction response, got array');
    return response;
  }

  describe('sendMany v2', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    const mockSendManyResponse = {
      status: 'accepted',
      tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0280a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac40420f00000000001976a914a2b6d08c6f5a2b5e4d6f0a72c3e8b9f5d4c3a21188ac00000000',
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully send to multiple recipients', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000,
          },
          {
            address: 'mvQewFHmFjJVr5G7K9TJWNQxB7cLGhJpJV',
            amount: 500000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet with sendMany method
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.status, mockSendManyResponse.status);
      assert.strictEqual(result.body.tx, mockSendManyResponse.tx);
      assert.strictEqual(result.body.txid, mockSendManyResponse.txid);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSendManyResponse.status);
      assert.strictEqual(decodedResponse.tx, mockSendManyResponse.tx);
      assert.strictEqual(decodedResponse.txid, mockSendManyResponse.txid);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsGetStub.calledOnce, true);
      assert.strictEqual(mockWallet.sendMany.calledOnce, true);
    });

    it('should successfully send with fee parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: '1000000',
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
        feeRate: 50000,
        maxFeeRate: 100000,
        minConfirms: 2,
      };

      // Create mock wallet with sendMany method
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);
      assert.strictEqual(decodedResponse.status, mockSendManyResponse.status);

      // Verify that sendMany was called with the correct parameters
      assert.strictEqual(mockWallet.sendMany.calledOnce, true);
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.strictEqual(callArgs.feeRate, 50000);
      assert.strictEqual(callArgs.maxFeeRate, 100000);
      assert.strictEqual(callArgs.minConfirms, 2);
    });

    it('should successfully send with unspents array and UTXO parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 2000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
        unspents: ['abc123:0', 'def456:1'],
        minValue: 10000,
        maxValue: 5000000,
      };

      // Create mock wallet
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);

      // Verify unspents array was passed correctly
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.deepStrictEqual(callArgs.unspents, ['abc123:0', 'def456:1']);
      assert.strictEqual(callArgs.minValue, 10000);
      assert.strictEqual(callArgs.maxValue, 5000000);
    });

    it('should handle pending approval response (202)', async function () {
      const mockPendingApprovalResponse = {
        status: 'pendingApproval',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        pendingApproval: 'pending-approval-id-123',
      };

      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet that returns pending approval
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockPendingApprovalResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
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
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock TSS wallet
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockTssResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
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
        recipients: [
          {
            address: 'invalid-address',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet that throws an error
      const mockWallet = {
        sendMany: sinon.stub().rejects(new Error('Invalid recipient address')),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify we get a 400 error
      assert.strictEqual(result.status, 400);
      result.body.should.have.property('error');
    });

    it('should support token transfer parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '1000000000000000000', // 1 token with 18 decimals
            tokenName: 'terc',
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
        tokenName: 'terc',
      };

      const mockTokenResponse = {
        status: 'accepted',
        tx: '0xabcdef...',
        txid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockTokenResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);

      // Verify token parameters were passed
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.strictEqual(callArgs.tokenName, 'terc');
      assert.strictEqual(callArgs.recipients[0].tokenName, 'terc');
    });

    it('should support Ethereum EIP-1559 parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: 1000000000000000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
        eip1559: {
          maxPriorityFeePerGas: 2000000000,
          maxFeePerGas: 100000000000,
        },
        gasLimit: 21000,
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify EIP-1559 parameters were passed
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.deepStrictEqual(callArgs.eip1559, {
        maxPriorityFeePerGas: 2000000000,
        maxFeePerGas: 100000000000,
      });
      assert.strictEqual(callArgs.gasLimit, 21000);
    });

    it('should support memo parameters for Stellar/XRP', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'GDSAMPLE1234567890',
            amount: 10000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
        memo: {
          value: 'payment reference 123',
          type: 'text',
        },
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify memo was passed correctly
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.deepStrictEqual(callArgs.memo, {
        value: 'payment reference 123',
        type: 'text',
      });
    });

    it('should handle custodial wallet response', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockCustodialResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: 'txid-custodial-123',
      };

      // Create mock custodial wallet
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockCustodialResponse),
        _wallet: { type: 'custodial', multisigType: 'onchain' },
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.status, 'accepted');

      // Validate custodial response structure
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);
      assert.strictEqual(decodedResponse.txid, 'txid-custodial-123');
    });

    it('should handle TSS wallet pending approval', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockTssPendingResponse = {
        txRequest: {
          txRequestId: 'tx-request-pending-123',
          walletId: walletId,
          walletType: 'hot',
          version: 1,
          state: 'pendingApproval',
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
          pendingApprovalId: 'approval-123',
        },
        pendingApproval: {
          id: 'approval-123',
          state: 'pending',
          info: {
            type: 'transactionRequest',
          },
        },
      };

      // Create mock TSS wallet that returns pending approval
      const mockWallet = {
        sendMany: sinon.stub().resolves(mockTssPendingResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // TSS pending approval returns 200 (not 202 like traditional)
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequest');
      result.body.should.have.property('pendingApproval');

      // Validate TSS pending approval response structure
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should support recipient with full tokenData object', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '0',
            tokenData: {
              tokenType: 'ERC20',
              tokenQuantity: '1000000',
              tokenContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              tokenName: 'USDT',
              decimalPlaces: 6,
            },
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockTokenResponse = {
        status: 'accepted',
        tx: '0xabcdef123456789...',
        txid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockTokenResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(SendManyResponse, result.body);
      assertSendManyResponse(decodedResponse);

      // Verify full tokenData was passed correctly
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.deepStrictEqual(callArgs.recipients[0].tokenData, {
        tokenType: 'ERC20',
        tokenQuantity: '1000000',
        tokenContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        tokenName: 'USDT',
        decimalPlaces: 6,
      });
    });

    it('should support recipient data field as hex string', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: 1000000,
            data: '0xabcdef1234567890',
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify data as string was passed correctly
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.strictEqual(callArgs.recipients[0].data, '0xabcdef1234567890');
    });

    it('should support recipient data field as TokenTransferRecipientParams', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0x1234567890123456789012345678901234567890',
            amount: '0',
            data: {
              tokenType: 'ERC721',
              tokenQuantity: '1',
              tokenContractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
              tokenId: '12345',
            },
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify data as TokenTransferRecipientParams object was passed correctly
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.deepStrictEqual(callArgs.recipients[0].data, {
        tokenType: 'ERC721',
        tokenQuantity: '1',
        tokenContractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        tokenId: '12345',
      });
    });
  });

  describe('Request Validation', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    afterEach(function () {
      sinon.restore();
    });

    it('should accept amount as string', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: '1000000', // String
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockSendManyResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.strictEqual(callArgs.recipients[0].amount, '1000000');
    });

    it('should accept amount as number', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            amount: 1000000, // Number
          },
        ],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockSendManyResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const mockWallet = {
        sendMany: sinon.stub().resolves(mockSendManyResponse),
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
        .post(`/api/v2/${coin}/wallet/${walletId}/sendmany`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const callArgs = mockWallet.sendMany.firstCall.args[0];
      assert.strictEqual(callArgs.recipients[0].amount, 1000000);
    });
  });

  describe('Codec Validation', function () {
    describe('SendManyRequestParams', function () {
      it('should validate params with required coin and id', function () {
        const validParams = {
          coin: 'tbtc',
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        const decoded = assertDecode(t.type(SendManyRequestParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
        assert.strictEqual(decoded.id, validParams.id);
      });

      it('should reject params with missing coin', function () {
        const invalidParams = {
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestParams), invalidParams);
        });
      });

      it('should reject params with missing id', function () {
        const invalidParams = {
          coin: 'tbtc',
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestParams), invalidParams);
        });
      });

      it('should reject params with non-string coin', function () {
        const invalidParams = {
          coin: 123,
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestParams), invalidParams);
        });
      });

      it('should reject params with non-string id', function () {
        const invalidParams = {
          coin: 'tbtc',
          id: 123,
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestParams), invalidParams);
        });
      });
    });

    describe('SendManyRequestBody', function () {
      it('should validate body with basic recipients', function () {
        const validBody = {
          recipients: [
            {
              address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
              amount: 1000000,
            },
          ],
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.ok(decoded.recipients);
        assert.strictEqual(decoded.recipients.length, 1);
        assert.strictEqual(decoded.recipients[0].address, validBody.recipients[0].address);
        assert.strictEqual(decoded.recipients[0].amount, validBody.recipients[0].amount);
      });

      it('should validate body with amount as string', function () {
        const validBody = {
          recipients: [
            {
              address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
              amount: '1000000',
            },
          ],
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.ok(decoded.recipients);
        assert.strictEqual(decoded.recipients[0].amount, '1000000');
      });

      it('should validate body with walletPassphrase', function () {
        const validBody = {
          recipients: [{ address: 'addr', amount: 1000 }],
          walletPassphrase: 'test_passphrase',
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.strictEqual(decoded.walletPassphrase, 'test_passphrase');
      });

      it('should validate body with feeRate', function () {
        const validBody = {
          recipients: [{ address: 'addr', amount: 1000 }],
          feeRate: 50000,
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.strictEqual(decoded.feeRate, 50000);
      });

      it('should validate body with eip1559 params', function () {
        const validBody = {
          recipients: [{ address: '0x123', amount: 1000 }],
          eip1559: {
            maxPriorityFeePerGas: 2000000000,
            maxFeePerGas: 100000000000,
          },
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.ok(decoded.eip1559);
        assert.strictEqual(decoded.eip1559.maxPriorityFeePerGas, 2000000000);
        assert.strictEqual(decoded.eip1559.maxFeePerGas, 100000000000);
      });

      it('should validate body with memo', function () {
        const validBody = {
          recipients: [{ address: 'GDSAMPLE', amount: 1000 }],
          memo: {
            value: 'payment reference 123',
            type: 'text',
          },
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.ok(decoded.memo);
        assert.strictEqual(decoded.memo.value, 'payment reference 123');
        assert.strictEqual(decoded.memo.type, 'text');
      });

      it('should validate body with tokenName', function () {
        const validBody = {
          recipients: [{ address: '0x123', amount: '1000', tokenName: 'terc' }],
          tokenName: 'terc',
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.strictEqual(decoded.tokenName, 'terc');
        assert.ok(decoded.recipients);
        assert.strictEqual(decoded.recipients[0].tokenName, 'terc');
      });

      it('should validate body with unspents array', function () {
        const validBody = {
          recipients: [{ address: 'addr', amount: 1000 }],
          unspents: ['abc123:0', 'def456:1'],
        };

        const decoded = assertDecode(t.type(SendManyRequestBody), validBody);
        assert.deepStrictEqual(decoded.unspents, ['abc123:0', 'def456:1']);
      });

      it('should reject body with invalid recipient (missing address)', function () {
        const invalidBody = {
          recipients: [
            {
              amount: 1000000,
            },
          ],
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestBody), invalidBody);
        });
      });

      it('should reject body with invalid recipient (missing amount)', function () {
        const invalidBody = {
          recipients: [
            {
              address: 'mzKTJw3XJNb7VfkFP77mzPJJz4Dkp4M1T6',
            },
          ],
        };

        assert.throws(() => {
          assertDecode(t.type(SendManyRequestBody), invalidBody);
        });
      });
    });

    describe('SendManyResponse', function () {
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
            latest: true,
          },
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.ok(decoded.txRequest);
        assert.strictEqual(decoded.txRequest.txRequestId, 'tx-request-123');
      });

      it('should validate response with pendingApproval', function () {
        const validResponse = {
          pendingApproval: {
            id: 'approval-123',
            state: 'pending',
          },
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.ok(decoded.pendingApproval);
        assert.strictEqual(decoded.pendingApproval.id, 'approval-123');
      });

      it('should validate complete response (all fields)', function () {
        const validResponse = {
          status: 'signed',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f',
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          transfer: createMockTransfer(),
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
            latest: true,
          },
        };

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.strictEqual(decoded.status, 'signed');
        assert.ok(decoded.tx);
        assert.ok(decoded.txid);
        assert.ok(decoded.transfer);
        assert.ok(decoded.txRequest);
      });

      it('should validate empty response (all fields optional)', function () {
        const validResponse = {};

        const decoded = assertDecode(SendManyResponse, validResponse);
        assert.strictEqual(decoded.status, undefined);
        assert.strictEqual(decoded.tx, undefined);
        assert.strictEqual(decoded.txid, undefined);
        assert.strictEqual(decoded.transfer, undefined);
        assert.strictEqual(decoded.txRequest, undefined);
        assert.strictEqual(decoded.pendingApproval, undefined);
      });
    });
  });
});
