import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src/bitgo/wallet/wallet';

describe('Wallet - getAccountResources', function () {
  let wallet: Wallet;
  let mockBitGo: any;
  let mockBaseCoin: any;
  let mockWalletData: any;

  beforeEach(function () {
    mockBitGo = {
      get: sinon.stub(),
    };

    mockBaseCoin = {
      url: sinon.stub().returns('/test/coin'),
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

  describe('getAccountResources', function () {
    it('should call WP API with addresses parameter', async function () {
      const mockResponse = {
        resources: [
          { address: 'address1', balance: 100 },
          { address: 'address2', balance: 200 },
        ],
      };

      mockBitGo.get.returns({
        query: sinon.stub().returns({
          result: sinon.stub().resolves(mockResponse),
        }),
      });

      const addresses = ['address1', 'address2'];
      const result = await wallet.getAccountResources({ addresses });

      result.should.deepEqual(mockResponse);
      mockBitGo.get.should.have.been.calledOnce;
      const queryStub = mockBitGo.get.returnValues[0].query;
      queryStub.should.have.been.calledWith({ addresses });
    });

    it('should call WP API with addresses and assetName parameters', async function () {
      const mockResponse = {
        resources: [{ address: 'address1', balance: 100, token: 'USDT' }],
      };

      mockBitGo.get.returns({
        query: sinon.stub().returns({
          result: sinon.stub().resolves(mockResponse),
        }),
      });

      const addresses = ['address1'];
      const assetName = 'USDT';
      const result = await wallet.getAccountResources({ addresses, assetName });

      result.should.deepEqual(mockResponse);
      mockBitGo.get.should.have.been.calledOnce;
      const queryStub = mockBitGo.get.returnValues[0].query;
      queryStub.should.have.been.calledWith({ addresses, assetName });
    });

    it('should throw error if addresses is not an array', async function () {
      try {
        await wallet.getAccountResources({ addresses: 'not-an-array' as any });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('addresses must be an array');
      }
    });

    it('should throw error if addresses array is empty', async function () {
      try {
        await wallet.getAccountResources({ addresses: [] });
        assert.fail('Should have thrown error');
      } catch (error) {
        error.message.should.equal('addresses array cannot be empty');
      }
    });

    it('should not include assetName in query if not provided', async function () {
      const mockResponse = { resources: [] };

      mockBitGo.get.returns({
        query: sinon.stub().returns({
          result: sinon.stub().resolves(mockResponse),
        }),
      });

      const addresses = ['address1'];
      await wallet.getAccountResources({ addresses });

      const queryStub = mockBitGo.get.returnValues[0].query;
      const queryArg = queryStub.firstCall.args[0];
      queryArg.should.deepEqual({ addresses });
      queryArg.should.not.have.property('assetName');
    });
  });
});
