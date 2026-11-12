import assert from 'node:assert';
import { createHash } from 'crypto';
import { describe, it, before } from 'node:test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGoAPI, TestBitGo } from '@bitgo/sdk-test';
import { Trx, Ttrx } from '../../src';
import { Utils } from '../../src/lib';
import { UnsignedBuildTransaction, UnsignedAccountPermissionUpdateContractTx } from '../resources';
import { protocol } from '../../resources/protobuf/tron';

/**
 * Helper to build a raw_data_hex (protobuf) for any supported contract type.
 * Properly encodes the contract value using the protocol library.
 */
function buildTssContractTxHex(params: {
  contractType: string;
  contractValue: any;
  timestamp?: number;
  expiration?: number;
}): string {
  const timestamp = params.timestamp || Date.now();

  // Map contract type string to protobuf type_url and encoder
  const encoders: Record<string, { typeUrl: string; encode: (val: any) => Uint8Array }> = {
    FreezeBalanceV2Contract: {
      typeUrl: 'type.googleapis.com/protocol.FreezeBalanceV2Contract',
      encode: (v) =>
        protocol.FreezeBalanceV2Contract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          frozenBalance: v.frozen_balance,
          resource: v.resource === 'ENERGY' ? protocol.ResourceCode.ENERGY : protocol.ResourceCode.BANDWIDTH,
        }).finish(),
    },
    UnfreezeBalanceV2Contract: {
      typeUrl: 'type.googleapis.com/protocol.UnfreezeBalanceV2Contract',
      encode: (v) =>
        protocol.UnfreezeBalanceV2Contract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          unfreezeBalance: v.unfreeze_balance,
          resource: v.resource === 'ENERGY' ? protocol.ResourceCode.ENERGY : protocol.ResourceCode.BANDWIDTH,
        }).finish(),
    },
    VoteWitnessContract: {
      typeUrl: 'type.googleapis.com/protocol.VoteWitnessContract',
      encode: (v) =>
        protocol.VoteWitnessContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          votes: v.votes.map((vote: any) => ({
            voteAddress: Buffer.from(vote.vote_address, 'hex'),
            voteCount: vote.vote_count,
          })),
        }).finish(),
    },
    WithdrawBalanceContract: {
      typeUrl: 'type.googleapis.com/protocol.WithdrawBalanceContract',
      encode: (v) =>
        protocol.WithdrawBalanceContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
        }).finish(),
    },
    WithdrawExpireUnfreezeContract: {
      typeUrl: 'type.googleapis.com/protocol.WithdrawExpireUnfreezeContract',
      encode: (v) =>
        protocol.WithdrawBalanceContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
        }).finish(),
    },
    DelegateResourceContract: {
      typeUrl: 'type.googleapis.com/protocol.DelegateResourceContract',
      encode: (v) =>
        protocol.DelegateResourceContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          receiverAddress: Buffer.from(v.receiver_address, 'hex'),
          balance: v.balance,
          resource: v.resource === 'ENERGY' ? protocol.ResourceCode.ENERGY : protocol.ResourceCode.BANDWIDTH,
        }).finish(),
    },
    UnDelegateResourceContract: {
      typeUrl: 'type.googleapis.com/protocol.UnDelegateResourceContract',
      encode: (v) =>
        protocol.UnDelegateResourceContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          receiverAddress: Buffer.from(v.receiver_address, 'hex'),
          balance: v.balance,
          resource: v.resource === 'ENERGY' ? protocol.ResourceCode.ENERGY : protocol.ResourceCode.BANDWIDTH,
        }).finish(),
    },
    AccountCreateContract: {
      typeUrl: 'type.googleapis.com/protocol.AccountCreateContract',
      encode: (v) =>
        protocol.AccountCreateContract.encode({
          ownerAddress: Buffer.from(v.owner_address, 'hex'),
          accountAddress: Buffer.from(v.account_address, 'hex'),
        }).finish(),
    },
  };

  const encoder = encoders[params.contractType];
  if (!encoder) {
    throw new Error(`No encoder for contract type: ${params.contractType}`);
  }

  const encodedValue = encoder.encode(params.contractValue);
  const base64Value = Buffer.from(encodedValue).toString('base64');

  const contract = {
    parameter: {
      value: base64Value,
      type_url: encoder.typeUrl,
    },
    type: params.contractType,
  };

  const transformedRawData = {
    contract: [contract] as any,
    refBlockBytes: 'c8cf',
    refBlockHash: '89177fd84c5d9196',
    expiration: params.expiration || timestamp + 3600000,
    timestamp: timestamp,
  };

  return Utils.generateRawDataHex(transformedRawData);
}

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

      it('should validate TransferContract when recipient is 0x-prefixed hex (COINS-1575)', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              {
                address: '0x' + toAddressHex.slice(2),
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

      it('should validate consolidation when destination matches wallet base address', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toAddressBase58 = Utils.getBase58AddressFromHex(toAddressHex);
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: { coinSpecific: () => ({ baseAddress: toAddressBase58 }) },
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail consolidation when destination does not match wallet base address', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: { coinSpecific: () => ({ baseAddress: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN' }) },
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'consolidation destination does not match wallet base address',
        });
      });

      it('should validate consolidation using rootAddress fallback', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toAddressBase58 = Utils.getBase58AddressFromHex(toAddressHex);
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: { coinSpecific: () => ({ rootAddress: toAddressBase58 }) },
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail consolidation when wallet base address is missing', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: { coinSpecific: () => ({}) },
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'missing wallet base address for consolidation destination validation',
        });
      });

      it('should validate when prebuild matches one of multiple recipients (sendMany)', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toAddressBase58 = Utils.getBase58AddressFromHex(toAddressHex);
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              { address: toAddressBase58, amount: '1000000' },
              { address: 'TQFxDSoXy2yXRE5HtKwAwrNRXGxYxkeSGk', amount: '500000' },
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

      it('should fail when prebuild does not match any of multiple recipients', async function () {
        const timestamp = Date.now();
        const toAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        // Use different hex addresses that don't match the prebuild destination
        const otherAddress1 = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const otherAddress2 = '41c25420255c2c5a2dd54ef69f92ef261e6bd4216a';
        const transferContract = {
          parameter: {
            value: {
              amount: 1000000,
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
              to_address: toAddressHex,
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {
            recipients: [
              { address: otherAddress1, amount: '500000' },
              { address: otherAddress2, amount: '500000' },
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
          message: 'transaction in txPrebuild does not match any recipient in txParams',
        });
      });
    });

    describe('Multisig path owner address validation (CHALO-2126)', () => {
      it('should validate AccountPermissionUpdateContract when owner matches wallet base address', async function () {
        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify(UnsignedAccountPermissionUpdateContractTx),
          },
          wallet: {
            coinSpecific: () => ({
              baseAddress: Utils.getBase58AddressFromHex('41ca42a499a2eee394323baa2c2f7d8a764ce0689c'),
            }),
          },
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail AccountPermissionUpdateContract when owner does not match wallet base address', async function () {
        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify(UnsignedAccountPermissionUpdateContractTx),
          },
          wallet: {
            coinSpecific: () => ({ baseAddress: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN' }),
          },
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should validate FreezeBalanceV2Contract on multisig path when owner matches', async function () {
        const ownerHex = '41ca42a499a2eee394323baa2c2f7d8a764ce0689c';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const timestamp = Date.now();
        const expiration = timestamp + 3600000;

        const freezeContract = {
          parameter: {
            value: {
              frozen_balance: 1000000,
              owner_address: ownerHex,
              resource: 'BANDWIDTH',
            },
            type_url: 'type.googleapis.com/protocol.FreezeBalanceV2Contract',
          },
          type: 'FreezeBalanceV2Contract',
        };

        // Use same timestamp/expiration for both raw_data and raw_data_hex to avoid builder mismatch
        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
          timestamp,
          expiration,
        });

        const rawData = {
          contract: [freezeContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration,
          timestamp,
          fee_limit: 150000000,
        };

        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({ txID, raw_data: rawData, raw_data_hex: rawDataHex }),
          },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail FreezeBalanceV2Contract on multisig path when owner does not match', async function () {
        const ownerHex = '41ca42a499a2eee394323baa2c2f7d8a764ce0689c';
        const timestamp = Date.now();
        const expiration = timestamp + 3600000;

        const freezeContract = {
          parameter: {
            value: {
              frozen_balance: 1000000,
              owner_address: ownerHex,
              resource: 'BANDWIDTH',
            },
            type_url: 'type.googleapis.com/protocol.FreezeBalanceV2Contract',
          },
          type: 'FreezeBalanceV2Contract',
        };

        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
          timestamp,
          expiration,
        });

        const rawData = {
          contract: [freezeContract],
          ref_block_bytes: 'c8cf',
          ref_block_hash: '89177fd84c5d9196',
          expiration,
          timestamp,
          fee_limit: 150000000,
        };

        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({ txID, raw_data: rawData, raw_data_hex: rawDataHex }),
          },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      describe('Multisig TriggerSmartContract validation (CHALO-2126)', () => {
        // TRC20 transfers on multisig path were previously unvalidated (return true).
        // Now they decode protobuf and validate recipient + amount.
        // The multisig path uses extractRawDataHex to get raw_data_hex from JSON,
        // then decodes via protobuf. We build a fresh TRC20 tx with valid timestamps
        // to avoid builder expiration errors.
        const trc20OwnerHex = '41c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac';
        const trc20ContractHex = '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0';
        const trc20RecipientHex = '418483618ca85c35a9b923d98bebca718f5a1db279';
        const trc20RecipientBase58 = Utils.getBase58AddressFromHex(trc20RecipientHex);
        const trc20Amount = '100000000';

        function buildMultisigTrc20TxHex(): string {
          const timestamp = Date.now();
          // ABI-encode transfer(address,uint256): function selector + padded address + padded amount
          const transferSelector = 'a9059cbb';
          // Strip '41' prefix, pad to 32 bytes
          const paddedRecipient = '000000000000000000000000' + trc20RecipientHex.slice(2);
          const paddedAmount = BigInt(trc20Amount).toString(16).padStart(64, '0');
          const abiData = transferSelector + paddedRecipient + paddedAmount;

          const triggerContract = protocol.TriggerSmartContract.encode({
            ownerAddress: Buffer.from(trc20OwnerHex, 'hex'),
            contractAddress: Buffer.from(trc20ContractHex, 'hex'),
            data: Buffer.from(abiData, 'hex'),
          }).finish();

          const contract = {
            parameter: {
              value: Buffer.from(triggerContract).toString('base64'),
              type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
            },
            type: 'TriggerSmartContract',
          };

          const rawDataHex = Utils.generateRawDataHex({
            contract: [contract] as any,
            refBlockBytes: 'c8cf',
            refBlockHash: '89177fd84c5d9196',
            expiration: timestamp + 3600000,
            timestamp: timestamp,
            feeLimit: 150000000,
          });

          const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');
          return JSON.stringify({
            txID,
            raw_data: {
              contract: [
                {
                  parameter: {
                    value: {
                      data: abiData,
                      owner_address: trc20OwnerHex,
                      contract_address: trc20ContractHex,
                    },
                    type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
                  },
                  type: 'TriggerSmartContract',
                },
              ],
              ref_block_bytes: 'c8cf',
              ref_block_hash: '89177fd84c5d9196',
              expiration: timestamp + 3600000,
              timestamp: timestamp,
              fee_limit: 150000000,
            },
            raw_data_hex: rawDataHex,
          });
        }

        it('should validate multisig TRC20 when recipient matches', async function () {
          const params = {
            txParams: {
              recipients: [{ address: trc20RecipientBase58, amount: trc20Amount }],
            },
            txPrebuild: { txHex: buildMultisigTrc20TxHex() },
            wallet: {},
          };

          const result = await basecoin.verifyTransaction(params);
          assert.strictEqual(result, true);
        });

        it('should fail multisig TRC20 when amount does not match', async function () {
          const params = {
            txParams: {
              recipients: [{ address: trc20RecipientBase58, amount: '999' }],
            },
            txPrebuild: { txHex: buildMultisigTrc20TxHex() },
            wallet: {},
          };

          await assert.rejects(basecoin.verifyTransaction(params), {
            message: 'transaction amount in txPrebuild does not match the value given by client',
          });
        });

        it('should fail multisig TRC20 when destination does not match', async function () {
          const params = {
            txParams: {
              recipients: [{ address: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz', amount: trc20Amount }],
            },
            txPrebuild: { txHex: buildMultisigTrc20TxHex() },
            wallet: {},
          };

          await assert.rejects(basecoin.verifyTransaction(params), {
            message: 'destination address does not match with the recipient address',
          });
        });

        it('should validate multisig TRC20 consolidation when destination matches wallet base address', async function () {
          const params = {
            txParams: { recipients: [] },
            txPrebuild: { txHex: buildMultisigTrc20TxHex() },
            wallet: { coinSpecific: () => ({ baseAddress: trc20RecipientBase58 }) },
          };

          const result = await basecoin.verifyTransaction(params);
          assert.strictEqual(result, true);
        });

        it('should fail multisig TRC20 consolidation when destination does not match wallet base address', async function () {
          const params = {
            txParams: { recipients: [] },
            txPrebuild: { txHex: buildMultisigTrc20TxHex() },
            wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          };

          await assert.rejects(basecoin.verifyTransaction(params), {
            message: 'consolidation destination does not match wallet base address',
          });
        });
      });

      it('should fail unknown contract type on multisig path', async function () {
        const timestamp = Date.now();
        const unknownContract = {
          parameter: {
            value: {
              owner_address: '4173a5993cd182ae152adad8203163f780c65a8aa5',
            },
            type_url: 'type.googleapis.com/protocol.SomeUnknownContract',
          },
          type: 'SomeUnknownContract',
        };

        const rawData = {
          contract: [unknownContract],
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

        const rawDataHex = Utils.generateRawDataHex(transformedRawData);
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: JSON.stringify({
              txID,
              raw_data: rawData,
              raw_data_hex: rawDataHex,
            }),
          },
          wallet: {},
        };

        // The builder or decode step should reject unknown contract types
        await assert.rejects(basecoin.verifyTransaction(params));
      });
    });
  });

  describe('TSS Wallet Verification', () => {
    /**
     * Helper to build a raw_data_hex (protobuf) for a TransferContract.
     * For TSS, txPrebuild.txHex is the raw_data_hex directly (not a JSON string).
     */
    function buildTssTransferTxHex(params: {
      ownerAddress: string;
      toAddress: string;
      amount: number;
      timestamp?: number;
      expiration?: number;
    }): string {
      const timestamp = params.timestamp || Date.now();
      const transferContract = {
        parameter: {
          value: {
            amount: params.amount,
            owner_address: params.ownerAddress,
            to_address: params.toAddress,
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      };

      const transformedRawData = {
        contract: [transferContract] as any,
        refBlockBytes: 'c8cf',
        refBlockHash: '89177fd84c5d9196',
        expiration: params.expiration || timestamp + 3600000,
        timestamp: timestamp,
      };

      return Utils.generateRawDataHex(transformedRawData);
    }

    describe('TransferContract', () => {
      it('should validate a valid TSS TransferContract', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {
            recipients: [
              {
                // TSS path: recipients use base58 addresses
                address: Utils.getBase58AddressFromHex(toHex),
                amount: amount.toString(),
              },
            ],
          },
          txPrebuild: {
            // TSS path: txHex is the raw protobuf hex, not a JSON string
            txHex: rawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail TSS verification when amount does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount: 2000000 });

        const params = {
          txParams: {
            recipients: [
              {
                address: Utils.getBase58AddressFromHex(toHex),
                amount: '1000000', // mismatch: txHex has 2000000
              },
            ],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'transaction amount in txPrebuild does not match the value given by client',
        });
      });

      it('should fail TSS verification when destination address does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount: 1000000 });

        const params = {
          txParams: {
            recipients: [
              {
                // Different address than what's in the transaction
                address: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz',
                amount: '1000000',
              },
            ],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'destination address does not match with the recipient address',
        });
      });

      it('should validate TSS consolidation when destination matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toBase58 = Utils.getBase58AddressFromHex(toHex);
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: toBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail TSS consolidation when destination does not match wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'consolidation destination does not match wallet base address',
        });
      });

      it('should validate TSS consolidation using rootAddress fallback', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toBase58 = Utils.getBase58AddressFromHex(toHex);
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({ rootAddress: toBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail TSS consolidation when wallet base address is missing', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {},
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({}) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'missing wallet base address for consolidation destination validation',
        });
      });

      it('should validate TSS sendMany when prebuild matches one of multiple recipients', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const toBase58 = Utils.getBase58AddressFromHex(toHex);
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {
            recipients: [
              { address: toBase58, amount: amount.toString() },
              { address: 'TQFxDSoXy2yXRE5HtKwAwrNRXGxYxkeSGk', amount: '500000' },
            ],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail TSS sendMany when prebuild does not match any recipient', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const amount = 1000000;
        // Use different valid base58 addresses that don't match the prebuild destination
        const otherAddress1 = Utils.getBase58AddressFromHex('4173a5993cd182ae152adad8203163f780c65a8aa5');
        const otherAddress2 = Utils.getBase58AddressFromHex('41c25420255c2c5a2dd54ef69f92ef261e6bd4216a');

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });

        const params = {
          txParams: {
            recipients: [
              { address: otherAddress1, amount: '500000' },
              { address: otherAddress2, amount: '500000' },
            ],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'transaction in txPrebuild does not match any recipient in txParams',
        });
      });
    });

    describe('Owner address validation for non-transfer contract types (CHALO-2126)', () => {
      it('should validate AccountPermissionUpdate when owner matches wallet base address', async function () {
        const rawDataHex = UnsignedAccountPermissionUpdateContractTx.raw_data_hex;
        // owner_address in the test fixture is 41ca42a499a2eee394323baa2c2f7d8a764ce0689c
        const ownerBase58 = Utils.getBase58AddressFromHex('41ca42a499a2eee394323baa2c2f7d8a764ce0689c');

        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail AccountPermissionUpdate when owner does not match wallet base address', async function () {
        const rawDataHex = UnsignedAccountPermissionUpdateContractTx.raw_data_hex;

        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should fail AccountPermissionUpdate when wallet base address is missing', async function () {
        const rawDataHex = UnsignedAccountPermissionUpdateContractTx.raw_data_hex;

        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: rawDataHex,
          },
          wallet: { coinSpecific: () => ({}) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'missing wallet base address for contract owner_address validation',
        });
      });

      it('should validate FreezeBalanceV2 when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);

        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail FreezeBalanceV2 when owner does not match wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should validate VoteWitness when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const voteAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'VoteWitnessContract',
          contractValue: {
            owner_address: ownerHex,
            votes: [{ vote_address: voteAddressHex, vote_count: 100 }],
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail VoteWitness when owner does not match wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const voteAddressHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'VoteWitnessContract',
          contractValue: {
            owner_address: ownerHex,
            votes: [{ vote_address: voteAddressHex, vote_count: 100 }],
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should validate DelegateResourceContract when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const receiverHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'DelegateResourceContract',
          contractValue: {
            owner_address: ownerHex,
            receiver_address: receiverHex,
            balance: 1000000,
            resource: 'BANDWIDTH',
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail DelegateResourceContract when owner does not match wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const receiverHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'DelegateResourceContract',
          contractValue: {
            owner_address: ownerHex,
            receiver_address: receiverHex,
            balance: 1000000,
            resource: 'BANDWIDTH',
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should validate WithdrawBalanceContract when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);

        const rawDataHex = buildTssContractTxHex({
          contractType: 'WithdrawBalanceContract',
          contractValue: { owner_address: ownerHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should validate UnDelegateResourceContract when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const receiverHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'UnDelegateResourceContract',
          contractValue: {
            owner_address: ownerHex,
            receiver_address: receiverHex,
            balance: 1000000,
            resource: 'BANDWIDTH',
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should validate UnfreezeBalanceV2 when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);

        const rawDataHex = buildTssContractTxHex({
          contractType: 'UnfreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, unfreeze_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should validate WithdrawExpireUnfreeze when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);

        const rawDataHex = buildTssContractTxHex({
          contractType: 'WithdrawExpireUnfreezeContract',
          contractValue: { owner_address: ownerHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should validate AccountCreate when owner matches wallet base address', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const accountHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssContractTxHex({
          contractType: 'AccountCreateContract',
          contractValue: { owner_address: ownerHex, account_address: accountHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail WithdrawBalanceContract when owner does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'WithdrawBalanceContract',
          contractValue: { owner_address: ownerHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should fail UnDelegateResourceContract when owner does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const receiverHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'UnDelegateResourceContract',
          contractValue: {
            owner_address: ownerHex,
            receiver_address: receiverHex,
            balance: 1000000,
            resource: 'BANDWIDTH',
          },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should fail UnfreezeBalanceV2 when owner does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'UnfreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, unfreeze_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should fail WithdrawExpireUnfreeze when owner does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'WithdrawExpireUnfreezeContract',
          contractValue: { owner_address: ownerHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should fail AccountCreate when owner does not match', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const accountHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'AccountCreateContract',
          contractValue: { owner_address: ownerHex, account_address: accountHex },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'contract owner_address does not match wallet base address',
        });
      });

      it('should validate owner using rootAddress fallback', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const ownerBase58 = Utils.getBase58AddressFromHex(ownerHex);
        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: { coinSpecific: () => ({ rootAddress: ownerBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail when wallet has no coinSpecific for non-transfer types', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const rawDataHex = buildTssContractTxHex({
          contractType: 'FreezeBalanceV2Contract',
          contractValue: { owner_address: ownerHex, frozen_balance: 1000000, resource: 'BANDWIDTH' },
        });

        const params = {
          txParams: {},
          txPrebuild: { txHex: rawDataHex },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'missing wallet base address for contract owner_address validation',
        });
      });
    });

    describe('TriggerSmartContract (TRC20) routed through native Trx', () => {
      // CECHO-2248: token wallets are sometimes constructed with the native coin instance
      // (e.g. bitgo.coin('trx').wallets().get() on a trx:<token> wallet), so a TRC20
      // TriggerSmartContract prebuild can reach the native Trx verifier. It must validate
      // recipient and amount (same as TrxToken.verifyTransaction) instead of throwing.
      const trc20RawDataHex =
        '0a02578b22086113bb9ac351432b4088eae7a6de305aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c51fbeea78910b15b1d3e8a9b62914ca94d1a4ac12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb0000000000000000000000008483618ca85c35a9b923d98bebca718f5a1db2790000000000000000000000000000000000000000000000000000000005f5e10070888d8ca5de309001c0c39307';

      // Recipient address decoded from the ABI data in the protobuf above (41 prefix → base58)
      const trc20RecipientHex = '418483618ca85c35a9b923d98bebca718f5a1db279';
      const trc20RecipientBase58 = Utils.getBase58AddressFromHex(trc20RecipientHex);
      const trc20Amount = '100000000';

      it('should validate a matching TRC20 transfer instead of throwing', async function () {
        const params = {
          txParams: {
            recipients: [{ address: trc20RecipientBase58, amount: trc20Amount }],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail when TRC20 amount does not match', async function () {
        const params = {
          txParams: {
            recipients: [{ address: trc20RecipientBase58, amount: '999' }],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'transaction amount in txPrebuild does not match the value given by client',
        });
      });

      it('should fail when TRC20 destination does not match', async function () {
        const params = {
          txParams: {
            recipients: [{ address: 'TLWh67P93KgtnZNCtGnEHM1H33Nhq2uvvN', amount: trc20Amount }],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'destination address does not match with the recipient address',
        });
      });

      it('should return true when no recipients and destination is wallet base address (consolidation path)', async function () {
        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: trc20RecipientBase58 }) },
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail consolidation when TRC20 destination does not match wallet base address', async function () {
        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: { coinSpecific: () => ({ baseAddress: 'TTsGwnTLQ4eryFJpDvJSfuGQxPXRCjXvZz' }) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'consolidation destination does not match wallet base address',
        });
      });

      it('should fail consolidation when wallet base address is missing', async function () {
        const params = {
          txParams: {
            recipients: [],
          },
          txPrebuild: {
            txHex: trc20RawDataHex,
          },
          wallet: { coinSpecific: () => ({}) },
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'missing wallet base address for consolidation destination validation',
        });
      });
    });

    it('should throw error when txHex is missing for TSS wallet', async function () {
      const params = {
        txParams: {
          recipients: [{ address: 'TQFxDSoXy2yXRE5HtKwAwrNRXGxYxkeSGk', amount: '1000000' }],
        },
        txPrebuild: {},
        wallet: {},
        walletType: 'tss',
      };

      await assert.rejects(basecoin.verifyTransaction(params), {
        message: 'missing txHex in txPrebuild',
      });
    });

    describe('serializedTxHex (JSON string) path', () => {
      // prebuildAndSignTransaction passes txHex as serializedTxHex — a full JSON string
      // containing { txID, raw_data, raw_data_hex }. The TSS branch must handle this format
      // by extracting raw_data_hex before protobuf decoding.

      it('should validate TSS TransferContract when txHex is a JSON string (serializedTxHex)', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';
        const amount = 1000000;

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount });
        const txID = createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex');

        // Simulate the serializedTxHex format from BitGo API (JSON string with txID + raw_data_hex)
        const serializedTxHex = JSON.stringify({
          txID,
          raw_data_hex: rawDataHex,
          raw_data: {},
        });

        const params = {
          txParams: {
            recipients: [
              {
                address: Utils.getBase58AddressFromHex(toHex),
                amount: amount.toString(),
              },
            ],
          },
          txPrebuild: {
            txHex: serializedTxHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        const result = await basecoin.verifyTransaction(params);
        assert.strictEqual(result, true);
      });

      it('should fail when amount mismatches with JSON txHex', async function () {
        const ownerHex = '4173a5993cd182ae152adad8203163f780c65a8aa5';
        const toHex = '41d6cd6a2c0ff35a319e6abb5b9503ba0278679882';

        const rawDataHex = buildTssTransferTxHex({ ownerAddress: ownerHex, toAddress: toHex, amount: 2000000 });
        const serializedTxHex = JSON.stringify({
          txID: createHash('sha256').update(Buffer.from(rawDataHex, 'hex')).digest('hex'),
          raw_data_hex: rawDataHex,
          raw_data: {},
        });

        const params = {
          txParams: {
            recipients: [
              {
                address: Utils.getBase58AddressFromHex(toHex),
                amount: '1000000', // mismatch
              },
            ],
          },
          txPrebuild: {
            txHex: serializedTxHex,
          },
          wallet: {},
          walletType: 'tss',
        };

        await assert.rejects(basecoin.verifyTransaction(params), {
          message: 'transaction amount in txPrebuild does not match the value given by client',
        });
      });
    });
  });
});
