import * as assert from 'assert';
import * as sinon from 'sinon';
import 'should';
import { Wallet } from '../../../../src';

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
      supportsTss: sinon.stub().returns(false),
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
      sinon.assert.calledOnce(mockBitGo.get);
      const queryStub = mockBitGo.get.returnValues[0].query;
      sinon.assert.calledWith(queryStub, { addresses });
    });

    it('should call WP API with addresses and destinationAddress parameters', async function () {
      const mockResponse = {
        resources: [{ address: 'address1', balance: 100 }],
      };

      mockBitGo.get.returns({
        query: sinon.stub().returns({
          result: sinon.stub().resolves(mockResponse),
        }),
      });

      const addresses = ['address1'];
      const destinationAddress = 'TDestAddress123';
      const result = await wallet.getAccountResources({ addresses, destinationAddress });

      result.should.deepEqual(mockResponse);
      sinon.assert.calledOnce(mockBitGo.get);
      const queryStub = mockBitGo.get.returnValues[0].query;
      sinon.assert.calledWith(queryStub, { addresses, destinationAddress });
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

    it('should not include destinationAddress in query if not provided', async function () {
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
      queryArg.should.not.have.property('destinationAddress');
    });
  });
});
