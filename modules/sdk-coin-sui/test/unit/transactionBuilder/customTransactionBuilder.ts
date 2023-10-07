import { coins } from '@bitgo/statics';
import { CustomTransaction } from '../../../src/lib/customTransaction';
import { CUSTOM_TX_STAKING_POOL_SPLIT, UNSUPPORTED_TX } from '../../resources/sui';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import { Transaction as SuiTransaction } from '../../../src';
import { SuiTransactionType } from '../../../src/lib/iface';

describe('Sui Custom Transaction Builder', () => {
  const coinName = 'tsui';
  const factory = getBuilderFactory(coinName);

  describe('Succeed', () => {
    it('should build a custom tx from raw tx hex and explain tx', async function () {
      const tx = new CustomTransaction(coins.get('tsui'));
      tx.fromRawTransaction(CUSTOM_TX_STAKING_POOL_SPLIT);
      should.equal(tx.type, TransactionType.CustomTx);
      should.equal(tx.id, '3HzMxgn3F8WCL1J3Qrk9iLhPpDnGYcSnK36CJ78s7jKg');
      should.equal(tx.inputs.length, 1);
      should.equal(tx.inputs[0].address, '0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf');
      should.equal(tx.inputs[0].value, '5000000000');
      should.equal(tx.inputs[0].coin, coinName);
      should.equal(tx.outputs.length, 1);
      should.equal(tx.outputs[0].address, '0x5be5ee85cf5825bd07df7bbe78f19bcaafd42e9e685fda1acf24233cd7b925a6');
      should.equal(tx.outputs[0].value, '5000000000');
      should.equal(tx.outputs[0].coin, coinName);

      const txData = tx.getTxData();
      should.equal(txData.sender, '0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf');
      should.equal(txData.expiration['None'], null);
      should.equal(txData.gasData.budget, '1000000000');
      should.equal(txData.kind.ProgrammableTransaction.inputs.length, 3);
      should.equal(txData.kind.ProgrammableTransaction.transactions.length, 2);

      const txJson = tx.toJson();
      should.equal(txJson.sender, '0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf');
      should.equal(txJson.expiration['None'], null);
      should.equal(txJson.gasData.budget, '1000000000');
      should.equal(txJson.kind.ProgrammableTransaction.inputs.length, 3);
      should.equal(txJson.kind.ProgrammableTransaction.transactions.length, 2);

      const explainedTx = tx.explainTransaction();
      should.equal(explainedTx.id, '3HzMxgn3F8WCL1J3Qrk9iLhPpDnGYcSnK36CJ78s7jKg');
      should.equal(explainedTx.outputs.length, 1);
      should.equal(
        explainedTx.outputs[0].address,
        '0x5be5ee85cf5825bd07df7bbe78f19bcaafd42e9e685fda1acf24233cd7b925a6'
      );
      should.equal(explainedTx.outputs[0].amount, '5000000000');
      should.equal(explainedTx.outputAmount, '5000000000');
      should.equal(explainedTx.fee.fee, '1000000000');
      should.equal(explainedTx.type, TransactionType.CustomTx);

      const recipients = tx.recipients;
      should.equal(recipients.length, 1);
      should.equal(recipients[0].address, '0x5be5ee85cf5825bd07df7bbe78f19bcaafd42e9e685fda1acf24233cd7b925a6');
    });

    it('should init builder from a custom tx', async function () {
      const tx = new CustomTransaction(coins.get('tsui'));
      tx.fromRawTransaction(CUSTOM_TX_STAKING_POOL_SPLIT);
      const txBuilder = factory.getCustomTransactionBuilder();
      txBuilder.initBuilder(tx);
      const rebuiltTx = (await txBuilder.build()) as SuiTransaction<CustomTransaction>;
      should.equal(rebuiltTx.type, TransactionType.CustomTx);
      should.equal(rebuiltTx.id, '3HzMxgn3F8WCL1J3Qrk9iLhPpDnGYcSnK36CJ78s7jKg');
      should.equal(rebuiltTx.inputs.length, 1);
      should.equal(rebuiltTx.inputs[0].address, '0x6c10d1bf12e4610da1d92ef15e6bc581e1d5e79db33024e8cc1e00c21f0c7ddf');
      should.equal(rebuiltTx.inputs[0].value, '5000000000');
      should.equal(rebuiltTx.inputs[0].coin, coinName);
      should.equal(rebuiltTx.outputs.length, 1);
      should.equal(rebuiltTx.outputs[0].address, '0x5be5ee85cf5825bd07df7bbe78f19bcaafd42e9e685fda1acf24233cd7b925a6');
      should.equal(rebuiltTx.outputs[0].value, '5000000000');
      should.equal(rebuiltTx.outputs[0].coin, coinName);
    });

    it('should build a custom tx and serialize it and deserialize it', async function () {
      const tx = new CustomTransaction(coins.get('tsui'));
      tx.fromRawTransaction(CUSTOM_TX_STAKING_POOL_SPLIT);
      should.equal(tx.suiTransaction.type, SuiTransactionType.CustomTx);
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, CUSTOM_TX_STAKING_POOL_SPLIT);
      const deserialized = (await factory.from(rawTx).build()) as CustomTransaction;
      should.deepEqual(deserialized, tx);
      deserialized.toBroadcastFormat().should.equal(rawTx);
    });

    it('should reject a custom tx with unsupported txn type', async function () {
      should(() => factory.from(UNSUPPORTED_TX)).throwError(
        'unsupported target method 0000000000000000000000000000000000000000000000000000000000000003::staking_pool::split_staked_sui'
      );
    });
  });
});
