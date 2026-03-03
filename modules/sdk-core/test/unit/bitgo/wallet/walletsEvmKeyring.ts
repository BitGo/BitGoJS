import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallets } from '../../../../src/bitgo/wallet/wallets';

describe('Wallets', function () {
  let wallets: Wallets;
  let mockBitGo: any;
  let mockBaseCoin: any;

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      encrypt: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      isEVM: sinon.stub(),
      supportsTss: sinon.stub().returns(true),
      getFamily: sinon.stub().returns('eth'),
      getDefaultMultisigType: sinon.stub(),
      keychains: sinon.stub(),
      url: sinon.stub().returns('/test/url'),
      isValidMofNSetup: sinon.stub(),
      getConfig: sinon.stub().returns({ features: [] }),
    };

    wallets = new Wallets(mockBitGo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('EVM Keyring - generateWallet', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(true);
      mockBaseCoin.supportsTss.returns(true);
      mockBaseCoin.getDefaultMultisigType.returns('tss');
    });

    it('should create EVM wallet with evmKeyRingReferenceWalletId', async function () {
      const mockWalletResponse = {
        id: '597f1f77bcf86cd799439011',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockWalletResponse),
        }),
      } as any);

      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      } as any);

      const result = await wallets.generateWallet({
        label: 'Test EVM Wallet',
        evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
      });

      result.should.have.property('wallet');
      result.should.have.property('userKeychain');
      result.should.have.property('backupKeychain');
      result.should.have.property('bitgoKeychain');
    });

    it('should throw error if evmKeyRingReferenceWalletId provided for non-EVM chain', async function () {
      mockBaseCoin.isEVM.returns(false);

      try {
        await wallets.generateWallet({
          label: 'Test Wallet',
          evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceWalletId is only supported for EVM chains');
      }
    });

    it('should throw error if evmKeyRingReferenceWalletId is not a string', async function () {
      try {
        await wallets.generateWallet({
          label: 'Test Wallet',
          evmKeyRingReferenceWalletId: 123 as any,
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('invalid evmKeyRingReferenceWalletId argument, expecting string');
      }
    });
  });

  describe('EVM Keyring - add method', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(true);
    });

    it('should add EVM wallet with evmKeyRingReferenceWalletId without multisig validation', async function () {
      const mockWalletResponse = {
        id: 'new-wallet-id',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockWalletResponse),
        }),
      } as any);

      const result = await wallets.add({
        label: 'Test EVM Wallet',
        evmKeyRingReferenceWalletId: 'reference-wallet-id',
      });

      result.should.have.property('wallet');
      mockBitGo.post.should.have.been.calledOnce;
    });

    it('should skip multisig validation for EVM wallets with evmKeyRingReferenceWalletId', async function () {
      const mockWalletResponse = {
        id: 'new-wallet-id',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockWalletResponse),
        }),
      } as any);

      // This should not throw error even without keys, m, n parameters
      const result = await wallets.add({
        label: 'Test EVM Wallet',
        evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
        // No keys, m, n provided - should be fine for EVM keyring
      });

      result.should.have.property('wallet');
    });

    it('should throw error for non-EVM chains with evmKeyRingReferenceWalletId', async function () {
      mockBaseCoin.isEVM.returns(false);

      try {
        await wallets.add({
          label: 'Test Wallet',
          evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceWalletId is only supported for EVM chains');
      }
    });

    it('should still validate multisig for regular wallets', async function () {
      mockBaseCoin.isEVM.returns(true);

      try {
        await wallets.add({
          label: 'Test Wallet',
          type: 'hot',
          // No evmKeyRingReferenceWalletId, so should require keys, m, n
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('invalid argument');
      }
    });
  });

  describe('Non-EVM chains', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(false);
    });

    it('should not allow evmKeyRingReferenceWalletId for non-EVM chains in generateWallet', async function () {
      try {
        await wallets.generateWallet({
          label: 'Test Wallet',
          evmKeyRingReferenceWalletId: 'reference-wallet-id',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceWalletId is only supported for EVM chains');
      }
    });

    it('should not allow evmKeyRingReferenceWalletId for non-EVM chains in add', async function () {
      try {
        await wallets.add({
          label: 'Test Wallet',
          evmKeyRingReferenceWalletId: 'reference-wallet-id',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceWalletId is only supported for EVM chains');
      }
    });
  });

  describe('EVM Keyring - Cold/Custodial wallet support', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(true);
      mockBaseCoin.supportsTss.returns(true);
      mockBaseCoin.getDefaultMultisigType.returns('tss');
    });

    it('should create cold EVM keyring wallet with enterprise (type inherited from reference)', async function () {
      const mockWalletResponse = {
        id: '597f1f77bcf86cd799439011',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      const sendStub = sinon.stub().returns({
        result: sinon.stub().resolves(mockWalletResponse),
      });

      mockBitGo.post.returns({
        send: sendStub,
      } as any);

      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      } as any);

      const result = await wallets.generateWallet({
        label: 'Cold EVM Keyring Wallet',
        evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
        enterprise: 'test-enterprise-id',
      });

      result.should.have.property('wallet');

      const sentParams = sendStub.firstCall.args[0];
      sentParams.should.not.have.property('type');
      sentParams.should.have.property('enterprise', 'test-enterprise-id');
      sentParams.should.have.property('evmKeyRingReferenceWalletId', '507f1f77bcf86cd799439011');
    });

    it('should create custodial EVM keyring wallet with enterprise (type inherited from reference)', async function () {
      const mockWalletResponse = {
        id: '597f1f77bcf86cd799439012',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      const sendStub = sinon.stub().returns({
        result: sinon.stub().resolves(mockWalletResponse),
      });

      mockBitGo.post.returns({
        send: sendStub,
      } as any);

      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      } as any);

      const result = await wallets.generateWallet({
        label: 'Custodial EVM Keyring Wallet',
        evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
        enterprise: 'test-enterprise-id',
      });

      result.should.have.property('wallet');

      const sentParams = sendStub.firstCall.args[0];
      sentParams.should.not.have.property('type');
      sentParams.should.have.property('enterprise', 'test-enterprise-id');
      sentParams.should.have.property('evmKeyRingReferenceWalletId', '507f1f77bcf86cd799439011');
    });

    it('should create EVM keyring wallet without type (inherits from reference wallet)', async function () {
      const mockWalletResponse = {
        id: '597f1f77bcf86cd799439013',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      const sendStub = sinon.stub().returns({
        result: sinon.stub().resolves(mockWalletResponse),
      });

      mockBitGo.post.returns({
        send: sendStub,
      } as any);

      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      } as any);

      const result = await wallets.generateWallet({
        label: 'Hot EVM Keyring Wallet',
        evmKeyRingReferenceWalletId: '507f1f77bcf86cd799439011',
      });

      result.should.have.property('wallet');

      const sentParams = sendStub.firstCall.args[0];
      sentParams.should.not.have.property('type');
      sentParams.should.have.property('evmKeyRingReferenceWalletId', '507f1f77bcf86cd799439011');
    });

    it('should pass enterprise parameter for cold EVM keyring wallet via add method', async function () {
      const mockWalletResponse = {
        id: 'new-cold-wallet-id',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      const sendStub = sinon.stub().returns({
        result: sinon.stub().resolves(mockWalletResponse),
      });

      mockBitGo.post.returns({
        send: sendStub,
      } as any);

      const result = await wallets.add({
        label: 'Cold EVM Keyring Child',
        evmKeyRingReferenceWalletId: 'cold-parent-wallet-id',
        enterprise: 'enterprise-123',
      });

      result.should.have.property('wallet');

      const sentParams = sendStub.firstCall.args[0];
      sentParams.should.not.have.property('type');
      sentParams.should.have.property('enterprise', 'enterprise-123');
      sentParams.should.have.property('evmKeyRingReferenceWalletId', 'cold-parent-wallet-id');
    });

    it('should pass enterprise parameter for custodial EVM keyring wallet via add method', async function () {
      const mockWalletResponse = {
        id: 'new-custodial-wallet-id',
        keys: ['user-key', 'backup-key', 'bitgo-key'],
      };

      const sendStub = sinon.stub().returns({
        result: sinon.stub().resolves(mockWalletResponse),
      });

      mockBitGo.post.returns({
        send: sendStub,
      } as any);

      const result = await wallets.add({
        label: 'Custodial EVM Keyring Child',
        evmKeyRingReferenceWalletId: 'custodial-parent-wallet-id',
        enterprise: 'enterprise-456',
      });

      result.should.have.property('wallet');

      const sentParams = sendStub.firstCall.args[0];
      sentParams.should.not.have.property('type');
      sentParams.should.have.property('enterprise', 'enterprise-456');
      sentParams.should.have.property('evmKeyRingReferenceWalletId', 'custodial-parent-wallet-id');
    });
  });
});
