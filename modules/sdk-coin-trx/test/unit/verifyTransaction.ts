import assert from 'node:assert';
import { createHash } from 'crypto';
import { describe, it, before } from 'node:test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { Trx, Ttrx } from '../../src';
import { Utils } from '../../src/lib';
import { UnsignedBuildTransaction } from '../resources';

describe('TRON Verify Transaction:', function () {
  const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
  bitgo.initializeTestVars();
  bitgo.safeRegister('trx', Trx.createInstance);
  bitgo.safeRegister('ttrx', Ttrx.createInstance);

  let basecoin;

  before(function () {
    basecoin = bitgo.coin('ttrx');
  });

  describe('Parameter Validation', () => {
    it('should throw error when txParams is missing', async function () {
      const params = {
        txPrebuild: {
          txHex: JSON.stringify({
            ...UnsignedBuildTransaction,
            raw_data: {
              ...UnsignedBuildTransaction.raw_data,
              expiration: Date.now() + 3600000,
              timestamp: Date.now(),
            },
          }),
        },
        wallet: {},
      };

      await assert.rejects(basecoin.verifyTransaction(params), {
        message: 'missing txParams',
      });
    });

    it('should throw error when wallet or txPrebuild is missing', async function () {
      const params = {
        txParams: {
          recipients: [{ address: 'TQFxDSoXy2yXRE5HtKwAwrNRXGxYxkeSGk', amount: '1000000' }],
        },
      };

      await assert.rejects(basecoin.verifyTransaction(params), {
        message: 'missing txPrebuild',
      });
    });

    it('should throw error when txPrebuild.txHex is missing', async function () {
      const params = {
        txParams: {
          recipients: [{ address: 'TQFxDSoXy2yXRE5HtKwAwrNRXGxYxkeSGk', amount: '1000000' }],
        },
        txPrebuild: {},
        wallet: {},
      };

      await assert.rejects(basecoin.verifyTransaction(params), {
        message: 'missing txHex in txPrebuild',
      });
    });
  });

  describe('Contract Type Validation', () => {
    describe('TransferContract', () => {
      it('should validate valid TransferContract', async function () {
        const timestamp = Date.now();
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        // Transform rawData to match the expected parameter structure
        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        // Generate raw_data_hex using the utility function
        const rawDataHex = Utils.generateRawDataHex(transformedRawData);

        // Calculate txID as SHA256 hash of raw_data_hex
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              {
                address: Utils.getBase58AddressFromHex('41d6cd6a2c0ff35a319e6abb5b9503ba0278679882'),
                amount: '1000000',
              },
            ],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: {},
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail with missing owner address', async function () {
        const timestamp = Date.now();
        const txID = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              to_address: '41c25420255c2c5a2dd54ef69f92ef261e6bd4216a',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          txID,
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        const expectedRawDataHex = Utils.generateRawDataHex(transformedRawData);

        const params = {
          txParams: {
            recipients: [{ address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN', amount: '1000000' }],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: expectedRawDataHex,
            }),
          },
          wallet: {},
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'Transaction has not have a valid id',
        });
      });

      it('should fail with missing destination address', async function () {
        const timestamp = Date.now();
        const txID = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          txID,
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        const expectedRawDataHex = Utils.generateRawDataHex(transformedRawData);

        const params = {
          txParams: {
            recipients: [{ address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN', amount: '1000000' }],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: expectedRawDataHex,
            }),
          },
          wallet: {},
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'Transaction has not have a valid id',
        });
      });

      it('should fail with missing amount', async function () {
        const timestamp = Date.now();
        const transferContract = {
          parameter: {
            value: {
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: '41c25420255c2c5a2dd54ef69f92ef261e6bd4216a',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        const expectedRawDataHex = Utils.generateRawDataHex(transformedRawData);

        const params = {
          txParams: {
            recipients: [{ address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN', amount: '1000000' }],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              raw_data: rawData,
              raw_data_hex: expectedRawDataHex,
            }),
          },
          wallet: {},
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'Amount does not exist in this transfer contract.',
        });
      });

      it('should fail due to amount missmatch', async function () {
        const timestamp = Date.now();
        const transferContract = {
          parameter: {
            value: {
              amount: 2000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        // Transform rawData to match the expected parameter structure
        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        // Generate raw_data_hex using the utility function
        const rawDataHex = Utils.generateRawDataHex(transformedRawData);

        // Calculate txID as SHA256 hash of raw_data_hex
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              {
                address: '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882',
                amount: '1000000',
              },
            ],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: {},
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'transaction amount in txPrebuild does not match the value given by client',
        });
      });

      it('should fail due to destination address missmatch', async function () {
        const timestamp = Date.now();
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882',
            },
            type_url: 'type.googleapis.com/protocol.TransferContract',
          },
          type: 'TransferContract',
        };

        const rawData = {
          contract: [transferContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration: timestamp + 3600000,
          timestamp: timestamp,
          fee_limit: 150000000,
        };

        // Transform rawData to match the expected parameter structure
        const transformedRawData = {
          contract: rawData.contract as any,
          refBlockBytes: rawData.ref_block_bytes,
          refBlockHash: rawData.ref_block_hash,
          expiration: rawData.expiration,
          timestamp: rawData.timestamp,
          feeLimit: rawData.fee_limit,
        };

        // Generate raw_data_hex using the utility function
        const rawDataHex = Utils.generateRawDataHex(transformedRawData);

        // Calculate txID as SHA256 hash of raw_data_hex
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              {
                address: '41d6cd6a2c0ff35a319e6abb5b9503ba0278679883',
                amount: '1000000',
              },
            ],
          },
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: {},
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'destination address does not match with the recipient address',
        });
      });
    });
  });
});
