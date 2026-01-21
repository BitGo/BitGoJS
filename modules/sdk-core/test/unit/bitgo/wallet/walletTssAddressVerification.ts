import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import { KeyIndices } from '../../../../src/bitgo/keychain';

describe('Wallet - TSS Address Verification with Derivation Prefix', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;
  let mockKeychains: any[];

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      supportsTss: sinon.stub().returns(true),
      getFamily: sinon.stub().returns('sol'),
      getMPCAlgorithm: sinon.stub().returns('eddsa'),
      isValidAddress: sinon.stub().returns(true),
      isWalletAddress: sinon.stub(),
      keychains: sinon.stub(),
      url: sinon.stub().returns('/api/v2/sol/wallet/test-wallet-id/address'),
    };

    // Default keychains setup - all with commonKeychain
    mockKeychains = [
      {
        id: 'user-key-id',
        type: 'tss',
        commonKeychain:
          '8ea32ecacfc83effbd2e2790ee44fa7c59b4d86c29a12f09fb613d8195f93f4e21875cad3b98adada40c040c54c3569467df41a020881a6184096378701862bd',
        derivedFromParentWithSeed: 'test-seed-user',
      },
      {
        id: 'backup-key-id',
        type: 'tss',
        commonKeychain:
          '8ea32ecacfc83effbd2e2790ee44fa7c59b4d86c29a12f09fb613d8195f93f4e21875cad3b98adada40c040c54c3569467df41a020881a6184096378701862bd',
      },
      {
        id: 'bitgo-key-id',
        type: 'tss',
        commonKeychain:
          '8ea32ecacfc83effbd2e2790ee44fa7c59b4d86c29a12f09fb613d8195f93f4e21875cad3b98adada40c040c54c3569467df41a020881a6184096378701862bd',
      },
    ];

    mockBaseCoin.keychains.returns({
      get: sinon.stub().callsFake((params: any) => {
        const keyIndex = mockWalletData.keys.indexOf(params.id);
        return Promise.resolve(mockKeychains[keyIndex]);
      }),
    });

    mockWalletData = {
      id: 'test-wallet-id',
      keys: ['user-key-id', 'backup-key-id', 'bitgo-key-id'],
      multisigType: 'tss',
      coinSpecific: {
        walletVersion: 3,
      },
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Custodial TSS Wallet - No Derivation Prefix', function () {
    beforeEach(function () {
      mockWalletData.type = 'custodial';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    });

    it('should not extract derivation prefix for custodial wallets', async function () {
      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {},
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      await wallet.createAddress({ chain: 0 });

      // Verify that custodial wallets don't use derivationPrefix
      // (their commonKeychain already accounts for the prefix)
      const verificationCall = mockBaseCoin.isWalletAddress.getCall(0);
      const verificationData = verificationCall.args[0];
      assert.strictEqual(verificationData.derivationPrefix, undefined);
    });
  });

  describe('Cold/SMC TSS Wallet - Derivation Prefix from User Keychain', function () {
    beforeEach(function () {
      mockWalletData.type = 'cold';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    });

    it('should extract derivation prefix from User keychain for cold/SMC wallets', async function () {
      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {},
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      await wallet.createAddress({ chain: 0 });

      // Verify that isWalletAddress was called with derivationPrefix from User keychain
      const verificationCall = mockBaseCoin.isWalletAddress.getCall(0);
      const verificationData = verificationCall.args[0];

      verificationData.should.have.property('derivationPrefix');
      verificationData.derivationPrefix.should.equal(getDerivationPath('test-seed-user'));
      verificationData.derivationPrefix.should.match(/^m\/999999\/\d+\/\d+$/);
    });

    it('should handle missing derivedFromParentWithSeed gracefully for cold wallet', async function () {
      // Remove derivedFromParentWithSeed from User keychain
      mockKeychains[KeyIndices.USER].derivedFromParentWithSeed = undefined;

      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {},
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      await wallet.createAddress({ chain: 0 });

      // Should not have derivationPrefix if seed is missing (no prefix used in this case)
      const verificationCall = mockBaseCoin.isWalletAddress.getCall(0);
      const verificationData = verificationCall.args[0];
      assert.strictEqual(verificationData.derivationPrefix, undefined);
    });
  });

  describe('Non-TSS Wallet - No Derivation Prefix', function () {
    beforeEach(function () {
      mockWalletData.multisigType = 'onchain';
      mockWalletData.type = 'cold';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
    });

    it('should not extract derivation prefix for non-TSS wallets', async function () {
      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {},
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      await wallet.createAddress({ chain: 0 });

      // Verify that derivationPrefix is not set for non-TSS wallets
      const verificationCall = mockBaseCoin.isWalletAddress.getCall(0);
      const verificationData = verificationCall.args[0];
      assert.strictEqual(verificationData.derivationPrefix, undefined);
    });
  });

  describe('Edge Cases', function () {
    it('should handle wallet without USER keychain', async function () {
      // Set keys array to only have backup keychain (no USER keychain at index 0)
      mockWalletData.keys = ['backup-key-id']; // Only backup keychain, no USER
      mockWalletData.type = 'cold';

      // Update mock to return backup keychain when requested
      mockBaseCoin.keychains.returns({
        get: sinon.stub().callsFake((params: any) => {
          if (params.id === 'backup-key-id') {
            return Promise.resolve(mockKeychains[KeyIndices.BACKUP]);
          }
          return Promise.resolve(null);
        }),
      });

      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);

      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {},
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      await wallet.createAddress({ chain: 0 });

      const verificationCall = mockBaseCoin.isWalletAddress.getCall(0);
      const verificationData = verificationCall.args[0];
      // Should not have derivationPrefix if USER keychain doesn't exist in keys array
      assert.strictEqual(verificationData.derivationPrefix, undefined);
    });

    it('should handle pendingChainInitialization correctly', async function () {
      mockWalletData.type = 'cold';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);

      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {
          pendingChainInitialization: true,
        },
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      // Should skip verification when pendingChainInitialization is true
      await wallet.createAddress({ chain: 0 });

      // isWalletAddress should not be called when pendingChainInitialization is true
      mockBaseCoin.isWalletAddress.should.not.have.been.called;
    });

    it('should handle forwarderVersion 1 with pendingChainInitialization', async function () {
      mockWalletData.type = 'cold';
      wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);

      const mockAddressResponse = {
        id: 'address-id',
        address: '6FjshVqwmDH74wfxkZrJaRGEjTeJQL4ViL6X18VXUNAY',
        index: 0,
        coinSpecific: {
          pendingChainInitialization: true,
          forwarderVersion: 1,
        },
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.isWalletAddress.resolves(true);

      // Should verify even with pendingChainInitialization when forwarderVersion is 1
      await wallet.createAddress({ chain: 0, forwarderVersion: 1 });

      mockBaseCoin.isWalletAddress.should.have.been.calledOnce;
    });
  });
});
