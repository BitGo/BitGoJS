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

  describe('FLR C wallet creation - sourceFlrpWalletId', function () {
    let generateMpcWalletStub: sinon.SinonStub;
    const mockWalletResult = {
      wallet: { id: 'new-flrc-wallet-id' },
      userKeychain: { id: 'user-key-id' },
      backupKeychain: { id: 'backup-key-id' },
      bitgoKeychain: { id: 'bitgo-key-id' },
    };

    beforeEach(function () {
      mockBaseCoin.isEVM.returns(true);
      mockBaseCoin.supportsTss.returns(true);
      mockBaseCoin.getDefaultMultisigType.returns('tss');
      // Stub the private generateMpcWallet to avoid needing full TSS key-generation mocks
      generateMpcWalletStub = sinon.stub(wallets as any, 'generateMpcWallet').resolves(mockWalletResult);
    });

    it('should pass sourceFlrpWalletId to generateMpcWallet when provided (FLR C derived wallet)', async function () {
      await wallets.generateWallet({
        label: 'FLR C Wallet',
        passphrase: 'test-passphrase',
        multisigType: 'tss',
        walletVersion: 3,
        enterprise: 'test-enterprise-id',
        sourceFlrpWalletId: 'flrp-wallet-id-123',
      });

      generateMpcWalletStub.calledOnce.should.be.true();
      const callArgs = generateMpcWalletStub.getCall(0).args[0];
      callArgs.should.have.property('sourceFlrpWalletId', 'flrp-wallet-id-123');
    });

    it('should NOT pass sourceFlrpWalletId for existing coins (ETH, SOL, etc.) that omit it', async function () {
      // Existing coins like ETH and SOL never pass sourceFlrpWalletId, so it should remain
      // undefined in the params sent to generateMpcWallet — confirming no behaviour change.
      await wallets.generateWallet({
        label: 'ETH TSS Wallet',
        passphrase: 'test-passphrase',
        multisigType: 'tss',
        walletVersion: 3,
        enterprise: 'test-enterprise-id',
        // no sourceFlrpWalletId
      });

      generateMpcWalletStub.calledOnce.should.be.true();
      const callArgs = generateMpcWalletStub.getCall(0).args[0];
      assert.strictEqual(callArgs.sourceFlrpWalletId, undefined);
    });

    it('should pass sourceFlrpWalletId as undefined when not provided (no accidental injection)', async function () {
      // Belt-and-suspenders: even if called with an explicit undefined, the field must stay absent
      await wallets.generateWallet({
        label: 'ETH TSS Wallet 2',
        passphrase: 'test-passphrase',
        multisigType: 'tss',
        walletVersion: 3,
        enterprise: 'test-enterprise-id',
        sourceFlrpWalletId: undefined,
      });

      const callArgs = generateMpcWalletStub.getCall(0).args[0];
      assert.strictEqual(callArgs.sourceFlrpWalletId, undefined);
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
});
