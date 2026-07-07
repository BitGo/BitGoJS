import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import * as testData from '../../resources/xrp';
import { getMptBuilderFactory } from '../getBuilderFactory';

describe('XRP MPTokenTransfer Builder', () => {
  const factory = getMptBuilderFactory(testData.MPT_ISSUANCE_ID);

  const sender = utils.getAddressDetails(testData.TEST_MULTI_SIG_ACCOUNT.address).address;
  const destination = testData.TEST_SINGLE_SIG_ACCOUNT.address;

  describe('build', () => {
    it('should build a valid MPT Payment transaction', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      should.equal(utils.isValidRawTransaction(rawTx), true);

      const txJson = tx.toJson();
      txJson.transactionType.should.equal('Payment');
      txJson.from.should.equal(sender);
      txJson.destination.should.equal(destination);
      should.exist(txJson.mptAmount);
      (txJson.mptAmount as { mpt_issuance_id: string; value: string }).mpt_issuance_id
        .toUpperCase()
        .should.equal(testData.MPT_ISSUANCE_ID.toUpperCase());
      (txJson.mptAmount as { mpt_issuance_id: string; value: string }).value.should.equal(testData.MPT_AMOUNT_VALUE);
    });

    it('should set the correct internal TransactionType to SendMPT', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      tx.type.should.equal(TransactionType.SendMPT);
    });

    it('should preserve DestinationTag when included in the address', async () => {
      const destinationWithTag = `${destination}?dt=42`;

      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destinationWithTag);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600011);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.destination.should.equal(destination);
      txJson.destinationTag.should.equal(42);
    });

    it('should not set XRP amount field on an MPT Payment', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const txJson = tx.toJson();

      // The XRP/IOU `amount` field must be absent for an MPT Payment
      should.not.exist(txJson.amount);
    });
  });

  describe('round-trip: build → serialize → deserialize', () => {
    it('should rebuild correctly from raw unsigned transaction', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltJson = rebuiltTx.toJson();

      rebuiltTx.type.should.equal(TransactionType.SendMPT);
      rebuiltJson.from.should.equal(sender);
      rebuiltJson.destination.should.equal(destination);
      should.exist(rebuiltJson.mptAmount);
      (rebuiltJson.mptAmount as { mpt_issuance_id: string; value: string }).mpt_issuance_id
        .toUpperCase()
        .should.equal(testData.MPT_ISSUANCE_ID.toUpperCase());
      (rebuiltJson.mptAmount as { mpt_issuance_id: string; value: string }).value.should.equal(
        testData.MPT_AMOUNT_VALUE
      );
    });

    it('should sign correctly after rebuild (multi-sig)', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      rebuilder.setMultiSig();
      rebuilder.sign({ key: testData.SIGNER_USER.prv });
      rebuilder.sign({ key: testData.SIGNER_BITGO.prv });
      const signedTx = await rebuilder.build();

      should.equal(utils.isValidRawTransaction(signedTx.toBroadcastFormat()), true);
    });
  });

  describe('input validation', () => {
    it('should throw if sender is missing', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      await builder.build().should.be.rejectedWith(/missing sender/);
    });

    it('should throw if destination is missing', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      await builder.build().should.be.rejectedWith(/Missing mandatory MPT payment parameters/);
    });

    it('should throw if mptAmount is not set', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      await builder.build().should.be.rejectedWith(/Missing mandatory MPT payment parameters/);
    });

    it('should throw if MPTokenIssuanceID is not 48-char hex', () => {
      const builder = factory.getMptTransferBuilder();
      should(() => builder.mptAmount('TOOSHORT', testData.MPT_AMOUNT_VALUE)).throw(/48-character hex/);
    });

    it('should throw if mptAmount value is not an integer string', () => {
      const builder = factory.getMptTransferBuilder();
      should(() => builder.mptAmount(testData.MPT_ISSUANCE_ID, '1.5')).throw(/non-negative integer/);
    });

    it('should throw if mptAmount value contains non-numeric characters', () => {
      const builder = factory.getMptTransferBuilder();
      should(() => builder.mptAmount(testData.MPT_ISSUANCE_ID, 'abc')).throw(/non-negative integer/);
    });
  });

  describe('transferFee / SendMax', () => {
    it('should set SendMax when transferFee is non-zero', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, '1000000');
      builder.transferFee(100); // 0.1% — same as feesec token
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const payload = tx.getSignablePayload() as Record<string, unknown>;

      should.exist(payload.SendMax);
      (payload.SendMax as { mpt_issuance_id: string; value: string }).value.should.equal('1001000');
    });

    it('should use ceiling division for fractional fees', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, '1'); // 1 unit, fee = ceil(1 * 100 / 100000) = 1
      builder.transferFee(100);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const payload = tx.getSignablePayload() as Record<string, unknown>;

      (payload.SendMax as { value: string }).value.should.equal('2');
    });

    it('should not set SendMax when transferFee is 0', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.transferFee(0);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const payload = tx.getSignablePayload() as Record<string, unknown>;

      should.not.exist(payload.SendMax);
    });

    it('should not set SendMax when transferFee is not called', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const payload = tx.getSignablePayload() as Record<string, unknown>;

      should.not.exist(payload.SendMax);
    });

    it('should throw if transferFee is out of range', () => {
      const builder = factory.getMptTransferBuilder();
      should(() => builder.transferFee(-1)).throw(/0 and 50,000/);
      should(() => builder.transferFee(50_001)).throw(/0 and 50,000/);
    });

    it('should preserve SendMax through build→serialize→rebuild round-trip', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, '1000000');
      builder.transferFee(100);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const rawTx = tx.toBroadcastFormat();

      const rebuilder = factory.from(rawTx);
      const rebuiltTx = await rebuilder.build();
      const rebuiltPayload = rebuiltTx.getSignablePayload() as Record<string, unknown>;

      should.exist(rebuiltPayload.SendMax);
      (rebuiltPayload.SendMax as { value: string }).value.should.equal('1001000');
    });
  });

  describe('explainTransaction', () => {
    it('should return explanation with outputs for MPT transfer', async () => {
      const builder = factory.getMptTransferBuilder();
      builder.sender(sender);
      builder.to(destination);
      builder.mptAmount(testData.MPT_ISSUANCE_ID, testData.MPT_AMOUNT_VALUE);
      builder.sequence(1600010);
      builder.fee('12');
      builder.flags(2147483648);

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      explanation.should.have.property('displayOrder');
      explanation.outputs.length.should.equal(1);
      explanation.outputs[0].address.should.equal(destination);
      explanation.outputs[0].amount.should.equal(testData.MPT_AMOUNT_VALUE);
    });
  });
});
