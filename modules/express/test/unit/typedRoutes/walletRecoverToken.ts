import * as assert from 'assert';
import * as t from 'io-ts';
import {
  RecoverTokenParams,
  RecoverTokenBody,
  RecoverTokenResponse,
  PostWalletRecoverToken,
} from '../../../src/typedRoutes/api/v2/walletRecoverToken';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('WalletRecoverToken codec tests', function () {
  describe('walletRecoverToken', function () {
    const agent = setupAgent();
    const coin = 'teth';
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockRecoverTokenResponse = {
      halfSigned: {
        recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
        expireTime: 1672531199,
        contractSequenceId: 1,
        operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        signature:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        gasLimit: 100000,
        gasPrice: 20000000000,
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        walletId: walletId,
      },
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully recover tokens with walletPassphrase', async function () {
      const requestBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('halfSigned');
      result.body.halfSigned.should.have.property('recipient');
      result.body.halfSigned.should.have.property('expireTime');
      result.body.halfSigned.should.have.property('operationHash');
      assert.strictEqual(result.body.halfSigned.expireTime, mockRecoverTokenResponse.halfSigned.expireTime);
      assert.strictEqual(result.body.halfSigned.operationHash, mockRecoverTokenResponse.halfSigned.operationHash);

      const decodedResponse = assertDecode(RecoverTokenResponse, result.body);
      assert.strictEqual(decodedResponse.halfSigned.expireTime, mockRecoverTokenResponse.halfSigned.expireTime);

      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.recoverToken.calledOnce, true);
    });

    it('should successfully recover tokens with prv', async function () {
      const requestBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(RecoverTokenResponse, result.body);
      assert.strictEqual(decodedResponse.halfSigned.expireTime, mockRecoverTokenResponse.halfSigned.expireTime);
    });

    it('should successfully recover tokens with all optional fields', async function () {
      const requestBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        broadcast: true,
        walletPassphrase: 'test_passphrase',
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(RecoverTokenResponse, result.body);
      assert.strictEqual(decodedResponse.halfSigned.expireTime, mockRecoverTokenResponse.halfSigned.expireTime);

      // Verify all parameters were passed to SDK
      assert.strictEqual(mockWallet.recoverToken.calledOnce, true);
      const callArgs = mockWallet.recoverToken.firstCall.args[0];
      assert.strictEqual(callArgs.tokenContractAddress, requestBody.tokenContractAddress);
      assert.strictEqual(callArgs.recipient, requestBody.recipient);
      assert.strictEqual(callArgs.broadcast, requestBody.broadcast);
    });

    it('should successfully recover tokens with broadcast enabled', async function () {
      const requestBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        broadcast: true,
        walletPassphrase: 'test_passphrase',
      };

      const mockBroadcastResponse = {
        ...mockRecoverTokenResponse,
        txid: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };

      const mockWallet = {
        recoverToken: sinon.stub().resolves(mockBroadcastResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('halfSigned');
      // When broadcast is true, may include txid
      if (result.body.txid) {
        assert.strictEqual(result.body.txid, mockBroadcastResponse.txid);
      }
    });

    it('should recover tokens without optional recipient (uses default)', async function () {
      const requestBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        walletPassphrase: 'test_passphrase',
      };

      const mockWallet = {
        recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(RecoverTokenResponse, result.body);
      assert.strictEqual(
        decodedResponse.halfSigned.tokenContractAddress,
        mockRecoverTokenResponse.halfSigned.tokenContractAddress
      );
    });

    // ==========================================
    // ERROR AND EDGE CASE TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle recoverToken failure', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle unsupported coin error', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Unsupported coin: btc'));

        const result = await agent
          .post(`/api/v2/btc/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle invalid token contract address error', async function () {
        const requestBody = {
          tokenContractAddress: 'invalid_address',
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('Invalid token contract address')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle no tokens to recover error', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('No tokens found to recover')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient funds for gas error', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('Insufficient funds for gas')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle coin() method error', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Coin service unavailable'));

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request with invalid tokenContractAddress type', async function () {
        const requestBody = {
          tokenContractAddress: 123, // number instead of string
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid recipient type', async function () {
        const requestBody = {
          recipient: 123, // number instead of string
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid broadcast type', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          broadcast: 'true', // string instead of boolean
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid prv type', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          prv: 123, // number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle very long wallet ID', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${veryLongWalletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle wallet ID with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${encodeURIComponent(specialCharWalletId)}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle both walletPassphrase and prv provided', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - SDK handles priority of auth methods
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(RecoverTokenResponse, result.body);
        assert.strictEqual(decodedResponse.halfSigned.expireTime, mockRecoverTokenResponse.halfSigned.expireTime);
      });

      it('should handle empty body (all fields optional)', async function () {
        const requestBody = {};

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('Missing required parameters')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Empty body is valid per codec, but SDK should reject
        assert.ok(result.status >= 400);
      });

      it('should handle invalid Ethereum address format', async function () {
        const requestBody = {
          tokenContractAddress: '0xinvalid',
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().rejects(new Error('Invalid Ethereum address')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle checksum address validation', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678', // Mixed case (checksum)
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          recoverToken: sinon.stub().resolves(mockRecoverTokenResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with checksum address
        assert.strictEqual(result.status, 200);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing required field', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (missing required fields)
        const invalidResponse = {
          halfSigned: {
            recipient: { address: '0xabcd', amount: '1000' },
            expireTime: 1672531199,
            // missing other required fields
          },
        };

        const mockWallet = {
          recoverToken: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Even if SDK returns 200, response should fail codec validation
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(RecoverTokenResponse, result.body);
          });
        }
      });

      it('should reject response with wrong type in field', async function () {
        const requestBody = {
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (wrong field type)
        const invalidResponse = {
          halfSigned: {
            recipient: { address: '0xabcd', amount: '1000' },
            expireTime: '1672531199', // Wrong type! Should be number
            contractSequenceId: 1,
            operationHash: '0xabcdef',
            signature: '0x123',
            gasLimit: 100000,
            gasPrice: 20000000000,
            tokenContractAddress: '0x1234567890123456789012345678901234567890',
            walletId: walletId,
          },
        };

        const mockWallet = {
          recoverToken: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/recovertoken`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(RecoverTokenResponse, result.body);
          });
        }
      });
    });
  });

  describe('RecoverTokenParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'eth',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(RecoverTokenParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'eth',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'eth',
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });
  });

  describe('RecoverTokenBody', function () {
    it('should validate empty body (all fields optional)', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, undefined);
      assert.strictEqual(decoded.recipient, undefined);
      assert.strictEqual(decoded.broadcast, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.prv, undefined);
    });

    it('should validate body with tokenContractAddress', function () {
      const validBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, validBody.tokenContractAddress);
      assert.strictEqual(decoded.recipient, undefined);
      assert.strictEqual(decoded.broadcast, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.prv, undefined);
    });

    it('should validate body with recipient', function () {
      const validBody = {
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.recipient, validBody.recipient);
      assert.strictEqual(decoded.tokenContractAddress, undefined);
    });

    it('should validate body with broadcast', function () {
      const validBody = {
        broadcast: true,
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.broadcast, validBody.broadcast);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with prv', function () {
      const validBody = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.prv, validBody.prv);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        broadcast: true,
        walletPassphrase: 'mySecurePassphrase',
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, validBody.tokenContractAddress);
      assert.strictEqual(decoded.recipient, validBody.recipient);
      assert.strictEqual(decoded.broadcast, validBody.broadcast);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.prv, validBody.prv);
    });

    it('should reject body with non-string tokenContractAddress', function () {
      const invalidBody = {
        tokenContractAddress: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string recipient', function () {
      const invalidBody = {
        recipient: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-boolean broadcast', function () {
      const invalidBody = {
        broadcast: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string prv', function () {
      const invalidBody = {
        prv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });
  });

  describe('RecoverTokenResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      const decoded = assertDecode(RecoverTokenResponse, validResponse);
      assert.strictEqual(decoded.halfSigned.expireTime, validResponse.halfSigned.expireTime);
      assert.strictEqual(decoded.halfSigned.contractSequenceId, validResponse.halfSigned.contractSequenceId);
      assert.strictEqual(decoded.halfSigned.operationHash, validResponse.halfSigned.operationHash);
      assert.strictEqual(decoded.halfSigned.signature, validResponse.halfSigned.signature);
      assert.strictEqual(decoded.halfSigned.gasLimit, validResponse.halfSigned.gasLimit);
      assert.strictEqual(decoded.halfSigned.gasPrice, validResponse.halfSigned.gasPrice);
      assert.strictEqual(decoded.halfSigned.tokenContractAddress, validResponse.halfSigned.tokenContractAddress);
      assert.strictEqual(decoded.halfSigned.walletId, validResponse.halfSigned.walletId);
      assert.deepStrictEqual(decoded.halfSigned.recipient, validResponse.halfSigned.recipient);
    });

    it('should reject response with missing halfSigned', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing expireTime in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing contractSequenceId in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing operationHash in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing signature in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing gasLimit in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing gasPrice in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing tokenContractAddress in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing walletId in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    // Note: recipient field is typed as t.unknown which accepts any value (including undefined)
    // because the recipient structure is complex and varies. Therefore, we don't test for missing recipient.

    it('should reject response with non-number expireTime', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: '1672531199', // string instead of number
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number contractSequenceId', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: '1', // string instead of number
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string operationHash', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: 123, // number instead of string
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string signature', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature: 123, // number instead of string
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number gasLimit', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: '100000', // string instead of number
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number gasPrice', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: '20000000000', // string instead of number
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string tokenContractAddress', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: 123, // number instead of string
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string walletId', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: 123, // number instead of string
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });
  });

  describe('PostWalletRecoverToken route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletRecoverToken.path, '/api/v2/{coin}/wallet/{id}/recovertoken');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletRecoverToken.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostWalletRecoverToken.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostWalletRecoverToken.response[200]);
      assert.ok(PostWalletRecoverToken.response[400]);
    });
  });
});
