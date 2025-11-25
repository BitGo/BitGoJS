import * as assert from 'assert';
import * as t from 'io-ts';
import {
  IsWalletAddressBody,
  IsWalletAddressParams,
  IsWalletAddressResponse,
  PostIsWalletAddress,
  KeychainCodec,
} from '../../../src/typedRoutes/api/v2/isWalletAddress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('IsWalletAddress codec tests', function () {
  describe('KeychainCodec', function () {
    it('should validate keychain with pub only (minimum required)', function () {
      const validKeychain = {
        pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVmsa5SriNrfKZZAcAvRgxh1Augm6s8yoD8gSkq2FdZ8YCdVXUgLjf9QxvdYAJK5UthAmpQshU',
      };

      const decoded = assertDecode(KeychainCodec, validKeychain);
      assert.strictEqual(decoded.pub, validKeychain.pub);
    });

    it('should validate BIP32 keychain with pub and ethAddress', function () {
      const validKeychain = {
        pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVmsa5SriNrfKZZAcAvRgxh1Augm6s8yoD8gSkq2FdZ8YCdVXUgLjf9QxvdYAJK5UthAmpQshU',
        ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d',
      };

      const decoded = assertDecode(KeychainCodec, validKeychain);
      assert.strictEqual(decoded.pub, validKeychain.pub);
      assert.strictEqual(decoded.ethAddress, validKeychain.ethAddress);
    });

    it('should validate TSS/MPC keychain with pub and commonKeychain', function () {
      const validKeychain = {
        pub: 'user_pub',
        commonKeychain:
          '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
      };

      const decoded = assertDecode(KeychainCodec, validKeychain);
      assert.strictEqual(decoded.pub, validKeychain.pub);
      assert.strictEqual(decoded.commonKeychain, validKeychain.commonKeychain);
    });

    it('should reject keychain without pub', function () {
      const invalidKeychain = {
        ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d',
      };

      assert.throws(() => {
        assertDecode(KeychainCodec, invalidKeychain);
      });
    });
  });

  describe('IsWalletAddressParams', function () {
    it('should validate params with coin and wallet id', function () {
      const validParams = {
        coin: 'hteth',
        id: '12345abcdef',
      };

      const decoded = assertDecode(t.type(IsWalletAddressParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '12345abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressParams), invalidParams);
      });
    });

    it('should reject params with missing wallet id', function () {
      const invalidParams = {
        coin: 'hteth',
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressParams), invalidParams);
      });
    });
  });

  describe('IsWalletAddressBody', function () {
    it('should validate body with minimum required fields (address and keychains)', function () {
      const validBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
      };

      const decoded = assertDecode(t.type(IsWalletAddressBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.keychains.length, 3);
    });

    it('should validate body with BIP32 wallet parameters', function () {
      const validBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        baseAddress: '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f',
        keychains: [
          { pub: 'xpub1...', ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d' },
          { pub: 'xpub2...', ethAddress: '0x5bdf3ae1d2c2fadeeb70a45872bf4f4252312b55' },
          { pub: 'xpub3...', ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09' },
        ],
        walletVersion: 1,
        coinSpecific: {
          salt: '0x7',
          forwarderVersion: 1,
        },
        index: 7,
      };

      const decoded = assertDecode(t.type(IsWalletAddressBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.baseAddress, validBody.baseAddress);
      assert.strictEqual(decoded.walletVersion, 1);
      assert.strictEqual(decoded.coinSpecific?.salt, '0x7');
      assert.strictEqual(decoded.coinSpecific?.forwarderVersion, 1);
      assert.strictEqual(decoded.index, 7);
    });

    it('should validate body with TSS/MPC wallet parameters', function () {
      const validBody = {
        address: '0xa33f0975f53cdcfcc0cb564d25fb5be03b0651cf',
        baseAddress: '0xc012041dac143a59fa491db3a2b67b69bd78b685',
        keychains: [
          {
            pub: 'user_pub',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
          {
            pub: 'backup_pub',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
          {
            pub: 'bitgo_pub',
            commonKeychain:
              '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e',
          },
        ],
        walletVersion: 6,
        index: 7,
        coinSpecific: {
          forwarderVersion: 5,
          feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
        },
      };

      const decoded = assertDecode(t.type(IsWalletAddressBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.baseAddress, validBody.baseAddress);
      assert.strictEqual(decoded.walletVersion, 6);
      assert.strictEqual(decoded.index, 7);
      assert.strictEqual(decoded.coinSpecific?.forwarderVersion, 5);
    });

    it('should validate body with all optional parameters', function () {
      const validBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        baseAddress: '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f',
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        walletVersion: 2,
        index: 23,
        coinSpecific: {
          salt: '0x17',
          forwarderVersion: 2,
          feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          baseAddress: '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4',
        },
        impliedForwarderVersion: 2,
        format: 'hex',
        addressType: 'forwarder',
        rootAddress: '0x...',
      };

      const decoded = assertDecode(t.type(IsWalletAddressBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.impliedForwarderVersion, 2);
      assert.strictEqual(decoded.format, 'hex');
    });

    it('should reject body with missing address', function () {
      const invalidBody = {
        keychains: [{ pub: 'xpub1...' }],
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressBody), invalidBody);
      });
    });

    it('should reject body with missing keychains', function () {
      const invalidBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressBody), invalidBody);
      });
    });

    it('should reject body with non-array keychains', function () {
      const invalidBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: 'not-an-array',
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressBody), invalidBody);
      });
    });

    it('should reject body with invalid walletVersion type', function () {
      const invalidBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }],
        walletVersion: '1', // Should be number, not string
      };

      assert.throws(() => {
        assertDecode(t.type(IsWalletAddressBody), invalidBody);
      });
    });

    it('should accept index as number or string', function () {
      const validBodyWithNumber = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }],
        index: 7,
      };

      const validBodyWithString = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }],
        index: '7',
      };

      const decodedNumber = assertDecode(t.type(IsWalletAddressBody), validBodyWithNumber);
      assert.strictEqual(decodedNumber.index, 7);

      const decodedString = assertDecode(t.type(IsWalletAddressBody), validBodyWithString);
      assert.strictEqual(decodedString.index, '7');
    });
  });

  describe('IsWalletAddressResponse', function () {
    it('should validate 200 response with true', function () {
      const validResponse = true;

      const decoded = assertDecode(IsWalletAddressResponse[200], validResponse);
      assert.strictEqual(decoded, true);
    });

    it('should validate 200 response with false', function () {
      const validResponse = false;

      const decoded = assertDecode(IsWalletAddressResponse[200], validResponse);
      assert.strictEqual(decoded, false);
    });

    it('should reject 200 response with non-boolean', function () {
      const invalidResponse = 'true';

      assert.throws(() => {
        assertDecode(IsWalletAddressResponse[200], invalidResponse);
      });
    });
  });

  describe('PostIsWalletAddress route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostIsWalletAddress.path, '/api/v2/{coin}/wallet/{id}/iswalletaddress');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostIsWalletAddress.method, 'POST');
    });

    it('should have the correct response types', function () {
      assert.ok(PostIsWalletAddress.response[200]);
      assert.ok(PostIsWalletAddress.response[400]);
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

    describe('BIP32 Wallet Address Verification (V1, V2, V4)', function () {
      it('should verify forwarder address for wallet version 1', async function () {
        const requestBody = {
          address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
          baseAddress: '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f',
          coinSpecific: {
            salt: '0x7',
            forwarderVersion: 1,
          },
          keychains: [
            {
              pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVmsa5SriNrfKZZAcAvRgxh1Augm6s8yoD8gSkq2FdZ8YCdVXUgLjf9QxvdYAJK5UthAmpQshU',
              ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d',
            },
            {
              pub: 'xpub661MyMwAqRbcF46pRHda3sZbuPzza9A9MiqAU9JRod8huYtyV4NY2oeJXsis7r26L1vmLntf9BcZJe1m4CQNSvYWfwpe1hSpo6J4x6YF1eN',
              ethAddress: '0x5bdf3ae1d2c2fadeeb70a45872bf4f4252312b55',
            },
            {
              pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79HokYLc5PXZM19V8UrbuLdVRaCQMs4EeCAjnqmoYXqfyusTU46WoZMDyLpmTzoUX66ZBwGFjt1a',
              ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
          ],
          index: 7,
          walletVersion: 1,
        };

        // Mock the wallet and isWalletAddress method
        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);

        sinon.assert.calledOnce(isWalletAddressStub);
      });

      it('should verify forwarder address for wallet version 2', async function () {
        const requestBody = {
          address: '0xf636ceddffe41d106586875c0e56dc8feb6268f7',
          baseAddress: '0xdc485da076ed4a2b19584e9a1fdbb974f89b60f4',
          coinSpecific: {
            salt: '0x17',
            forwarderVersion: 2,
          },
          keychains: [
            {
              pub: 'xpub661MyMwAqRbcGrCxCX39zb3TvYjTqfUGwEUZHjnraRFm1WeMw9gfCD1wwc2wUDmBBZ2TkccJMwf5eBTja8r3z6HMxoTZGW6nvyoJMQFsecv',
              ethAddress: '0x9d16bb867b792c5e3bf636a0275f2db8601bd7d4',
            },
            {
              pub: 'xpub661MyMwAqRbcGKhdeC4nr1ta8d27xThtfFFHgbxWMrVb595meMS8i3fBMrTz8EdQMWBKHHKzxapGgheoMymVvRcQmaGDykRTBbtXqbiu9ps',
              ethAddress: '0x2dfce5cfeb5c03fbe680cd39ac0d2b25399b7d22',
            },
            {
              pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79HokYLc5PXZM19V8UrbuLdVRaCQMs4EeCAjnqmoYXqfyusTU46WoZMDyLpmTzoUX66ZBwGFjt1a',
              ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
          ],
          index: 23,
          walletVersion: 2,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });

      it('should verify base address for wallet version 1', async function () {
        const baseAddress = '0xe1253bcce7d87db522fbceec6e55c9f78c376d9f';
        const requestBody = {
          address: baseAddress,
          baseAddress: baseAddress,
          coinSpecific: {
            salt: '0x5',
            forwarderVersion: 1,
          },
          keychains: [
            {
              pub: 'xpub661MyMwAqRbcGVb3PfCzwiEX94AB1nJQtzVm...',
              ethAddress: '0xf45dadce751a317957f2a247ff37cb764b97620d',
            },
            {
              pub: 'xpub661MyMwAqRbcF46pRHda3sZbuPzza9A9MiqA...',
              ethAddress: '0x5bdf3ae1d2c2fadeeb70a45872bf4f4252312b55',
            },
            {
              pub: 'xpub661MyMwAqRbcGzTn5eyNGDkb18R43nH79Hok...',
              ethAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
            },
          ],
          index: 0,
          walletVersion: 1,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });
    });

    describe('TSS/MPC Wallet Address Verification (V3, V5, V6)', function () {
      const commonKeychain =
        '033b02aac4f038fef5118350b77d302ec6202931ca2e7122aad88994ffefcbc70a6069e662436236abb1619195232c41580204cb202c22357ed8f53e69eac5c69e';

      it('should verify forwarder address for wallet version 5 (TSS)', async function () {
        const requestBody = {
          address: '0xd63b5e2b8d1b4fba3625460508900bf2a0499a4d',
          baseAddress: '0xf1e3d30798acdf3a12fa5beb5fad8efb23d5be11',
          coinSpecific: {
            salt: '0x75',
            forwarderVersion: 4,
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
          keychains: [
            { pub: 'user_pub', commonKeychain },
            { pub: 'backup_pub', commonKeychain },
            { pub: 'bitgo_pub', commonKeychain },
          ],
          index: 117,
          walletVersion: 5,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });

      it('should verify forwarder address for wallet version 6 (TSS)', async function () {
        const requestBody = {
          address: '0xa33f0975f53cdcfcc0cb564d25fb5be03b0651cf',
          baseAddress: '0xc012041dac143a59fa491db3a2b67b69bd78b685',
          coinSpecific: {
            forwarderVersion: 5,
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
          keychains: [
            { pub: 'user_pub', commonKeychain },
            { pub: 'backup_pub', commonKeychain },
            { pub: 'bitgo_pub', commonKeychain },
          ],
          index: 7,
          walletVersion: 6,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });

      it('should verify base address for wallet version 6 (TSS)', async function () {
        const baseAddress = '0xc012041dac143a59fa491db3a2b67b69bd78b685';
        const requestBody = {
          address: baseAddress,
          baseAddress: baseAddress,
          coinSpecific: {
            salt: '0x0',
            forwarderVersion: 5,
            feeAddress: '0xb1e725186990b86ca8efed08a3ccda9c9f400f09',
          },
          keychains: [
            { pub: 'user_pub', commonKeychain },
            { pub: 'backup_pub', commonKeychain },
            { pub: 'bitgo_pub', commonKeychain },
          ],
          index: 0,
          walletVersion: 6,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });

      it('should verify MPC wallet address (V3)', async function () {
        const requestBody = {
          address: '0x01153f3adfe454a72589ca9ef74f013c19e54961',
          coinSpecific: {
            forwarderVersion: 3,
          },
          keychains: [
            { pub: 'user_pub', commonKeychain },
            { pub: 'backup_pub', commonKeychain },
            { pub: 'bitgo_pub', commonKeychain },
          ],
          index: 0,
          walletVersion: 3,
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/teth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });
    });

    describe('Invalid Address Cases', function () {
      it('should return false for wrong address', async function () {
        const requestBody = {
          address: '0x0000000000000000000000000000000000000001',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          coinSpecific: {
            forwarderVersion: 3,
          },
          keychains: [
            { pub: 'user_pub', commonKeychain: '03...' },
            { pub: 'backup_pub', commonKeychain: '03...' },
            { pub: 'bitgo_pub', commonKeychain: '03...' },
          ],
          index: 0,
          walletVersion: 3,
        };

        const isWalletAddressStub = sinon.stub().resolves(false);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/teth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, false);
      });
    });

    describe('Forwarder Version 0 (V0)', function () {
      it('should return true for v0 forwarder (cannot verify)', async function () {
        const requestBody = {
          address: '0x28904591f735994f050804fda3b61b813b16e04c',
          baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
          walletVersion: 1,
          keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
          coinSpecific: {
            salt: '0xc5a',
            forwarderVersion: 0,
          },
        };

        const isWalletAddressStub = sinon.stub().resolves(true);
        const mockWallet = {
          baseCoin: {
            isWalletAddress: isWalletAddressStub,
          },
        };
        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = {
          get: walletsGetStub,
        };
        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/teth/wallet/test-wallet-id/iswalletaddress')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body, true);
      });
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  describe('Error Handling Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should return 400 for missing address field', async function () {
      const requestBody = {
        keychains: [{ pub: 'xpub1...' }],
      };

      const result = await agent
        .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
    });

    it('should return 400 for missing keychains field', async function () {
      const requestBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
      };

      const result = await agent
        .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
    });

    it('should return 400 for invalid keychains (not an array)', async function () {
      const requestBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: 'not-an-array',
      };

      const result = await agent
        .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
    });

    it('should return 400 for invalid walletVersion type', async function () {
      const requestBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }],
        walletVersion: '1', // Should be number
      };

      const result = await agent
        .post('/api/v2/hteth/wallet/test-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
    });

    it('should handle isWalletAddress throwing InvalidAddressError', async function () {
      const requestBody = {
        address: '0xinvalid',
        baseAddress: '0xdf07117705a9f8dc4c2a78de66b7f1797dba9d4e',
        keychains: [{ pub: 'xpub1...' }, { pub: 'xpub2...' }, { pub: 'xpub3...' }],
        coinSpecific: {
          salt: '0xc5a',
          forwarderVersion: 1,
        },
      };

      const isWalletAddressStub = sinon.stub().rejects(new Error('invalid address: 0xinvalid'));
      const mockWallet = {
        baseCoin: {
          isWalletAddress: isWalletAddressStub,
        },
      };
      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = {
        get: walletsGetStub,
      };
      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/teth/wallet/test-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle wallet not found', async function () {
      const requestBody = {
        address: '0x6069a4baf2360bf67a6d02a7fc43d8f3910016ae',
        keychains: [{ pub: 'xpub1...' }],
      };

      const walletsGetStub = sinon.stub().rejects(new Error('wallet not found'));
      const mockWallets = {
        get: walletsGetStub,
      };
      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/hteth/wallet/invalid-wallet-id/iswalletaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
