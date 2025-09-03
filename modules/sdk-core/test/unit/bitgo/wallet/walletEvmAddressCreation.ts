import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';

describe('Wallet - EVM Keyring Address Creation', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  beforeEach(function () {
    mockBitGo = {
      post: sinon.stub(),
      setRequestTracer: sinon.stub(),
    };

    mockBaseCoin = {
      isEVM: sinon.stub(),
      supportsTss: sinon.stub().returns(true),
      getFamily: sinon.stub().returns('eth'),
      isValidAddress: sinon.stub(),
      keychains: sinon.stub(),
      url: sinon.stub().returns('/test/wallet/address'),
    };

    mockWalletData = {
      id: 'test-wallet-id',
      keys: ['user-key', 'backup-key', 'bitgo-key'],
    };

    wallet = new Wallet(mockBitGo, mockBaseCoin, mockWalletData);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('createAddress with EVM keyring parameters', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(true);
      mockBaseCoin.isValidAddress.returns(true);
      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      });
    });

    it('should create address with referenceCoin and referenceAddress', async function () {
      const mockAddressResponse = {
        id: '507f1f77bcf86cd799439012',
        address: '0x1234567890123456789012345678901234567890',
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      const result = await wallet.createAddress({
        chain: 0,
        label: 'Test EVM Address',
        referenceCoin: 'hteth',
        referenceAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f780EAD',
      });

      result.should.have.property('id', '507f1f77bcf86cd799439012');
      result.should.have.property('address', '0x1234567890123456789012345678901234567890');
      mockBitGo.post.should.have.been.calledOnce;
    });

    it('should throw error if only referenceCoin provided without referenceAddress', async function () {
      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'hteth',
          // Missing referenceAddress
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress is required when using referenceCoin for EVM keyring');
      }
    });

    it('should create address with only referenceAddress (referenceCoin is optional)', async function () {
      const mockAddressResponse = {
        id: '507f1f77bcf86cd799439012',
        address: '0x1234567890123456789012345678901234567890',
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      } as any);

      const result = await wallet.createAddress({
        chain: 0,
        label: 'Test Address',
        referenceAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f780EAD',
        // referenceCoin is optional
      });

      result.should.have.property('id', '507f1f77bcf86cd799439012');
      result.should.have.property('address', '0x1234567890123456789012345678901234567890');
    });

    it('should throw error if referenceCoin is not a string', async function () {
      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 123 as any,
          referenceAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f780EAD',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceCoin has to be a string');
      }
    });

    it('should throw error if referenceAddress is not a string', async function () {
      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'hteth',
          referenceAddress: 123 as any,
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress has to be a string');
      }
    });

    it('should throw error if referenceAddress is not a valid address', async function () {
      mockBaseCoin.isValidAddress.returns(false);

      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'hteth',
          referenceAddress: 'invalid-address',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress must be a valid address');
      }
    });

    it('should throw error for non-EVM chains with referenceCoin', async function () {
      mockBaseCoin.isEVM.returns(false);

      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'btc',
          referenceAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress is only supported for EVM chains');
      }
    });

    it('should throw error for non-EVM chains with referenceAddress', async function () {
      mockBaseCoin.isEVM.returns(false);

      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'btc',
          referenceAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress is only supported for EVM chains');
      }
    });

    it('should create address without reference parameters for regular addresses', async function () {
      const mockAddressResponse = {
        id: 'regular-address-id',
        address: '0x9876543210987654321098765432109876543210',
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      const result = await wallet.createAddress({
        chain: 0,
        label: 'Regular Address',
        // No reference parameters
      });

      result.should.have.property('id', 'regular-address-id');
      result.should.have.property('address', '0x9876543210987654321098765432109876543210');
      mockBitGo.post.should.have.been.calledOnce;
    });
  });

  describe('Non-EVM chains', function () {
    beforeEach(function () {
      mockBaseCoin.isEVM.returns(false);
    });

    it('should not allow referenceCoin for non-EVM chains', async function () {
      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          referenceCoin: 'btc',
          referenceAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('referenceAddress is only supported for EVM chains');
      }
    });

    it('should create regular addresses for non-EVM chains', async function () {
      const mockAddressResponse = {
        id: 'btc-address-id',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      mockBitGo.post.returns({
        send: sinon.stub().returns({
          result: sinon.stub().resolves(mockAddressResponse),
        }),
      });

      mockBaseCoin.keychains.returns({
        get: sinon.stub().resolves({ id: 'keychain-id', pub: 'public-key' }),
      });

      const result = await wallet.createAddress({
        chain: 0,
        label: 'BTC Address',
      });

      result.should.have.property('id', 'btc-address-id');
      result.should.have.property('address', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      mockBitGo.post.should.have.been.calledOnce;
    });
  });
});
