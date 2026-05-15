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
 *   buildTransferData() merges same-account entries to produce a SINGLE
 *   accountAmounts entry: [{accountId, 0}] (net of -1 + 1).
 *   This avoids Hedera's ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS rejection.
 *
 *   getTransferData() (in transaction.ts) handles zero-amount entries via
 *   its self-transfer fallback, so toJson() correctly reports the recipient.
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

      // inputs and outputs both reference the same address
      tx.inputs.length.should.equal(1);
      tx.inputs[0].address.should.equal(SOURCE);

      tx.outputs.length.should.equal(1);
      tx.outputs[0].address.should.equal(SOURCE);
    });

    it('should produce a single merged accountAmounts entry in the protobuf', async () => {
      const tx = await initSelfTransferBuilder().build();

      // Access the raw protobuf transfer list
      const transfers = (tx as any).txBody.cryptoTransfer.transfers.accountAmounts as any[];
      should.exist(transfers);
      transfers.length.should.equal(1, 'expected single merged entry: [{source, 0}]');

      // The single entry references the source account with net-zero amount
      const id = transfers[0].accountID;
      const accountId = `${id.shardNum || 0}.${id.realmNum || 0}.${id.accountNum}`;
      (accountId === SOURCE || accountId.endsWith('.81320')).should.be.true();
      Number(transfers[0].amount.toString()).should.equal(0);
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

    it('should not merge entries for normal transfers (sender != recipient)', async () => {
      const RECIPIENT = testData.ACCOUNT_2.accountId; // '0.0.75861'
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: testData.FEE });
      txBuilder.source({ address: SOURCE });
      txBuilder.send({ address: RECIPIENT, amount: '100' });
      txBuilder.node({ nodeId: '0.0.3' });
      txBuilder.startTime('1596110493.372646570');
      const tx = await txBuilder.build();

      // Normal transfer: two distinct entries (sender and recipient)
      const transfers = (tx as any).txBody.cryptoTransfer.transfers.accountAmounts as any[];
      should.exist(transfers);
      transfers.length.should.equal(2, 'expected two entries for normal transfer');

      const amounts = transfers.map((a: any) => Number(a.amount.toString()));
      amounts.should.containEql(-100);
      amounts.should.containEql(100);
    });

    it('should merge sender entry when sender is also a recipient in multi-recipient transfer', async () => {
      const OTHER = testData.ACCOUNT_3.accountId; // '0.0.78963'
      const txBuilder = factory.getTransferBuilder();
      txBuilder.fee({ fee: testData.FEE });
      txBuilder.source({ address: SOURCE });
      txBuilder.send({ address: OTHER, amount: '100' });
      txBuilder.send({ address: SOURCE, amount: '50' }); // sender is also a recipient
      txBuilder.node({ nodeId: '0.0.3' });
      txBuilder.startTime('1596110493.372646570');
      const tx = await txBuilder.build();

      // Sender 0.0.81320 appears as both sender (-150) and recipient (+50).
      // Merge collapses to net -100. Without merge, Hedera rejects with
      // ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS.
      const transfers = (tx as any).txBody.cryptoTransfer.transfers.accountAmounts as any[];
      should.exist(transfers);
      transfers.length.should.equal(2, 'expected two entries after merging sender with self-recipient');

      const entryByAccount: Record<string, number> = {};
      transfers.forEach((a: any) => {
        const id = `${a.accountID.shardNum || 0}.${a.accountID.realmNum || 0}.${a.accountID.accountNum}`;
        entryByAccount[id] = Number(a.amount.toString());
      });

      // SOURCE: -150 (total send) + 50 (self-recipient) = net -100
      entryByAccount[SOURCE].should.equal(-100);
      // OTHER: +100 (unchanged)
      entryByAccount[OTHER].should.equal(100);
    });
  });
});
