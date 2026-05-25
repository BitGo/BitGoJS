import should from 'should';
import * as rippleBinaryCodec from 'ripple-binary-codec';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getBuilderFactory } from '../getBuilderFactory';

describe('XRP AccountDelete Builder', () => {
  const factory = getBuilderFactory('txrp');

  // Use single-sig account as sender, multi-sig account base address as destination
  const sender = testData.TEST_SINGLE_SIG_ACCOUNT.address; // rKkq7my4cbS9mEcg8gwdcFW2HHxoYwRzny
  const destinationBase = 'raJ4NmhHr2j2SGkmVFeMqKR5MUSWXjNF9a';
  const destinationWithTag = 'raJ4NmhHr2j2SGkmVFeMqKR5MUSWXjNF9a?dt=1';

  describe('Succeed', () => {
    it('should build an AccountDelete transaction without a destination tag', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.to(destinationBase);
      txBuilder.sender(sender);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      should.equal(utils.isValidRawTransaction(rawTx), true);

      const decoded = rippleBinaryCodec.decode(rawTx);
      (decoded as any).TransactionType.should.equal('AccountDelete');
      (decoded as any).Account.should.equal(sender);
      (decoded as any).Destination.should.equal(destinationBase);
      should.not.exist((decoded as any).DestinationTag);
    });

    it('should build an AccountDelete transaction with a destination tag', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.to(destinationWithTag);
      txBuilder.sender(sender);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      should.equal(utils.isValidRawTransaction(rawTx), true);

      const decoded = rippleBinaryCodec.decode(rawTx);
      (decoded as any).TransactionType.should.equal('AccountDelete');
      (decoded as any).Account.should.equal(sender);
      (decoded as any).Destination.should.equal(destinationBase);
      ((decoded as any).DestinationTag as number).should.equal(1);
    });

    it('should rebuild an AccountDelete transaction from its raw broadcast format', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.to(destinationBase);
      txBuilder.sender(sender);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      // factory.from() should route to AccountDeleteBuilder and reproduce identical bytes
      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();

      rebuiltRawTx.should.equal(rawTx);
    });

    it('should rebuild an AccountDelete transaction with destination tag from raw', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.to(destinationWithTag);
      txBuilder.sender(sender);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltRawTx = rebuiltTx.toBroadcastFormat();

      rebuiltRawTx.should.equal(rawTx);

      const decoded = rippleBinaryCodec.decode(rebuiltRawTx);
      ((decoded as any).DestinationTag as number).should.equal(1);
    });
  });

  describe('Fail', () => {
    it('should fail to build when destination is not set', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.sender(sender);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      await txBuilder.build().should.be.rejectedWith('Destination must be set before building the transaction');
    });

    it('should fail to build when sender is not set', async function () {
      const txBuilder = factory.getAccountDeleteBuilder();
      txBuilder.to(destinationBase);
      txBuilder.sequence(1545099);
      txBuilder.fee('2000000');
      txBuilder.flags(2147483648);

      await txBuilder.build().should.be.rejectedWith('Invalid transaction: missing sender');
    });
  });
});
