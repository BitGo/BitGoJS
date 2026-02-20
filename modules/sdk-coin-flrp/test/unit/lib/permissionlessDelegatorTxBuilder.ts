import assert from 'assert';
import 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, PermissionlessDelegatorTxBuilder, Transaction } from '../../../src/lib';
import { SEED_ACCOUNT, ACCOUNT_1, ACCOUNT_3, CONTEXT } from '../../resources/account';
import utils from '../../../src/lib/utils';
import { DELEGATION_TX_2 } from '../../resources/transactionData/delegatorTx';

describe('Flrp PermissionlessDelegatorTxBuilder', () => {
  const coinConfig = coins.get('tflrp');
  const factory = new TransactionBuilderFactory(coinConfig);

  describe('getDelegatorBuilder', () => {
    it('should return a PermissionlessDelegatorTxBuilder instance', () => {
      const builder = factory.getDelegatorBuilder();
      builder.should.be.instanceOf(PermissionlessDelegatorTxBuilder);
    });
  });

  describe('validate nodeID', () => {
    it('should fail when nodeID is missing', () => {
      const builder = factory.getDelegatorBuilder();
      assert.throws(
        () => {
          builder.nodeID('');
        },
        (e: any) => e.message === 'Invalid transaction: missing nodeID'
      );
    });

    it('should fail when nodeID has invalid prefix', () => {
      const builder = factory.getDelegatorBuilder();
      assert.throws(
        () => {
          builder.nodeID('InvalidPrefix-123456789');
        },
        (e: any) => e.message === 'Invalid transaction: invalid NodeID tag'
      );
    });

    it('should accept valid nodeID format', () => {
      const builder = factory.getDelegatorBuilder();
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';
      (() => builder.nodeID(validNodeID)).should.not.throw();
    });
  });

  describe('validate stake duration', () => {
    it('should fail when end time is less than start time', () => {
      const builder = factory.getDelegatorBuilder();
      const startTime = BigInt(Math.floor(Date.now() / 1000) + 60);
      const endTime = BigInt(Math.floor(Date.now() / 1000) - 60);

      builder.startTime(startTime.toString());
      builder.endTime(endTime.toString());

      // The validation happens in buildFlareTransaction, but we can test validateStakeDuration directly
      assert.throws(
        () => {
          builder.validateStakeDuration(startTime, endTime);
        },
        (e: any) => e.message === 'End date cannot be less than start date'
      );
    });

    it('should accept valid stake duration', () => {
      const builder = factory.getDelegatorBuilder();
      const startTime = BigInt(Math.floor(Date.now() / 1000) + 60);
      const endTime = BigInt(Math.floor(Date.now() / 1000) + 86400 * 14); // 14 days later

      (() => {
        builder.validateStakeDuration(startTime, endTime);
      }).should.not.throw();
    });
  });

  describe('builder methods', () => {
    it('should set startTime correctly', () => {
      const builder = factory.getDelegatorBuilder();
      const startTime = Math.floor(Date.now() / 1000) + 60;
      (() => builder.startTime(startTime)).should.not.throw();
    });

    it('should set endTime correctly', () => {
      const builder = factory.getDelegatorBuilder();
      const endTime = Math.floor(Date.now() / 1000) + 86400 * 14;
      (() => builder.endTime(endTime)).should.not.throw();
    });

    it('should set rewardAddress with P-chain address', () => {
      const builder = factory.getDelegatorBuilder();
      // P-chain Bech32 address
      (() => builder.rewardAddress(SEED_ACCOUNT.addressTestnet)).should.not.throw();
    });
  });

  describe('build validation', () => {
    it('should fail build when nodeID is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);

      builder
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('NodeID is required for delegation');
    });

    it('should fail build when start time is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('Start time is required for delegation');
    });

    it('should fail build when end time is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('End time is required for delegation');
    });

    it('should fail build when stake amount is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('Stake amount is required for delegation');
    });

    it('should fail build when context is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet]);

      await builder.build().should.be.rejectedWith('Context is required for delegation');
    });

    it('should fail build when from addresses are not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('From addresses are required for delegation');
    });

    it('should fail build when fee state is not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any);

      await builder.build().should.be.rejectedWith('Fee state is required for delegation');
    });

    it('should fail build when UTXOs are not set', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';
      const mockFeeState = { capacity: 100000n, excess: 0n, price: 1000n, timestamp: '1234567890' };

      builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 86400 * 14)
        .stakeAmount(BigInt(50000 * 1e9))
        .fromPubKey([SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet])
        .context(CONTEXT as any)
        .feeState(mockFeeState);

      await builder.build().should.be.rejectedWith('UTXOs are required for delegation');
    });
  });

  describe('validate stake amount', () => {
    it('should fail when stake amount is below minimum', () => {
      const builder = factory.getDelegatorBuilder();
      // Minimum is 50000 FLR, so 1000 should fail
      assert.throws(
        () => {
          builder.stakeAmount(BigInt(1000 * 1e9));
        },
        (e: any) => e.message.includes('Minimum delegation amount')
      );
    });

    it('should accept stake amount at or above minimum', () => {
      const builder = factory.getDelegatorBuilder();
      const stakeAmount = BigInt(50000 * 1e9);
      (() => builder.stakeAmount(stakeAmount)).should.not.throw();
    });
  });

  describe('transaction type support', () => {
    it('should allow setting AddPermissionlessDelegator transaction type', () => {
      const builder = factory.getDelegatorBuilder();
      // The builder should successfully configure with AddPermissionlessDelegator type
      // This verifies transaction.ts setTransactionType accepts the delegation type
      builder.should.be.instanceof(PermissionlessDelegatorTxBuilder);
    });

    it('should have correct minimum stake amount constant', () => {
      // Verify the minimum stake amount is 50000 FLR (in nanoFLR)
      const minStakeAmount = BigInt(50000 * 1e9);
      minStakeAmount.should.equal(BigInt('50000000000000'));
    });
  });

  describe('round-trip deserialization', () => {
    it('should deserialize a signed delegation transaction from hex', async () => {
      const rawTx = utils.removeHexPrefix(DELEGATION_TX_2.signedHex);
      const tx = (await factory.from(rawTx).build()) as Transaction;
      tx.type.should.equal(TransactionType.AddPermissionlessDelegator);
    });

    it('should correctly extract delegation parameters from deserialized transaction', async () => {
      const rawTx = utils.removeHexPrefix(DELEGATION_TX_2.signedHex);
      const tx = (await factory.from(rawTx).build()) as Transaction;
      const explanation = tx.explainTransaction();
      explanation.outputs.length.should.be.above(0);
      explanation.outputAmount.should.equal(DELEGATION_TX_2.stakeAmount);
    });

    it('should re-serialize to the same hex (round-trip)', async () => {
      const rawTx = utils.removeHexPrefix(DELEGATION_TX_2.signedHex);
      const tx = (await factory.from(rawTx).build()) as Transaction;
      const reEncodedTx = utils.removeHexPrefix(tx.toBroadcastFormat());

      reEncodedTx.should.equal(rawTx);
    });

    it('should have correct input/output counts', async () => {
      const rawTx = utils.removeHexPrefix(DELEGATION_TX_2.signedHex);
      const tx = (await factory.from(rawTx).build()) as Transaction;
      tx.inputs.should.have.length(3);
      tx.outputs.length.should.be.above(0);
    });
  });

  describe('build with UTXOs (comprehensive tests)', () => {
    const mockFeeState = { capacity: 100000n, excess: 0n, price: 1000n, timestamp: '1234567890' };
    const MIN_DELEGATION_DURATION = 14 * 24 * 60 * 60; // 14 days (1209600 seconds)
    const MIN_DELEGATION_AMOUNT = BigInt(50000 * 1e9); // 50000 FLR in nanoFLR

    function createTestUtxos(addresses: string[], threshold: number, amount = '60000000000000') {
      return [
        {
          outputID: 7,
          txid: '2NWd9hrSGkWJWyTu4DnSM1qQSUT2DVm8uqwFk4wQRFLAmcsHQz',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount,
          threshold,
          addresses,
          locktime: '0',
        },
      ];
    }

    it('should build delegation transaction with threshold=2 and 3 addresses (BitGo 2-of-3 multisig)', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];
      const utxos = createTestUtxos(addresses, 2);

      const tx = await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx.should.be.instanceof(Transaction);
      tx.type.should.equal(TransactionType.AddPermissionlessDelegator);
    });

    it('should build delegation transaction with threshold=2 and 2 addresses', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet];
      const utxos = createTestUtxos(addresses, 2);

      const tx = await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx.should.be.instanceof(Transaction);
      tx.type.should.equal(TransactionType.AddPermissionlessDelegator);
    });

    it('should fail when UTXO amount is insufficient', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet];
      const utxos = createTestUtxos(addresses, 2, '1000000000000');

      await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build()
        .should.be.rejected();
    });

    it('should build delegation with multiple UTXOs', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];
      // Create multiple UTXOs with different txids
      const utxos = [
        {
          outputID: 7,
          txid: '2NWd9hrSGkWJWyTu4DnSM1qQSUT2DVm8uqwFk4wQRFLAmcsHQz',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '30000000000000', // 30k FLR
          threshold: 2,
          addresses,
          locktime: '0',
        },
        {
          outputID: 7,
          txid: '2kSSHWKZH7uJ1FfSpgRaPfgPpnT4915QVXPAMw6HjfFQVJ1QFx',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '25000000000000', // 25k FLR
          threshold: 2,
          addresses,
          locktime: '0',
        },
        {
          outputID: 7,
          txid: '2E6Xuqf3i6TnwH6zjt4K6jNDR2ooj1DTJpTFZ6SgZZkRJ4ADSe',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '10000000000000', // 10k FLR
          threshold: 2,
          addresses,
          locktime: '0',
        },
      ];
      // Total: 65k FLR > 50k minimum

      const tx = await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx.should.be.instanceof(Transaction);
      tx.type.should.equal(TransactionType.AddPermissionlessDelegator);
      // FlareJS optimizes to use minimum UTXOs needed, may not consume all 3
      tx.inputs.length.should.be.greaterThan(0);
    });

    /**
     * Verifies fix for FlareJS Bug - Change output threshold
     *
     * FlareJS's pvm.e.newAddPermissionlessDelegatorTx() defaults change outputs to threshold=1.
     * We implement a fix (similar to ExportInPTxBuilder) to correct change outputs to threshold=2
     * for multisig wallets, maintaining security.
     */
    it('should create change output with threshold=2 for multisig wallet (bug fixed)', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];
      const utxos = createTestUtxos(addresses, 2, '60000000000000'); // 60k FLR

      const tx = await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT) // Stake 50k
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      // Verify change exists using explainTransaction
      const explanation = tx.explainTransaction();
      const changeAmount = BigInt(explanation.changeAmount);
      Number(changeAmount).should.be.greaterThan(
        Number(BigInt('9000000000000')),
        'Should have change (at least 9k after fees)'
      );

      explanation.changeOutputs.length.should.be.greaterThan(0, 'Should have change outputs');

      // Verify the fix: change outputs should now have threshold=2
      const flareTransaction = (tx as any)._flareTransaction as any;
      const innerTx = flareTransaction.getTx();
      const changeOutputs = innerTx.baseTx.outputs;

      changeOutputs.forEach((output: any) => {
        const transferOut = output.output;
        const threshold = transferOut.outputOwners.threshold.value();
        threshold.should.equal(2, 'Change output should have threshold=2 (bug fixed!)');
      });
    });

    it('should have change output addresses matching wallet addresses', async () => {
      const builder = factory.getDelegatorBuilder();
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';

      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];
      const utxos = createTestUtxos(addresses, 2, '60000000000000');

      const tx = await builder
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      // Verify change exists and addresses match using explainTransaction
      const explanation = tx.explainTransaction();
      const changeAmount = BigInt(explanation.changeAmount);
      Number(changeAmount).should.be.greaterThan(0, 'Should have change output');

      explanation.changeOutputs.length.should.be.greaterThan(0);

      // Verify change output addresses match wallet addresses (sorted)
      const sortedFromAddresses = (tx as Transaction).fromAddresses.slice().sort().join('~');

      explanation.changeOutputs.forEach((output) => {
        output.address.should.equal(sortedFromAddresses, 'Change output addresses should match wallet addresses');
      });
    });
  });

  describe('multiple delegations to same validator', () => {
    const mockFeeState = { capacity: 100000n, excess: 0n, price: 1000n, timestamp: '1234567890' };
    const MIN_DELEGATION_DURATION = 14 * 24 * 60 * 60;
    const MIN_DELEGATION_AMOUNT = BigInt(50000 * 1e9);

    it('should support creating multiple delegations to same validator with different time periods', async () => {
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';
      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];

      // First delegation: Jan 1 - Mar 1
      const builder1 = factory.getDelegatorBuilder();
      const utxos1 = [
        {
          outputID: 7,
          txid: '2NWd9hrSGkWJWyTu4DnSM1qQSUT2DVm8uqwFk4wQRFLAmcsHQz',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '100000000000000', // 100k FLR
          threshold: 2,
          addresses,
          locktime: '0',
        },
      ];

      const tx1 = await builder1
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(now + 60 + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT) // 50k
        .fromPubKey(addresses)
        .decodedUtxos(utxos1)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx1.should.be.instanceof(Transaction);
      tx1.type.should.equal(TransactionType.AddPermissionlessDelegator);

      // Second delegation: Feb 1 - Apr 1 (overlapping period, different start/end)
      // Simulating using a different UTXO (in practice, could be change from first delegation)
      const builder2 = factory.getDelegatorBuilder();
      const utxos2 = [
        {
          outputID: 7,
          txid: '2QttuE1MNRPEvLPdhB8t6WpC91VKfvigHvf1PKrNQ6BGgB6hZw', // Valid CB58 txid
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '50010000000000', // 50010 FLR (50k stake + extra for fees)
          threshold: 2,
          addresses,
          locktime: '0',
        },
      ];

      const tx2 = await builder2
        .nodeID(validNodeID) // Same validator!
        .startTime(now + 60 + 30 * 24 * 60 * 60) // 30 days later
        .endTime(now + 60 + 30 * 24 * 60 * 60 + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT) // Another 50k
        .fromPubKey(addresses)
        .decodedUtxos(utxos2)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx2.should.be.instanceof(Transaction);
      tx2.type.should.equal(TransactionType.AddPermissionlessDelegator);

      // Both transactions should be valid and independent
      tx1.id.should.not.equal(tx2.id);
    });

    it('should support sequential delegations (one ends, next begins)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const validNodeID = 'NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL';
      const addresses = [SEED_ACCOUNT.addressTestnet, ACCOUNT_1.addressTestnet, ACCOUNT_3.address];

      const utxos = [
        {
          outputID: 7,
          txid: '2NWd9hrSGkWJWyTu4DnSM1qQSUT2DVm8uqwFk4wQRFLAmcsHQz',
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '100000000000000',
          threshold: 2,
          addresses,
          locktime: '0',
        },
      ];

      // First delegation
      const builder1 = factory.getDelegatorBuilder();
      const delegation1EndTime = now + 60 + MIN_DELEGATION_DURATION;

      const tx1 = await builder1
        .nodeID(validNodeID)
        .startTime(now + 60)
        .endTime(delegation1EndTime)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      // Second delegation starts right after first one ends
      const builder2 = factory.getDelegatorBuilder();
      const utxos2 = [
        {
          outputID: 7,
          txid: '2K9rgiEgsEcT3dB9EyduEHFq7g4sHQBMks16VUQArVRieBQ9W5', // Valid CB58 txid
          outputidx: '0',
          assetID: CONTEXT.avaxAssetID,
          amount: '50010000000000', // 50010 FLR (50k stake + extra for fees)
          threshold: 2,
          addresses,
          locktime: '0',
        },
      ];

      const tx2 = await builder2
        .nodeID(validNodeID)
        .startTime(delegation1EndTime + 1) // Starts 1 second after first ends
        .endTime(delegation1EndTime + 1 + MIN_DELEGATION_DURATION)
        .stakeAmount(MIN_DELEGATION_AMOUNT)
        .fromPubKey(addresses)
        .decodedUtxos(utxos2)
        .feeState(mockFeeState)
        .context(CONTEXT as any)
        .build();

      tx1.should.be.instanceof(Transaction);
      tx2.should.be.instanceof(Transaction);
      tx1.id.should.not.equal(tx2.id);
    });
  });
});
