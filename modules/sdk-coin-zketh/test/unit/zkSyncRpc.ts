import should from 'should';
import { ZKsyncRpc, ZKsyncRpcProvider } from '../../src/lib/zkSyncRpc';

describe('ZKsync RPC', () => {
  let mockProvider: ZKsyncRpcProvider;
  let zkSyncRpc: ZKsyncRpc;

  beforeEach(() => {
    // Create a mock provider for testing
    mockProvider = {
      call: async (method: string, params: unknown[]) => {
        // Mock responses based on method
        switch (method) {
          case 'zks_estimateFee':
            return {
              gas_limit: '21000',
              gas_per_pubdata_limit: '50000',
              max_fee_per_gas: '250000000',
              max_priority_fee_per_gas: '0',
            };
          case 'zks_L1BatchNumber':
            return 12345;
          case 'zks_getBridgeContracts':
            return {
              l1Erc20DefaultBridge: '0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063',
              l2Erc20DefaultBridge: '0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102',
            };
          case 'zks_getL1GasPrice':
            return '0x3b9aca00'; // 1 gwei in hex
          default:
            throw new Error(`Unknown method: ${method}`);
        }
      },
    };

    zkSyncRpc = new ZKsyncRpc(mockProvider);
  });

  describe('estimateFee', () => {
    it('should estimate fees correctly', async () => {
      const result = await zkSyncRpc.estimateFee({
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000',
        data: '0x',
      });

      should.exist(result);
      result.gas_limit.should.equal('21000');
      result.gas_per_pubdata_limit.should.equal('50000');
      result.max_fee_per_gas.should.equal('250000000');
      result.max_priority_fee_per_gas.should.equal('0');
    });

    it('should handle estimation errors', async () => {
      mockProvider.call = async () => {
        throw new Error('RPC error');
      };

      await zkSyncRpc
        .estimateFee({
          to: '0x1234567890123456789012345678901234567890',
        })
        .should.be.rejectedWith(/ZKsync fee estimation failed/);
    });
  });

  describe('getL1BatchNumber', () => {
    it('should return the current L1 batch number', async () => {
      const batchNumber = await zkSyncRpc.getL1BatchNumber();
      batchNumber.should.equal(12345);
    });

    it('should handle hex string responses', async () => {
      mockProvider.call = async () => '0x3039'; // 12345 in hex
      const batchNumber = await zkSyncRpc.getL1BatchNumber();
      batchNumber.should.equal(12345);
    });
  });

  describe('getBridgeContracts', () => {
    it('should return bridge contract addresses', async () => {
      const bridges = await zkSyncRpc.getBridgeContracts();

      should.exist(bridges);
      should.exist(bridges.l1Erc20DefaultBridge);
      should.exist(bridges.l2Erc20DefaultBridge);
      (bridges.l1Erc20DefaultBridge as string).should.equal('0x57891966931Eb4Bb6FB81430E6cE0A03AAbDe063');
      (bridges.l2Erc20DefaultBridge as string).should.equal('0x11f943b2c77b743AB90f4A0Ae7d5A4e7FCA3E102');
    });
  });

  describe('getL1GasPrice', () => {
    it('should return L1 gas price', async () => {
      const gasPrice = await zkSyncRpc.getL1GasPrice();
      gasPrice.should.equal('0x3b9aca00');
    });
  });

  describe('error handling', () => {
    it('should wrap RPC errors with context', async () => {
      mockProvider.call = async () => {
        throw new Error('Network timeout');
      };

      await zkSyncRpc.getL1BatchNumber().should.be.rejectedWith(/Failed to get L1 batch number.*Network timeout/);
    });
  });
});
