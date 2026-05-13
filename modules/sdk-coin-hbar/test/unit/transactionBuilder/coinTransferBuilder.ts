import * as should from 'should';
import { getBuilderFactory } from '../getBuilderFactory';
import * as testData from '../../resources/hbar';

/**
 * Tests for CoinTransferBuilder self-transfer (stakeClaimRewards).
 *
 * HBAR staking rewards are claimed by submitting a 1-tinybar CryptoTransfer
 * where sender == receiver == accountId. Hedera atomically flushes
 * pending_reward into account balance on any CryptoTransfer touching the
 * account. staking-service uses this as the CLAIM_REWARDS operation.
 *
 * The key behaviour under test:
 *   buildTransferData() must produce TWO separate accountAmounts entries:
 *     [{accountId, -1}, {accountId, +1}]
 *   The Hedera SDK TransferTransaction merges same-account entries (nets to 0),
 *   so CoinTransferBuilder.buildTransferData() bypasses that by building the
 *   proto list directly.
 *
 *   initTransfers() must reconstruct the self-transfer from serialised bytes:
 *   it filters for positive amounts only, so recipients[0].address == source.
 */
describe('HBAR CoinTransferBuilder - self-transfer (stakeClaimRewards)', () => {
  const factory = getBuilderFactory('thbar');

  const SOURCE = testData.ACCOUNT_1.accountId; // '0.0.81320'

  const initSelfTransferBuilder = () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.fee({ fee: testData.FEE });
    txBuilder.source({ address: SOURCE });
    txBuilder.send({ address: SOURCE, amount: '1' }); // self-transfer: 1 tinybar
    txBuilder.node({ nodeId: '0.0.3' });
    txBuilder.startTime('1596110493.372646570');
    return txBuilder;
  };

  describe('build', () => {
    it('should build a self-transfer transaction with source equal to recipient', async () => {
      const tx = await initSelfTransferBuilder().build();
      const txJson = tx.toJson();

      // Source and recipient are the same account
      should.deepEqual(txJson.from, SOURCE);
      should.deepEqual(txJson.to, SOURCE);
      should.deepEqual(txJson.amount, '1');

      // inputs and outputs both reference the same address
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal(SOURCE);
      tx.inputs[0].value.should.equal('1');

      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal(SOURCE);
      tx.outputs[0].value.should.equal('1');
    });

    it('should produce two separate accountAmounts entries in the protobuf', async () => {
      const tx = await initSelfTransferBuilder().build();

      // Access the raw protobuf transfer list
      const transfers = (tx as any).txBody.cryptoTransfer.transfers.accountAmounts as any[];
      should.exist(transfers);
      transfers.length.should.equal(2, 'expected exactly two entries: [{source,-1},{source,+1}]');

      // Both entries reference the same account
      const accountNums = transfers.map((a: any) => {
        const id = a.accountID;
        return `${id.shardNum || 0}.${id.realmNum || 0}.${id.accountNum}`;
      });
      accountNums.every((id: string) => id === SOURCE || id.endsWith('.81320')).should.be.true();

      // One entry is -1 (debit), one is +1 (credit)
      const amounts = transfers.map((a: any) => Number(a.amount.toString()));
      amounts.should.containEql(-1);
      amounts.should.containEql(1);
    });

    it('should round-trip through serialisation: deserialized tx has source == recipient', async () => {
      const originalTx = await initSelfTransferBuilder().build();
      const txHex = originalTx.toBroadcastFormat();
      should.exist(txHex);
      txHex.length.should.be.greaterThan(0);

      // Rebuild from serialised hex
      const rebuiltBuilder = factory.getTransferBuilder();
      rebuiltBuilder.from(txHex);
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltJson = rebuiltTx.toJson();

      // After round-trip, source and recipient must still be the same account
      should.deepEqual(rebuiltJson.from, SOURCE);
      should.deepEqual(rebuiltJson.to, SOURCE);
      should.deepEqual(rebuiltJson.amount, '1');
    });

    it('should sign a self-transfer transaction successfully', async () => {
      const builder = initSelfTransferBuilder();
      builder.sign({ key: testData.ACCOUNT_1.prvKeyWithPrefix });
      const tx = await builder.build();

      tx.signature.length.should.equal(1);
      const txJson = tx.toJson();
      should.deepEqual(txJson.from, SOURCE);
      should.deepEqual(txJson.to, SOURCE);
    });
  });
});
