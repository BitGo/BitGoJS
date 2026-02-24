import * as assert from 'assert';
import * as t from 'io-ts';
import {
  LightningPaymentParams,
  LightningPaymentRequestBody,
  LightningPaymentResponse,
} from '../../../src/typedRoutes/api/v2/lightningPayment';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Lightning Payment API Tests', function () {
  describe('Codec Validation Tests', function () {
    describe('Path Parameters', function () {
      it('should validate valid path parameters', function () {
        const validParams = {
          coin: 'tlnbtc',
          id: '5d9f3d1c2e1a3b001a123456',
        };

        const decoded = assertDecode(t.type(LightningPaymentParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
        assert.strictEqual(decoded.id, validParams.id);
      });

      it('should validate mainnet coin', function () {
        const validParams = {
          coin: 'lnbtc',
          id: '5d9f3d1c2e1a3b001a123456',
        };

        const decoded = assertDecode(t.type(LightningPaymentParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
      });

      it('should fail validation without coin', function () {
        const invalidParams = {
          id: '5d9f3d1c2e1a3b001a123456',
        };

        const result = t.type(LightningPaymentParams).decode(invalidParams);
        assert.strictEqual(result._tag, 'Left');
      });

      it('should fail validation without wallet id', function () {
        const invalidParams = {
          coin: 'tlnbtc',
        };

        const result = t.type(LightningPaymentParams).decode(invalidParams);
        assert.strictEqual(result._tag, 'Left');
      });
    });

    describe('Request Body - Required Fields', function () {
      it('should validate body with required fields only', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.invoice, validBody.invoice);
        assert.strictEqual(decoded.passphrase, validBody.passphrase);
      });

      it('should fail validation without invoice', function () {
        const invalidBody = {
          passphrase: 'myWalletPassphrase123',
        };

        const result = t.type(LightningPaymentRequestBody).decode(invalidBody);
        assert.strictEqual(result._tag, 'Left');
      });

      it('should fail validation without passphrase', function () {
        const invalidBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
        };

        const result = t.type(LightningPaymentRequestBody).decode(invalidBody);
        assert.strictEqual(result._tag, 'Left');
      });
    });

    describe('Request Body - Optional Fields', function () {
      it('should validate body with amountMsat', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          amountMsat: '10000',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.amountMsat, BigInt(10000));
      });

      it('should validate body with feeLimitMsat', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          feeLimitMsat: '1000',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.feeLimitMsat, BigInt(1000));
      });

      it('should validate body with feeLimitRatio', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          feeLimitRatio: 0.01,
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.feeLimitRatio, validBody.feeLimitRatio);
      });

      it('should validate body with sequenceId', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          sequenceId: 'payment-seq-123',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
      });

      it('should validate body with comment', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          comment: 'Payment for services',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.comment, validBody.comment);
      });

      it('should validate body with all optional fields', function () {
        const validBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          amountMsat: '10000',
          feeLimitMsat: '1000',
          feeLimitRatio: 0.01,
          sequenceId: 'payment-seq-123',
          comment: 'Payment for services',
        };

        const decoded = assertDecode(t.type(LightningPaymentRequestBody), validBody);
        assert.strictEqual(decoded.invoice, validBody.invoice);
        assert.strictEqual(decoded.passphrase, validBody.passphrase);
        assert.strictEqual(decoded.amountMsat, BigInt(10000));
        assert.strictEqual(decoded.feeLimitMsat, BigInt(1000));
        assert.strictEqual(decoded.feeLimitRatio, validBody.feeLimitRatio);
        assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
        assert.strictEqual(decoded.comment, validBody.comment);
      });
    });

    describe('Response Validation', function () {
      it('should validate successful payment response', function () {
        const validResponse = {
          txRequestId: 'txreq-abc123',
          txRequestState: 'delivered',
          paymentStatus: {
            status: 'in_flight',
            paymentHash: 'xyz789',
            paymentId: 'payment-456',
          },
        };

        const decoded = assertDecode(LightningPaymentResponse, validResponse);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
        assert.strictEqual(decoded.txRequestState, validResponse.txRequestState);
        assert.strictEqual(decoded.paymentStatus?.status, validResponse.paymentStatus.status);
        assert.strictEqual(decoded.paymentStatus?.paymentHash, validResponse.paymentStatus.paymentHash);
      });

      it('should validate settled payment response', function () {
        const validResponse = {
          txRequestId: 'txreq-abc123',
          txRequestState: 'delivered',
          paymentStatus: {
            status: 'settled',
            paymentHash: 'xyz789',
            paymentPreimage: 'preimage123',
            amountMsat: '10000',
            feeMsat: '100',
          },
        };

        const decoded = assertDecode(LightningPaymentResponse, validResponse);
        assert.strictEqual(decoded.paymentStatus?.status, 'settled');
        assert.strictEqual(decoded.paymentStatus?.paymentPreimage, validResponse.paymentStatus.paymentPreimage);
      });

      it('should validate failed payment response', function () {
        const validResponse = {
          txRequestId: 'txreq-abc123',
          txRequestState: 'delivered',
          paymentStatus: {
            status: 'failed',
            paymentHash: 'xyz789',
            failureReason: 'NO_ROUTE',
          },
        };

        const decoded = assertDecode(LightningPaymentResponse, validResponse);
        assert.strictEqual(decoded.paymentStatus?.status, 'failed');
        assert.strictEqual(decoded.paymentStatus?.failureReason, 'NO_ROUTE');
      });

      it('should validate pending approval response', function () {
        const validResponse = {
          txRequestId: 'txreq-pending-123',
          txRequestState: 'pendingApproval',
          pendingApproval: {
            id: 'approval-xyz',
            state: 'pending',
            creator: 'user-id-123',
            info: {
              type: 'transactionRequest',
            },
            approvalsRequired: 2,
          },
        };

        const decoded = assertDecode(LightningPaymentResponse, validResponse);
        assert.strictEqual(decoded.txRequestState, 'pendingApproval');
        assert.strictEqual(decoded.pendingApproval?.id, validResponse.pendingApproval.id);
        assert.strictEqual(decoded.pendingApproval?.state, validResponse.pendingApproval.state);
        assert.strictEqual(decoded.pendingApproval?.approvalsRequired, validResponse.pendingApproval.approvalsRequired);
      });

      it('should validate response with various txRequestStates', function () {
        const states = [
          'pendingCommitment',
          'pendingApproval',
          'canceled',
          'rejected',
          'initialized',
          'pendingDelivery',
          'delivered',
          'pendingUserSignature',
          'signed',
        ];

        states.forEach((state) => {
          const validResponse = {
            txRequestId: 'txreq-123',
            txRequestState: state,
          };

          const decoded = assertDecode(LightningPaymentResponse, validResponse);
          assert.strictEqual(decoded.txRequestState, state);
        });
      });

      it('should fail validation without txRequestId', function () {
        const invalidResponse = {
          txRequestState: 'delivered',
        };

        const result = LightningPaymentResponse.decode(invalidResponse);
        assert.strictEqual(result._tag, 'Left');
      });

      it('should fail validation without txRequestState', function () {
        const invalidResponse = {
          txRequestId: 'txreq-123',
        };

        const result = LightningPaymentResponse.decode(invalidResponse);
        assert.strictEqual(result._tag, 'Left');
      });
    });
  });

  describe('Integration Tests with Supertest', function () {
    const agent = setupAgent();
    const walletId = '5d9f3d1c2e1a3b001a123456';
    const coin = 'tlnbtc';

    afterEach(function () {
      sinon.restore();
    });

    // Helper function to create mock wallet with lightning support
    function createMockLightningWallet(mockPaymentResponse: any) {
      const mockTxRequestCreate = {
        txRequestId: mockPaymentResponse.txRequestId,
        state: 'initialized',
        pendingApprovalId: undefined,
      };

      const mockTxRequestSend = {
        txRequestId: mockPaymentResponse.txRequestId,
        state: mockPaymentResponse.txRequestState,
        transactions: [
          {
            unsignedTx: {
              coinSpecific: mockPaymentResponse.paymentStatus,
            },
          },
        ],
      };

      const postStub = sinon.stub();
      postStub.onFirstCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTxRequestCreate),
        }),
      });

      postStub.onSecondCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves({}),
        }),
      });
      postStub.onThirdCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTxRequestSend),
        }),
      });

      const mockBitgo: any = {
        setRequestTracer: sinon.stub(),
        decrypt: sinon
          .stub()
          .returns(
            'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
          ),
        url: sinon.stub().returnsArg(0),
        post: postStub,
        get: sinon.stub().returns({
          result: sinon.stub().resolves({}),
        }),
      };

      const mockKeychainsGet = sinon.stub();
      mockKeychainsGet.onCall(0).resolves({
        id: 'user-auth-key',
        pub: 'user-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-user-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'userAuth',
          },
        },
      });
      mockKeychainsGet.onCall(1).resolves({
        id: 'node-auth-key',
        pub: 'node-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-node-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'nodeAuth',
          },
        },
      });

      const mockWallet: any = {
        id: () => walletId,
        baseCoin: {
          getFamily: () => 'lnbtc',
          getChain: () => 'tlnbtc',
          keychains: () => ({ get: mockKeychainsGet }),
          url: sinon.stub().returnsArg(0),
          supportsTss: () => false,
        },
        subType: () => 'lightningSelfCustody',
        coinSpecific: () => ({ keys: ['user-auth-key', 'node-auth-key'] }),
        bitgo: mockBitgo,
      };

      return { mockWallet, postStub, mockBitgo };
    }

    it('should successfully pay a lightning invoice - delivered status', async function () {
      const requestBody = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
        passphrase: 'myWalletPassphrase123',
        amountMsat: '10000',
        sequenceId: 'payment-001',
      };

      const mockPaymentResponse = {
        txRequestId: 'txreq-success-123',
        txRequestState: 'delivered',
        paymentStatus: {
          status: 'in_flight',
          paymentHash: 'abc123paymenthash',
          paymentId: 'payment-id-456',
        },
      };

      // Create mock wallet with lightning support
      const { mockWallet, postStub } = createMockLightningWallet(mockPaymentResponse);

      // Stub the coin and wallets
      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = {
        wallets: () => mockWallets,
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      result.body.should.have.property('txRequestState');
      result.body.should.have.property('paymentStatus');
      assert.strictEqual(result.body.txRequestId, mockPaymentResponse.txRequestId);
      assert.strictEqual(result.body.txRequestState, mockPaymentResponse.txRequestState);
      assert.strictEqual(result.body.paymentStatus.status, 'in_flight');

      // Validate response structure
      const decodedResponse = assertDecode(LightningPaymentResponse, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockPaymentResponse.txRequestId);
      assert.strictEqual(decodedResponse.paymentStatus?.status, 'in_flight');

      // Verify the correct methods were called
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(postStub.calledThrice, true);

      // Verify the posts were called with correct endpoints
      const firstPostCall = postStub.getCall(0);
      assert.ok(firstPostCall.args[0].includes('/txrequests'));
    });

    it('should successfully pay a lightning invoice - pending approval', async function () {
      const requestBody = {
        invoice: 'lntb200u1p3h2jk3pp5yndyvx4zmvxyz',
        passphrase: 'myWalletPassphrase123',
      };

      const mockTxRequest = {
        txRequestId: 'txreq-pending-789',
        state: 'pendingApproval',
        pendingApprovalId: 'approval-xyz-123',
      };

      const mockPendingApproval = {
        id: 'approval-xyz-123',
        state: 'pending',
        creator: 'user-abc-456',
        info: {
          type: 'transactionRequest',
        },
        approvalsRequired: 2,
        wallet: walletId,
      };

      // Mock keychains for auth keys
      const mockKeychainsGet = sinon.stub();
      mockKeychainsGet.onCall(0).resolves({
        id: 'userAuthKeyId',
        pub: 'user-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-user-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'userAuth',
          },
        },
      });
      mockKeychainsGet.onCall(1).resolves({
        id: 'nodeAuthKeyId',
        pub: 'node-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-node-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'nodeAuth',
          },
        },
      });

      // Mock the HTTP post for payment intent
      const postStub = sinon.stub();
      postStub.onFirstCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTxRequest),
        }),
      });

      // Mock bitgo instance with required methods
      const mockBitgo: any = {
        setRequestTracer: sinon.stub(),
        decrypt: sinon
          .stub()
          .returns(
            'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
          ),
        url: sinon.stub().returnsArg(0),
        post: postStub,
        get: sinon.stub().returns({
          result: sinon.stub().resolves({
            toJSON: () => mockPendingApproval,
          }),
        }),
      };

      const mockWallet: any = {
        id: () => walletId,
        baseCoin: {
          getFamily: () => 'lnbtc',
          getChain: () => 'tlnbtc',
          keychains: () => ({ get: mockKeychainsGet }),
          url: sinon.stub().returnsArg(0),
          supportsTss: () => false,
        },
        subType: () => 'lightningSelfCustody',
        coinSpecific: () => ({ keys: ['userAuthKeyId', 'nodeAuthKeyId'] }),
        bitgo: mockBitgo,
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: () => mockWallets };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      result.body.should.have.property('txRequestState');
      result.body.should.have.property('pendingApproval');
      assert.strictEqual(result.body.txRequestState, 'pendingApproval');
      assert.strictEqual(result.body.pendingApproval.id, mockPendingApproval.id);
      assert.strictEqual(result.body.pendingApproval.approvalsRequired, 2);

      const decodedResponse = assertDecode(LightningPaymentResponse, result.body);
      assert.strictEqual(decodedResponse.pendingApproval?.state, 'pending');
    });

    it('should handle payment with fee limits', async function () {
      const requestBody = {
        invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
        passphrase: 'myWalletPassphrase123',
        feeLimitMsat: '1000',
        feeLimitRatio: 0.01,
        comment: 'Payment with fee controls',
      };

      const mockTxRequest = {
        txRequestId: 'txreq-fee-controlled',
        state: 'initialized',
      };

      const mockTxRequestSend = {
        txRequestId: 'txreq-fee-controlled',
        state: 'delivered',
        transactions: [
          {
            unsignedTx: {
              coinSpecific: {
                status: 'settled',
                paymentHash: 'hash-with-fees',
                paymentPreimage: 'preimage-success',
                amountMsat: '10000',
                feeMsat: '500',
              },
            },
          },
        ],
      };

      // Mock keychains for auth keys
      const mockKeychainsGet = sinon.stub();
      mockKeychainsGet.onCall(0).resolves({
        id: 'userAuthKeyId',
        pub: 'user-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-user-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'userAuth',
          },
        },
      });
      mockKeychainsGet.onCall(1).resolves({
        id: 'nodeAuthKeyId',
        pub: 'node-auth-public-key',
        source: 'user',
        encryptedPrv: 'encrypted-node-key',
        coinSpecific: {
          tlnbtc: {
            purpose: 'nodeAuth',
          },
        },
      });

      // Mock the HTTP post for payment intent (non-pending approval flow)
      const postStub = sinon.stub();
      postStub.onFirstCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTxRequest),
        }),
      });
      // Second call for sending the transaction
      postStub.onSecondCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves({}),
        }),
      });
      // Third call for getting tx request status
      postStub.onThirdCall().returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockTxRequestSend),
        }),
      });

      // Mock bitgo instance with required methods
      const mockBitgo: any = {
        setRequestTracer: sinon.stub(),
        decrypt: sinon
          .stub()
          .returns(
            'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
          ),
        url: sinon.stub().returnsArg(0),
        post: postStub,
        get: sinon.stub().returns({
          result: sinon.stub().resolves({}),
        }),
      };

      const mockWallet: any = {
        id: () => walletId,
        baseCoin: {
          getFamily: () => 'lnbtc',
          getChain: () => 'tlnbtc',
          keychains: () => ({ get: mockKeychainsGet }),
          url: sinon.stub().returnsArg(0),
          supportsTss: () => false,
        },
        subType: () => 'lightningSelfCustody',
        coinSpecific: () => ({ keys: ['userAuthKeyId', 'nodeAuthKeyId'] }),
        bitgo: mockBitgo,
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: () => mockWallets };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.paymentStatus.status, 'settled');
      assert.strictEqual(result.body.paymentStatus.amountMsat, '10000');
      assert.strictEqual(result.body.paymentStatus.feeMsat, '500');
    });

    describe('Error Cases', function () {
      it('should return 400 when invoice is missing', async function () {
        const requestBody = {
          passphrase: 'myWalletPassphrase123',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
        result.body.error.length.should.be.above(0);
        // Validation error should mention missing invoice field
        result.body.error.should.match(/invoice/);
      });

      it('should return 400 when passphrase is missing', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
        result.body.error.length.should.be.above(0);
        // Validation error should mention missing passphrase field
        result.body.error.should.match(/passphrase/);
      });

      it('should return 400 when amountMsat is invalid format', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          amountMsat: 'not-a-number',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
        result.body.error.length.should.be.above(0);
        // Validation error should mention amountMsat field
        result.body.error.should.match(/amountMsat/);
      });

      it('should handle wallet not found error', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: () => mockWallets };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle invalid passphrase error', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'wrong_passphrase',
        };

        const mockPayInvoiceStub = sinon.stub().rejects(new Error('Invalid passphrase'));

        // Mock keychains for auth keys
        const mockKeychainsGet = sinon.stub();
        mockKeychainsGet.onCall(0).resolves({
          id: 'userAuthKeyId',
          pub: 'user-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-user-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'userAuth',
            },
          },
        });
        mockKeychainsGet.onCall(1).resolves({
          id: 'nodeAuthKeyId',
          pub: 'node-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-node-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'nodeAuth',
            },
          },
        });

        // Mock bitgo instance with required methods
        const mockBitgo: any = {
          setRequestTracer: sinon.stub(),
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          url: sinon.stub().returnsArg(0),
          post: sinon.stub().returns({
            send: sinon.stub().returns({
              result: sinon.stub().rejects(mockPayInvoiceStub),
            }),
          }),
          get: sinon.stub().returns({
            result: sinon.stub().resolves({}),
          }),
        };

        const mockWallet: any = {
          id: () => walletId,
          baseCoin: {
            getFamily: () => 'lnbtc',
            getChain: () => 'tlnbtc',
            keychains: () => ({ get: mockKeychainsGet }),
          },
          subType: () => 'lightningSelfCustody',
          coinSpecific: () => ({ keys: ['userAuthKeyId', 'nodeAuthKeyId'] }),
          bitgo: mockBitgo,
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: () => mockWallets };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle payment timeout error', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
        };

        const mockPayInvoiceStub = sinon.stub().rejects(new Error('Payment timeout'));

        // Mock keychains for auth keys
        const mockKeychainsGet = sinon.stub();
        mockKeychainsGet.onCall(0).resolves({
          id: 'userAuthKeyId',
          pub: 'user-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-user-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'userAuth',
            },
          },
        });
        mockKeychainsGet.onCall(1).resolves({
          id: 'nodeAuthKeyId',
          pub: 'node-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-node-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'nodeAuth',
            },
          },
        });

        // Mock bitgo instance with required methods
        const mockBitgo: any = {
          setRequestTracer: sinon.stub(),
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          url: sinon.stub().returnsArg(0),
          post: sinon.stub().returns({
            send: sinon.stub().returns({
              result: sinon.stub().rejects(mockPayInvoiceStub),
            }),
          }),
          get: sinon.stub().returns({
            result: sinon.stub().resolves({}),
          }),
        };

        const mockWallet: any = {
          id: () => walletId,
          baseCoin: {
            getFamily: () => 'lnbtc',
            getChain: () => 'tlnbtc',
            keychains: () => ({ get: mockKeychainsGet }),
          },
          subType: () => 'lightningSelfCustody',
          coinSpecific: () => ({ keys: ['userAuthKeyId', 'nodeAuthKeyId'] }),
          bitgo: mockBitgo,
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: () => mockWallets };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient balance error', async function () {
        const requestBody = {
          invoice: 'lntb100u1p3h2jk3pp5yndyvx4zmvxyz',
          passphrase: 'myWalletPassphrase123',
          amountMsat: '1000000000',
        };

        const mockPayInvoiceStub = sinon.stub().rejects(new Error('Insufficient balance'));

        // Mock keychains for auth keys
        const mockKeychainsGet = sinon.stub();
        mockKeychainsGet.onCall(0).resolves({
          id: 'userAuthKeyId',
          pub: 'user-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-user-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'userAuth',
            },
          },
        });
        mockKeychainsGet.onCall(1).resolves({
          id: 'nodeAuthKeyId',
          pub: 'node-auth-public-key',
          source: 'user',
          encryptedPrv: 'encrypted-node-key',
          coinSpecific: {
            tlnbtc: {
              purpose: 'nodeAuth',
            },
          },
        });

        // Mock bitgo instance with required methods
        const mockBitgo: any = {
          setRequestTracer: sinon.stub(),
          decrypt: sinon
            .stub()
            .returns(
              'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'
            ),
          url: sinon.stub().returnsArg(0),
          post: sinon.stub().returns({
            send: sinon.stub().returns({
              result: sinon.stub().rejects(mockPayInvoiceStub),
            }),
          }),
          get: sinon.stub().returns({
            result: sinon.stub().resolves({}),
          }),
        };

        const mockWallet: any = {
          id: () => walletId,
          baseCoin: {
            getFamily: () => 'lnbtc',
            getChain: () => 'tlnbtc',
            keychains: () => ({ get: mockKeychainsGet }),
          },
          subType: () => 'lightningSelfCustody',
          coinSpecific: () => ({ keys: ['userAuthKeyId', 'nodeAuthKeyId'] }),
          bitgo: mockBitgo,
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: () => mockWallets };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/lightning/payment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });
  });
});
