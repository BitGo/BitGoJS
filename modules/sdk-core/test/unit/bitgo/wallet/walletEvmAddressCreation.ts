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

    it('should create address with evmKeyRingReferenceAddress', async function () {
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

        evmKeyRingReferenceAddress: '0x742d35Cc6634C0532925a3b8D404fddF4f780EAD',
      });

      result.should.have.property('id', '507f1f77bcf86cd799439012');
      result.should.have.property('address', '0x1234567890123456789012345678901234567890');
      mockBitGo.post.should.have.been.calledOnce;
    });

    it('should throw error if evmKeyRingReferenceAddress is not a string', async function () {
      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          evmKeyRingReferenceAddress: 123 as any,
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceAddress has to be a string');
      }
    });

    it('should throw error if evmKeyRingReferenceAddress is not a valid address', async function () {
      mockBaseCoin.isValidAddress.returns(false);

      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          evmKeyRingReferenceAddress: 'invalid-address',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceAddress must be a valid address');
      }
    });

    it('should throw error for non-EVM chains with evmKeyRingReferenceAddress', async function () {
      mockBaseCoin.isEVM.returns(false);

      try {
        await wallet.createAddress({
          chain: 0,
          label: 'Test Address',
          evmKeyRingReferenceAddress: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('evmKeyRingReferenceAddress is only supported for EVM chains');
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
