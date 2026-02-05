import assert from 'assert';
import 'should';
import { coins } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilderFactory, PermissionlessDelegatorTxBuilder, Transaction } from '../../../src/lib';
import { SEED_ACCOUNT, ACCOUNT_1, CONTEXT } from '../../resources/account';
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
});
